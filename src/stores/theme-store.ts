import { create } from "zustand";

interface ThemeState {
    isDark: boolean;
    toggle: () => void;
}

function applyTheme(dark: boolean) {
    document.documentElement.classList.toggle("dark", dark);
}

const stored = localStorage.getItem("theme");
const initialDark = stored ? stored === "dark" : false;
applyTheme(initialDark);

export const useThemeStore = create<ThemeState>((set) => ({
    isDark: initialDark,
    toggle: () =>
        set((state) => {
            const next = !state.isDark;
            applyTheme(next);
            localStorage.setItem("theme", next ? "dark" : "light");
            return { isDark: next };
        }),
}));
