import { create } from "zustand";

export interface LoginReloadState {
    reloadFlag: boolean;
    triggerReload: () => void;
}

export const useLoginReloadStore = create((set) => ({
    reloadFlag: false,
    triggerReload: () =>
        set((state: LoginReloadState) => ({ reloadFlag: !state.reloadFlag })),
}));
