import { create } from "zustand";
import type { StoredYarn as Yarn, StoredInspiration as Inspiration } from "@/lib/local-data";
import type { YarnInput, InspirationInput } from "@/lib/local-data";
import * as local from "@/lib/local-data";

interface YarnStore {
  yarns: Yarn[];
  loading: boolean;
  fetchYarns: () => Promise<void>;
  createYarn: (input: YarnInput) => Promise<Yarn>;
  updateYarn: (id: number, input: Partial<YarnInput>) => Promise<Yarn | null>;
  deleteYarn: (id: number) => Promise<void>;
}

export const useYarnStore = create<YarnStore>((set) => ({
  yarns: [],
  loading: false,
  fetchYarns: async () => {
    set({ loading: true });
    const yarns = await local.getAllYarns();
    set({ yarns, loading: false });
  },
  createYarn: async (input) => {
    const yarn = await local.createYarn(input);
    set({ yarns: await local.getAllYarns() });
    return yarn;
  },
  updateYarn: async (id, input) => {
    const yarn = await local.updateYarn(id, input);
    if (yarn) set({ yarns: await local.getAllYarns() });
    return yarn;
  },
  deleteYarn: async (id) => {
    await local.deleteYarn(id);
    set({ yarns: await local.getAllYarns() });
  },
}));

interface InspirationStore {
  inspirations: Inspiration[];
  loading: boolean;
  fetchInspirations: () => Promise<void>;
  createInspiration: (input: InspirationInput) => Promise<Inspiration>;
  updateInspiration: (id: number, input: Partial<InspirationInput>) => Promise<Inspiration | null>;
  deleteInspiration: (id: number) => Promise<void>;
}

export const useInspirationStore = create<InspirationStore>((set) => ({
  inspirations: [],
  loading: false,
  fetchInspirations: async () => {
    set({ loading: true });
    const inspirations = await local.getAllInspirations();
    set({ inspirations, loading: false });
  },
  createInspiration: async (input) => {
    const insp = await local.createInspiration(input);
    set({ inspirations: await local.getAllInspirations() });
    return insp;
  },
  updateInspiration: async (id, input) => {
    const insp = await local.updateInspiration(id, input);
    if (insp) set({ inspirations: await local.getAllInspirations() });
    return insp;
  },
  deleteInspiration: async (id) => {
    await local.deleteInspiration(id);
    set({ inspirations: await local.getAllInspirations() });
  },
}));

export async function exportData(): Promise<void> {
  const store = await local.getFullStore();
  const json = JSON.stringify(store, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `yarn-store-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importData(file: File): Promise<void> {
  const text = await file.text();
  const data = JSON.parse(text);
  if (!data.yarns || !data.inspirations || typeof data.nextYarnId !== "number") {
    throw new Error("invalid format");
  }
  await local.importStore(data);
}
