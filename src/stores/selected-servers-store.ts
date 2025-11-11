import { create } from "zustand";

export interface SelectedServersState {
    selectedServers: string[];
    setSelectedServers: (servers: string[]) => void;
    setSelectedServer: (server: string) => void;
    clearSelectedServers: () => void;
}

export const useSelectedServersStore = create((set) => ({
    selectedServers: [] as string[],
    setSelectedServers: (servers: string[]) =>
        set(() => ({ selectedServers: servers })),
    setSelectedServer: (server: string) =>
        set((state: any) => {
            const isSelected = state.selectedServers.includes(server);
            let updatedServers: string[];
            if (isSelected) {
                updatedServers = state.selectedServers.filter(
                    (s: string) => s !== server
                );
            } else {
                updatedServers = [...state.selectedServers, server];
            }
            return { selectedServers: updatedServers };
        }),
    clearSelectedServers: () => set(() => ({ selectedServers: [] })),
}));
