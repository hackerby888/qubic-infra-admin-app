import { House, LaptopMinimal, Loader, Map, UserRoundPlus } from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
} from "@/components/ui/sidebar";
import { useLocation, useNavigate } from "react-router";
import DynamicNavigatorMenu from "../common/dynamic-navigator-menu";
import { MyStorage } from "@/utils/storage";
import {
    useLoginReloadStore,
    type LoginReloadState,
} from "@/stores/login-reload-store";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { useState } from "react";

const availableRoutesPublic = [
    { name: "Home", path: "/", icon: House },
    {
        name: "Logs",
        path: "/logs-realtime",
        icon: Loader,
    },
    {
        name: "Map",
        path: "/`map`",
        customPath: "https://map.qubic.global",
        icon: Map,
    },
];

const availableRoutesPrivate = {
    "operator-management": [
        { name: "Operator", path: "/operator", icon: UserRoundPlus },
    ],
    "node-management": [
        { name: "My Nodes", path: "/my-nodes", icon: LaptopMinimal },
        {
            name: "Manage Servers",
            path: "/manage-servers",
            icon: LaptopMinimal,
        },
        { name: "Cron Jobs", path: "/cron-jobs", icon: LaptopMinimal },
        { name: "Authentication", path: "/auth", icon: LaptopMinimal },
    ],
};

export default function SideBar() {
    const loginReload = useLoginReloadStore() as LoginReloadState;
    const location = useLocation();
    const navigate = useNavigate();
    const [searchValue, setSearchValue] = useState("");

    const nagivateToRoute = (path: string) => {
        if (path.startsWith("http")) {
            window.open(path, "_blank");
            return;
        }
        navigate(path);
    };

    let isLoggedIn = MyStorage.getUserInfo() ? true : false;
    let isAdmin = MyStorage.getUserInfo()?.role === "admin" || false;

    console.log(loginReload.reloadFlag);

    return (
        <Sidebar className="">
            <SidebarHeader />
            <SidebarContent className={`${isLoggedIn && "bg-white"}`}>
                <SidebarGroup>
                    <div className="px-3 py-3">
                        <div className="flex">
                            <div className="w-10 bg-linear-to-r from-cyan-500 to-blue-500 rounded-sm"></div>
                            <div className="flex flex-col justify-center align-middle pl-2">
                                <span className="text-sm font-semibold">
                                    Qubic Network Nodes
                                </span>
                                <span className="text-sm">Global</span>
                            </div>
                        </div>

                        <div className="mt-4">
                            <Command>
                                <CommandInput
                                    value={searchValue}
                                    onValueChange={setSearchValue}
                                    placeholder="Search (eg. Home)…"
                                />
                                <CommandList>
                                    {searchValue.length > 0 && (
                                        <CommandEmpty>
                                            No results found.
                                        </CommandEmpty>
                                    )}

                                    {searchValue.length > 0 && (
                                        <CommandGroup heading="Public Pages">
                                            {availableRoutesPublic.map(
                                                (route) => (
                                                    <CommandItem
                                                        key={route.path}
                                                        onSelect={() =>
                                                            nagivateToRoute(
                                                                route.customPath ||
                                                                    route.path
                                                            )
                                                        }
                                                    >
                                                        {route.name}
                                                    </CommandItem>
                                                )
                                            )}
                                        </CommandGroup>
                                    )}
                                    {Object.entries(availableRoutesPrivate).map(
                                        ([groupName, routes]) => {
                                            if (!isLoggedIn) return null;
                                            if (
                                                groupName ===
                                                    "operator-management" &&
                                                !isAdmin
                                            )
                                                return null;
                                            return (
                                                searchValue.length > 0 && (
                                                    <CommandGroup
                                                        heading={groupName
                                                            .split("-")
                                                            .map(
                                                                (word) =>
                                                                    word
                                                                        .charAt(
                                                                            0
                                                                        )
                                                                        .toUpperCase() +
                                                                    word.slice(
                                                                        1
                                                                    )
                                                            )
                                                            .join(" ")}
                                                        key={groupName}
                                                    >
                                                        {routes.map(
                                                            (route) =>
                                                                isLoggedIn &&
                                                                searchValue.length >
                                                                    0 &&
                                                                route.name
                                                                    .toLowerCase()
                                                                    .includes(
                                                                        searchValue.toLowerCase()
                                                                    ) && (
                                                                    <CommandItem
                                                                        key={
                                                                            route.path
                                                                        }
                                                                        onSelect={() =>
                                                                            nagivateToRoute(
                                                                                groupName +
                                                                                    route.path
                                                                            )
                                                                        }
                                                                    >
                                                                        {
                                                                            route.name
                                                                        }
                                                                    </CommandItem>
                                                                )
                                                        )}
                                                    </CommandGroup>
                                                )
                                            );
                                        }
                                    )}
                                </CommandList>
                            </Command>
                        </div>

                        <div>
                            <ul className="mt-4 text-sm space-y-2">
                                {availableRoutesPublic.map((route) => (
                                    <li
                                        key={route.path}
                                        onClick={() =>
                                            nagivateToRoute(
                                                route.customPath || route.path
                                            )
                                        }
                                        className={`${
                                            route.path == location.pathname
                                                ? "bg-blue-500 text-white hover:bg-blue-600"
                                                : "hover:bg-gray-100"
                                        } p-2 rounded-sm cursor-pointer flex`}
                                    >
                                        <route.icon
                                            size={20}
                                            className="mr-2"
                                        />
                                        {route.name}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {isLoggedIn ? (
                            <>
                                <hr className="mt-4"></hr>
                                <div className="text-sm mt-4 space-y-3">
                                    {Object.entries(availableRoutesPrivate).map(
                                        ([groupName, routes]) => {
                                            if (
                                                groupName ===
                                                    "operator-management" &&
                                                !isAdmin
                                            )
                                                return null;
                                            return (
                                                <DynamicNavigatorMenu
                                                    icon={routes[0].icon}
                                                    title={groupName
                                                        .split("-")
                                                        .map(
                                                            (word) =>
                                                                word
                                                                    .charAt(0)
                                                                    .toUpperCase() +
                                                                word.slice(1)
                                                        )
                                                        .join(" ")}
                                                    rootPath={`/${groupName}`}
                                                    items={[
                                                        ...routes.map(
                                                            (route) => ({
                                                                label: route.name,
                                                                path: route.path,
                                                            })
                                                        ),
                                                    ]}
                                                />
                                            );
                                        }
                                    )}
                                </div>
                            </>
                        ) : (
                            <div> </div>
                        )}
                    </div>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter />
        </Sidebar>
    );
}
