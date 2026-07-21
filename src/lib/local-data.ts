const STORAGE_KEY = "yarn-inspire-v1";
const MEDIA_DB = "yarn-inspire-media";
const MEDIA_STORE = "media";
const MEDIA_PREFIX = "idb://knit-media/";

interface StoredYarn {
  id: number; name: string; brand: string; color: string; material: string;
  weight: string; quantity: number; unit: string; notes: string; photo: string;
  tags: string[]; colors: string[]; created_at: string; updated_at: string;
}

interface StoredInspiration {
  id: number; title: string; url: string; platform: string; image: string;
  notes: string; yarn_id: number | null; tags: string[]; pattern: string;
  created_at: string;
}

interface AppData {
  yarns: StoredYarn[];
  inspirations: StoredInspiration[];
  tags: string[];
  nextYarnId: number;
  nextInspirationId: number;
}

function emptyData(): AppData {
  return { yarns: [], inspirations: [], tags: [], nextYarnId: 1, nextInspirationId: 1 };
}

let cache: AppData | null = null;
let migrationPromise: Promise<void> | null = null;
let mediaDbPromise: Promise<IDBDatabase> | null = null;

function getData(): AppData {
  if (cache) return cache;
  if (typeof window === "undefined") {
    cache = emptyData();
    return cache;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      cache = JSON.parse(raw) as AppData;
      cache.yarns ||= [];
      cache.inspirations ||= [];
      cache.tags ||= [];
      return cache;
    }
  } catch { /* ignore */ }
  cache = emptyData();
  return cache;
}

function saveData() {
  if (typeof window !== "undefined" && cache) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  }
}

function now() {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

function isInlineAsset(value: string | undefined): value is string {
  return typeof value === "string" && value.startsWith("data:");
}

function isMediaRef(value: string | undefined): value is string {
  return typeof value === "string" && value.startsWith(MEDIA_PREFIX);
}

function mediaKey(ref: string): string {
  return ref.slice(MEDIA_PREFIX.length);
}

function createMediaKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function openMediaDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("IndexedDB unavailable"));
  if (mediaDbPromise) return mediaDbPromise;
  mediaDbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(MEDIA_DB, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(MEDIA_STORE)) db.createObjectStore(MEDIA_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return mediaDbPromise;
}

