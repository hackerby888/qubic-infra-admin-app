import { create } from "zustand";

export interface AccentTheme {
    name: string;
    primary: string;
    secondary: string;
}

// Qubic-cyan is our signature default; the 5 explorer accents follow.
export const THEMES: AccentTheme[] = [
    { name: "Qubic", primary: "#2de2e6", secondary: "#7c5cff" },
    { name: "Bitcoin", primary: "#f7931a", secondary: "#00d4ff" },
    { name: "Synthwave", primary: "#ff5cf0", secondary: "#7c5cff" },
    { name: "Matrix", primary: "#22ee9a", secondary: "#9bff66" },
    { name: "Inferno", primary: "#ff5630", secondary: "#ffb547" },
    { name: "Arctic", primary: "#38bdf8", secondary: "#818cf8" },
];

const STORAGE_KEY = "explorer-theme";

function hexToRgba(hex: string, a: number): string {
    const h = hex.replace("#", "");
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
}

// Push the selected accent into the picker-driven CSS vars on <html>.
// The fixed semantic hues (--green/--red/--amber/--cyan) stay put.
function applyTheme(t: AccentTheme) {
    const s = document.documentElement.style;
    s.setProperty("--primary", t.primary);
    s.setProperty("--ring", t.primary);
    s.setProperty("--sidebar-primary", t.primary);
    s.setProperty("--sidebar-ring", t.primary);
    s.setProperty("--chart-1", t.primary);
    s.setProperty("--accent-2", t.secondary);
    s.setProperty("--chart-2", t.secondary);
    s.setProperty(
        "--glow-primary",
        `0 0 12px ${hexToRgba(t.primary, 0.55)}, 0 0 32px ${hexToRgba(t.primary, 0.2)}`
    );
    s.setProperty("--bg-glow-1", hexToRgba(t.primary, 0.06));
    s.setProperty("--bg-glow-2", hexToRgba(t.secondary, 0.05));
    try {
        localStorage.setItem(STORAGE_KEY, t.name);
    } catch {
        /* ignore */
    }
}

function initialTheme(): AccentTheme {
    let saved: string | null = null;
    try {
        saved = localStorage.getItem(STORAGE_KEY);
    } catch {
        /* ignore */
    }
    return THEMES.find((t) => t.name === saved) || THEMES[0];
}

// Dark-only app: force the dark class so shadcn `dark:` variants + the
// sonner toaster (next-themes) resolve against the graphite palette.
document.documentElement.classList.add("dark");
const initial = initialTheme();
applyTheme(initial);

interface ThemeState {
    themes: AccentTheme[];
    current: string;
    setTheme: (name: string) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
    themes: THEMES,
    current: initial.name,
    setTheme: (name: string) => {
        const t = THEMES.find((x) => x.name === name);
        if (!t) return;
        applyTheme(t);
        set({ current: t.name });
    },
}));
