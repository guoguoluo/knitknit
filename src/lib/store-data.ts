import fs from "fs";
import path from "path";
import os from "os";

function getDataDir(): string {
  const envPath = process.env.YARN_DATA_PATH;
  if (envPath) return path.dirname(envPath);
  return path.join(process.cwd(), "data");
}

function getDataPath(): string {
  const envPath = process.env.YARN_DATA_PATH;
  if (envPath) return envPath;
  return path.join(process.cwd(), "data", "yarn-store.json");
}

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

interface Store {
  yarns: StoredYarn[];
  inspirations: StoredInspiration[];
  tags: string[];
  nextYarnId: number;
  nextInspirationId: number;
}

const dataPath = getDataPath();

let store: Store | null = null;

function getStore(): Store {
  if (store) return store;
  if (fs.existsSync(dataPath)) {
    try {
      store = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
      return store!;
    } catch { /* fall through */ }
  }
  store = { yarns: [], inspirations: [], tags: [], nextYarnId: 1, nextInspirationId: 1 };
  return store;
}

function saveStore() {
  const dir = path.dirname(dataPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(dataPath, JSON.stringify(store, null, 2));
}

function now() {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

export interface Yarn {
  id: number; name: string; brand: string; color: string; material: string;
  weight: string; quantity: number; unit: string; notes: string; photo: string;
  tags: string[]; colors: string[]; created_at: string; updated_at: string;
}

export interface YarnInput {
  name: string; brand?: string; color?: string; material?: string; weight?: string;
  quantity?: number; unit?: string; notes?: string; photo?: string; tags?: string[]; colors?: string[];
}

export interface Inspiration {
  id: number; title: string; url: string; platform: string; image: string;
  notes: string; yarn_id: number | null; tags: string[]; pattern: string;
  created_at: string;
}

export interface InspirationInput {
  title: string; url?: string; platform?: string; image?: string;
  notes?: string; yarn_id?: number | null; tags?: string[]; pattern?: string;
}

export async function getAllYarns(): Promise<Yarn[]> {
  return getStore().yarns.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function getYarnById(id: number): Promise<Yarn | null> {
  return getStore().yarns.find(y => y.id === id) || null;
}

export async function createYarn(input: YarnInput): Promise<Yarn> {
  const s = getStore();
  const yarn: Yarn = {
    id: s.nextYarnId++,
    name: input.name,
    brand: input.brand || "",
    color: input.color || "",
    material: input.material || "",
    weight: input.weight || "",
    quantity: input.quantity || 0,
    unit: input.unit || "g",
    notes: input.notes || "",
    photo: input.photo || "",
    tags: (input.tags || []).map(t => t.trim()).filter(Boolean),
    colors: (input.colors || []).map(c => c.trim()).filter(Boolean),
    created_at: now(),
    updated_at: now(),
  };
  for (const t of yarn.tags) {
    if (!s.tags.includes(t)) s.tags.push(t);
  }
  s.yarns.push(yarn);
  saveStore();
  return yarn;
}

export async function updateYarn(id: number, input: Partial<YarnInput>): Promise<Yarn | null> {
  const s = getStore();
  const idx = s.yarns.findIndex(y => y.id === id);
  if (idx === -1) return null;
  const yarn = s.yarns[idx];
  if (input.name !== undefined) yarn.name = input.name;
  if (input.brand !== undefined) yarn.brand = input.brand;
  if (input.color !== undefined) yarn.color = input.color;
  if (input.material !== undefined) yarn.material = input.material;
  if (input.weight !== undefined) yarn.weight = input.weight;
  if (input.quantity !== undefined) yarn.quantity = input.quantity;
  if (input.unit !== undefined) yarn.unit = input.unit;
  if (input.notes !== undefined) yarn.notes = input.notes;
  if (input.photo !== undefined) yarn.photo = input.photo;
  if (input.tags !== undefined) {
    yarn.tags = input.tags.map(t => t.trim()).filter(Boolean);
    for (const t of yarn.tags) {
      if (!s.tags.includes(t)) s.tags.push(t);
    }
  }
  if (input.colors !== undefined) {
    yarn.colors = input.colors.map(c => c.trim()).filter(Boolean);
  }
  yarn.updated_at = now();
  saveStore();
  return yarn;
}

export async function deleteYarn(id: number): Promise<boolean> {
  const s = getStore();
  const len = s.yarns.length;
  s.yarns = s.yarns.filter(y => y.id !== id);
  saveStore();
  return s.yarns.length !== len;
}

export async function getAllTags(): Promise<string[]> {
  return getStore().tags;
}

export async function getAllInspirations(): Promise<Inspiration[]> {
  return getStore().inspirations.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getInspirationById(id: number): Promise<Inspiration | null> {
  return getStore().inspirations.find(i => i.id === id) || null;
}

export async function createInspiration(input: InspirationInput): Promise<Inspiration> {
  const s = getStore();
  const insp: Inspiration = {
    id: s.nextInspirationId++,
    title: input.title,
    url: input.url || "",
    platform: input.platform || "",
    image: input.image || "",
    notes: input.notes || "",
    yarn_id: input.yarn_id ?? null,
    tags: (input.tags || []).map(t => t.trim()).filter(Boolean),
    pattern: input.pattern || "",
    created_at: now(),
  };
  for (const t of insp.tags) {
    if (!s.tags.includes(t)) s.tags.push(t);
  }
  s.inspirations.push(insp);
  saveStore();
  return insp;
}

export async function updateInspiration(id: number, input: Partial<InspirationInput>): Promise<Inspiration | null> {
  const s = getStore();
  const idx = s.inspirations.findIndex(i => i.id === id);
  if (idx === -1) return null;
  const insp = s.inspirations[idx];
  if (input.title !== undefined) insp.title = input.title;
  if (input.url !== undefined) insp.url = input.url;
  if (input.platform !== undefined) insp.platform = input.platform;
  if (input.image !== undefined) insp.image = input.image;
  if (input.notes !== undefined) insp.notes = input.notes;
  if (input.yarn_id !== undefined) insp.yarn_id = input.yarn_id;
  if (input.pattern !== undefined) insp.pattern = input.pattern;
  if (input.tags !== undefined) {
    insp.tags = input.tags.map(t => t.trim()).filter(Boolean);
    for (const t of insp.tags) {
      if (!s.tags.includes(t)) s.tags.push(t);
    }
  }
  saveStore();
  return insp;
}

export async function deleteInspiration(id: number): Promise<boolean> {
  const s = getStore();
  const len = s.inspirations.length;
  s.inspirations = s.inspirations.filter(i => i.id !== id);
  saveStore();
  return s.inspirations.length !== len;
}

export async function getFullStore(): Promise<Store> {
  return JSON.parse(JSON.stringify(getStore()));
}

export async function importStore(data: Store): Promise<void> {
  store = data;
  saveStore();
}

export async function getRecommendations(yarnId: number): Promise<Inspiration[]> {
  const yarn = await getYarnById(yarnId);
  if (!yarn) return [];
  const queryTerms = [yarn.color, yarn.material, yarn.weight, ...yarn.tags]
    .filter(Boolean).map(s => s.trim().toLowerCase()).filter(s => s.length > 0);
  const s = getStore();
  return s.inspirations.map(insp => {
    const matchCount = [insp.title, insp.notes, insp.platform, ...insp.tags]
      .filter(Boolean).map(s => s.toLowerCase())
      .filter(t => queryTerms.some(q => t.includes(q))).length;
    return { ...insp, _score: matchCount };
  }).sort((a, b) => (b as any)._score - (a as any)._score);
}