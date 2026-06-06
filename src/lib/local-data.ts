const STORAGE_KEY = "yarn-inspire-v1";

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

function getData(): AppData {
  if (cache) return cache;
  if (typeof window === "undefined") {
    cache = emptyData();
    return cache;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: AppData = JSON.parse(raw);
      cache = parsed;
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

export type { StoredYarn, StoredInspiration, AppData };

export function getAllYarns(): StoredYarn[] {
  return getData().yarns.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export function getYarnById(id: number): StoredYarn | null {
  return getData().yarns.find(y => y.id === id) || null;
}

export interface YarnInput {
  name: string; brand?: string; color?: string; material?: string; weight?: string;
  quantity?: number; unit?: string; notes?: string; photo?: string; tags?: string[]; colors?: string[];
}

export function createYarn(input: YarnInput): StoredYarn {
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
    photo: input.photo || "",
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
  return yarn;
}

export function updateYarn(id: number, input: Partial<YarnInput>): StoredYarn | null {
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
  if (input.photo !== undefined) yarn.photo = input.photo;
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
  return yarn;
}

export function deleteYarn(id: number): boolean {
  const d = getData();
  const len = d.yarns.length;
  d.yarns = d.yarns.filter(y => y.id !== id);
  saveData();
  return d.yarns.length !== len;
}

export function getAllInspirations(): StoredInspiration[] {
  return getData().inspirations.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function getInspirationById(id: number): StoredInspiration | null {
  return getData().inspirations.find(i => i.id === id) || null;
}

export interface InspirationInput {
  title: string; url?: string; platform?: string; image?: string;
  notes?: string; yarn_id?: number | null; tags?: string[]; pattern?: string;
}

export function createInspiration(input: InspirationInput): StoredInspiration {
  const d = getData();
  const insp: StoredInspiration = {
    id: d.nextInspirationId++,
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
    if (!d.tags.includes(t)) d.tags.push(t);
  }
  d.inspirations.push(insp);
  saveData();
  return insp;
}

export function updateInspiration(id: number, input: Partial<InspirationInput>): StoredInspiration | null {
  const d = getData();
  const idx = d.inspirations.findIndex(i => i.id === id);
  if (idx === -1) return null;
  const insp = d.inspirations[idx];
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
      if (!d.tags.includes(t)) d.tags.push(t);
    }
  }
  saveData();
  return insp;
}

export function deleteInspiration(id: number): boolean {
  const d = getData();
  const len = d.inspirations.length;
  d.inspirations = d.inspirations.filter(i => i.id !== id);
  saveData();
  return d.inspirations.length !== len;
}

export function getRecommendations(yarnId: number): StoredInspiration[] {
  const yarn = getYarnById(yarnId);
  if (!yarn) return [];
  const queryTerms = [yarn.color, yarn.material, yarn.weight, ...yarn.tags]
    .filter(Boolean).map(s => s.trim().toLowerCase()).filter(s => s.length > 0);
  const d = getData();
  return d.inspirations.map(insp => {
    const matchCount = [insp.title, insp.notes, insp.platform, ...insp.tags]
      .filter(Boolean).map(s => s.toLowerCase())
      .filter(t => queryTerms.some(q => t.includes(q))).length;
    return { ...insp, _score: matchCount };
  }).sort((a, b) => (b as any)._score - (a as any)._score);
}

export function getFullStore(): AppData {
  return JSON.parse(JSON.stringify(getData()));
}

export function importStore(data: AppData): void {
  cache = data;
  saveData();
}
