import { ChevronRight, PanelLeftClose } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import LoginButton from "@/components/login/Login";
import PowerManagement from "@/components/nav/PowerManagement";
import DeployManagement from "@/components/nav/DeployManagement";
import ShellManagement from "@/components/nav/ShellManagement";
import { useLocation } from "react-router";
import { MyStorage } from "@/utils/storage";
import {
    useLoginReloadStore,
    type LoginReloadState,
} from "@/stores/login-reload-store";
import { useThemeStore } from "@/stores/theme-store";

function getPathsFromLocation(paths: string) {
    return paths.split("/").filter((path) => path !== "");
}

function normlizePathName(path: string) {
    return path
        .split("-")
        .map((word) => {
            // Capitalize the first letter of each word
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(" ");
}

function ThemePicker() {
    const { themes, current, setTheme } = useThemeStore();
    return (
        <div className="flex items-center gap-1.5 mr-3" title="Accent theme">
            {themes.map((t) => (
                <button
                    key={t.name}
                    title={t.name}
                    aria-label={`${t.name} theme`}
                    onClick={() => setTheme(t.name)}
                    className={`h-[18px] w-[18px] rounded-full cursor-pointer transition-transform hover:scale-110 ${
                        current === t.name
                            ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                            : "border border-[var(--border-hi)]"
                    }`}
                    style={{
                        background: `linear-gradient(135deg, ${t.primary} 0 50%, ${t.secondary} 50% 100%)`,
                    }}
                />
            ))}
        </div>
    );
}

export default function Nav() {
    const loginReload = useLoginReloadStore() as LoginReloadState;
    let location = useLocation();
    let paths = getPathsFromLocation(location.pathname);
    let totalPaths = paths.length;
    let isLoggedIn = MyStorage.decodeTokenPayload(
        MyStorage.getLoginCredential() || ""
    )
        ? true
        : false;

    console.log(loginReload.reloadFlag);
    return (
        <nav className="w-full pl-2 py-3 border-b border-border bg-sidebar text-foreground flex justify-between items-center">
            <div className="flex items-center">
                <div className="p-2 rounded-sm cursor-pointer flex w-fit">
                    <SidebarTrigger className="cursor-pointer">
                        <PanelLeftClose
                            className="text-foreground"
                            size={20}
                        />
                    </SidebarTrigger>
                </div>
                <span className="font-display text-primary glow-primary text-sm tracking-widest mr-3 select-none hidden md:inline">
                    ◈ QUBIC <span className="text-muted-foreground">// NODES</span>
                </span>
                <div className="w-px bg-border h-5"></div>
                <span className="ml-3 text-sm md:flex hidden">
                    {totalPaths === 0 ? (
                        <span className="cursor-pointer hover:underline text-primary">
                            Home
                        </span>
                    ) : (
                        paths
                            .map((path) => normlizePathName(path))
                            .map((pathClean, index) => {
                                const isLast = index === totalPaths - 1;
                                return (
                                    <div
                                        className="flex items-center"
                                        key={index}
                                    >
                                        {" "}
                                        <span
                                            className={`${
                                                isLast
                                                    ? "font-semibold text-primary"
                                                    : "text-muted-foreground"
                                            } cursor-pointer hover:underline`}
                                            key={pathClean}
                                        >
                                            {pathClean}{" "}
                                        </span>
                                        {index < totalPaths - 1 && (
                                            <ChevronRight
                                                className="text-muted-foreground"
                                                size={15}
                                            />
                                        )}
                                    </div>
                                );
                            })
                    )}
                </span>
            </div>
            <div className="flex items-center pr-5">
                {isLoggedIn ? (
                    <>
                        <div className="tools flex space-x-4 mr-4">
                            <PowerManagement />
                            <DeployManagement />
                            <ShellManagement />
                        </div>
                        <div className="w-1 h-1 bg-primary mr-3"></div>
                    </>
                ) : (
                    <></>
                )}
                <ThemePicker />
                <LoginButton />
            </div>
        </nav>
    );
}