async function mediaPut(key: string, value: string): Promise<void> {
  const db = await openMediaDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(MEDIA_STORE, "readwrite");
    tx.objectStore(MEDIA_STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function mediaGet(key: string): Promise<string> {
  try {
    const db = await openMediaDb();
    return await new Promise<string>((resolve, reject) => {
      const tx = db.transaction(MEDIA_STORE, "readonly");
      const request = tx.objectStore(MEDIA_STORE).get(key);
      request.onsuccess = () => resolve(typeof request.result === "string" ? request.result : "");
      request.onerror = () => reject(request.error);
    });
  } catch {
    return "";
  }
}

async function mediaDelete(ref: string): Promise<void> {
  if (!isMediaRef(ref)) return;
  try {
    const db = await openMediaDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(MEDIA_STORE, "readwrite");
      tx.objectStore(MEDIA_STORE).delete(mediaKey(ref));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch { /* ignore */ }
}

async function storeMediaValue(value: string, previousRef?: string): Promise<string> {
  if (!isInlineAsset(value)) return value;
  const key = isMediaRef(previousRef) ? mediaKey(previousRef) : createMediaKey();
  await mediaPut(key, value);
  return `${MEDIA_PREFIX}${key}`;
}

async function resolveMediaValue(value: string): Promise<string> {
  if (!isMediaRef(value)) return value;
  return mediaGet(mediaKey(value));
}

async function resolveYarn(yarn: StoredYarn): Promise<StoredYarn> {
  return { ...yarn, photo: await resolveMediaValue(yarn.photo) };
}

async function resolveInspiration(insp: StoredInspiration): Promise<StoredInspiration> {
  return {
    ...insp,
    image: await resolveMediaValue(insp.image),
    pattern: await resolveMediaValue(insp.pattern),
  };
}

async function ensureMediaMigrated(): Promise<void> {
  if (typeof window === "undefined") return;
  if (migrationPromise) return migrationPromise;
  migrationPromise = (async () => {
    const d = getData();
    let changed = false;

    for (const yarn of d.yarns) {
      if (isInlineAsset(yarn.photo)) {
        yarn.photo = await storeMediaValue(yarn.photo);
        changed = true;
      }
    }

    for (const insp of d.inspirations) {
      if (isInlineAsset(insp.image)) {
        insp.image = await storeMediaValue(insp.image);
        changed = true;
      }
      if (isInlineAsset(insp.pattern)) {
        insp.pattern = await storeMediaValue(insp.pattern);
        changed = true;
      }
    }

    if (changed) saveData();
  })().finally(() => {
    migrationPromise = null;
  });
  return migrationPromise;
}

async function prepareImport(data: AppData): Promise<AppData> {
  const copy: AppData = JSON.parse(JSON.stringify(data));
  copy.yarns ||= [];
  copy.inspirations ||= [];
  copy.tags ||= [];
  for (const yarn of copy.yarns) {
    if (isInlineAsset(yarn.photo)) yarn.photo = await storeMediaValue(yarn.photo);
  }
  for (const insp of copy.inspirations) {
    if (isInlineAsset(insp.image)) insp.image = await storeMediaValue(insp.image);
    if (isInlineAsset(insp.pattern)) insp.pattern = await storeMediaValue(insp.pattern);
  }
  return copy;
}

export type { StoredYarn, StoredInspiration, AppData };

export async function getAllYarns(): Promise<StoredYarn[]> {
  await ensureMediaMigrated();
  const yarns = [...getData().yarns].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  return Promise.all(yarns.map(resolveYarn));
}

export async function getYarnById(id: number): Promise<StoredYarn | null> {
  await ensureMediaMigrated();
  const yarn = getData().yarns.find(y => y.id === id);
  return yarn ? resolveYarn(yarn) : null;
}

export interface YarnInput {
  name: string; brand?: string; color?: string; material?: string; weight?: string;
  quantity?: number; unit?: string; notes?: string; photo?: string; tags?: string[]; colors?: string[];
}

export async function createYarn(input: YarnInput): Promise<StoredYarn> {
  await ensureMediaMigrated();
  const d = getData();
  const yarn: StoredYarn = {
    id: d.nextYarnId++,
    name: input.name,
    brand: input.brand || "",
    color: input.color || "",
    material: input.material || "",
    weight: input.weight || "",
    quantity: input.quantity || 0,
    unit: input.unit || "g",
    notes: input.notes || "",
    photo: await storeMediaValue(input.photo || ""),
    tags: (input.tags || []).map(t => t.trim()).filter(Boolean),
    colors: (input.colors || []).map(c => c.trim()).filter(Boolean),
    created_at: now(),
    updated_at: now(),
  };
  for (const t of yarn.tags) {
    if (!d.tags.includes(t)) d.tags.push(t);
  }
  d.yarns.push(yarn);
  saveData();
  return resolveYarn(yarn);
}

export async function updateYarn(id: number, input: Partial<YarnInput>): Promise<StoredYarn | null> {
  await ensureMediaMigrated();
  const d = getData();
  const idx = d.yarns.findIndex(y => y.id === id);
  if (idx === -1) return null;
  const yarn = d.yarns[idx];
  if (input.name !== undefined) yarn.name = input.name;
  if (input.brand !== undefined) yarn.brand = input.brand;
  if (input.color !== undefined) yarn.color = input.color;
  if (input.material !== undefined) yarn.material = input.material;
  if (input.weight !== undefined) yarn.weight = input.weight;
  if (input.quantity !== undefined) yarn.quantity = input.quantity;
  if (input.unit !== undefined) yarn.unit = input.unit;
  if (input.notes !== undefined) yarn.notes = input.notes;
  if (input.photo !== undefined) {
    const oldPhoto = yarn.photo;
    yarn.photo = await storeMediaValue(input.photo, oldPhoto);
    if (oldPhoto && oldPhoto !== yarn.photo) await mediaDelete(oldPhoto);
  }
  if (input.tags !== undefined) {
    yarn.tags = input.tags.map(t => t.trim()).filter(Boolean);
    for (const t of yarn.tags) {
      if (!d.tags.includes(t)) d.tags.push(t);
    }
  }
  if (input.colors !== undefined) {
    yarn.colors = input.colors.map(c => c.trim()).filter(Boolean);
  }
  yarn.updated_at = now();
  saveData();
  return resolveYarn(yarn);
}

export async function deleteYarn(id: number): Promise<boolean> {
  await ensureMediaMigrated();
  const d = getData();
  const yarn = d.yarns.find(y => y.id === id);
  const len = d.yarns.length;
  d.yarns = d.yarns.filter(y => y.id !== id);
  if (yarn) await mediaDelete(yarn.photo);
  saveData();
  return d.yarns.length !== len;
}

export async function getAllInspirations(): Promise<StoredInspiration[]> {
  await ensureMediaMigrated();
  const inspirations = [...getData().inspirations].sort((a, b) => b.created_at.localeCompare(a.created_at));
  return Promise.all(inspirations.map(resolveInspiration));
}

export async function getInspirationById(id: number): Promise<StoredInspiration | null> {
  await ensureMediaMigrated();
  const insp = getData().inspirations.find(i => i.id === id);
  return insp ? resolveInspiration(insp) : null;
}

export interface InspirationInput {
  title: string; url?: string; platform?: string; image?: string;
  notes?: string; yarn_id?: number | null; tags?: string[]; pattern?: string;
}

export async function createInspiration(input: InspirationInput): Promise<StoredInspiration> {
  await ensureMediaMigrated();
  const d = getData();
  const insp: StoredInspiration = {
    id: d.nextInspirationId++,
    title: input.title,
    url: input.url || "",
    platform: input.platform || "",
    image: await storeMediaValue(input.image || ""),
    notes: input.notes || "",
    yarn_id: input.yarn_id ?? null,
    tags: (input.tags || []).map(t => t.trim()).filter(Boolean),
    pattern: await storeMediaValue(input.pattern || ""),
    created_at: now(),
  };
  for (const t of insp.tags) {
    if (!d.tags.includes(t)) d.tags.push(t);
  }
  d.inspirations.push(insp);
  saveData();
  return resolveInspiration(insp);
}

export async function updateInspiration(id: number, input: Partial<InspirationInput>): Promise<StoredInspiration | null> {
  await ensureMediaMigrated();
  const d = getData();
  const idx = d.inspirations.findIndex(i => i.id === id);
  if (idx === -1) return null;
  const insp = d.inspirations[idx];
  if (input.title !== undefined) insp.title = input.title;
  if (input.url !== undefined) insp.url = input.url;
  if (input.platform !== undefined) insp.platform = input.platform;
  if (input.image !== undefined) {
    const oldImage = insp.image;
    insp.image = await storeMediaValue(input.image, oldImage);
    if (oldImage && oldImage !== insp.image) await mediaDelete(oldImage);
  }
  if (input.notes !== undefined) insp.notes = input.notes;
  if (input.yarn_id !== undefined) insp.yarn_id = input.yarn_id;
  if (input.pattern !== undefined) {
    const oldPattern = insp.pattern;
    insp.pattern = await storeMediaValue(input.pattern, oldPattern);
    if (oldPattern && oldPattern !== insp.pattern) await mediaDelete(oldPattern);
  }
  if (input.tags !== undefined) {
    insp.tags = input.tags.map(t => t.trim()).filter(Boolean);
    for (const t of insp.tags) {
      if (!d.tags.includes(t)) d.tags.push(t);
    }
  }
  saveData();
  return resolveInspiration(insp);
}

export async function deleteInspiration(id: number): Promise<boolean> {
  await ensureMediaMigrated();
  const d = getData();
  const insp = d.inspirations.find(i => i.id === id);
  const len = d.inspirations.length;
  d.inspirations = d.inspirations.filter(i => i.id !== id);
  if (insp) {
    await mediaDelete(insp.image);
    await mediaDelete(insp.pattern);
  }
  saveData();
  return d.inspirations.length !== len;
}

export async function getRecommendations(yarnId: number): Promise<StoredInspiration[]> {
  await ensureMediaMigrated();
  const yarn = getData().yarns.find(y => y.id === yarnId);
  if (!yarn) return [];
  const queryTerms = [yarn.color, yarn.material, yarn.weight, ...yarn.tags]
    .filter(Boolean).map(s => s.trim().toLowerCase()).filter(s => s.length > 0);
  const recommendations = getData().inspirations.map(insp => {
    const matchCount = [insp.title, insp.notes, insp.platform, ...insp.tags]
      .filter(Boolean).map(s => s.toLowerCase())
      .filter(t => queryTerms.some(q => t.includes(q))).length;
    return { ...insp, _score: matchCount };
  }).sort((a, b) => (b as any)._score - (a as any)._score);
  return Promise.all(recommendations.map(resolveInspiration));
}

export async function getFullStore(): Promise<AppData> {
  await ensureMediaMigrated();
  const d = getData();
  return {
    ...JSON.parse(JSON.stringify(d)),
    yarns: await Promise.all(d.yarns.map(resolveYarn)),
    inspirations: await Promise.all(d.inspirations.map(resolveInspiration)),
  };
}

export async function importStore(data: AppData): Promise<void> {
  cache = await prepareImport(data);
  saveData();
}
