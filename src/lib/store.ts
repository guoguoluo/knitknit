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

export const useYarnStore = create<YarnStore>((set, get) => ({
  yarns: [],
  loading: false,
  fetchYarns: async () => {
    set({ loading: true });
    const yarns = local.getAllYarns();
    set({ yarns, loading: false });
  },
  createYarn: async (input) => {
    const yarn = local.createYarn(input);
    set({ yarns: [yarn, ...get().yarns] });
    return yarn;
  },
  updateYarn: async (id, input) => {
    const yarn = local.updateYarn(id, input);
    if (yarn) set({ yarns: get().yarns.map(y => y.id === id ? yarn : y) });
    return yarn;
  },
  deleteYarn: async (id) => {
    local.deleteYarn(id);
    set({ yarns: get().yarns.filter(y => y.id !== id) });
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

export const useInspirationStore = create<InspirationStore>((set, get) => ({
  inspirations: [],
  loading: false,
  fetchInspirations: async () => {
    set({ loading: true });
    const inspirations = local.getAllInspirations();
    set({ inspirations, loading: false });
  },
  createInspiration: async (input) => {
    const insp = local.createInspiration(input);
    set({ inspirations: [insp, ...get().inspirations] });
    return insp;
  },
  updateInspiration: async (id, input) => {
    const insp = local.updateInspiration(id, input);
    if (insp) set({ inspirations: get().inspirations.map(i => i.id === id ? insp : i) });
    return insp;
  },
  deleteInspiration: async (id) => {
    local.deleteInspiration(id);
    set({ inspirations: get().inspirations.filter(i => i.id !== id) });
  },
}));

export async function exportData(): Promise<void> {
  const store = local.getFullStore();
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
  local.importStore(data);
}
