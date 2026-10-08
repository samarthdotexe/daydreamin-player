import { create } from "zustand";

import { getAdjacentEra } from "./eras";
import type { EraId } from "./types";

interface EraState {
  activeEra: EraId;
  selectionVersion: number;
  setEra: (id: EraId) => void;
  stepEra: (direction: -1 | 1) => void;
}

export const useEraStore = create<EraState>((set) => ({
  activeEra: "1940s",
  selectionVersion: 0,
  setEra: (activeEra) =>
    set((state) => ({
      activeEra,
      selectionVersion: state.selectionVersion + 1,
    })),
  stepEra: (direction) =>
    set((state) => ({
      activeEra: getAdjacentEra(state.activeEra, direction),
      selectionVersion: state.selectionVersion + 1,
    })),
}));

export type { EraState };
