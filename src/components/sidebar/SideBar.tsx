import { House, LaptopMinimal, Search, UserRoundPlus } from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
} from "@/components/ui/sidebar";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from "@/components/ui/input-group";
import { useLocation, useNavigate } from "react-router";
import DynamicNavigatorMenu from "../common/dynamic-navigator-menu";
import { MyStorage } from "@/utils/storage";
import {
    useLoginReloadStore,
    type LoginReloadState,
} from "@/stores/login-reload-store";

const availableRoutesPublic = [{ name: "Home", path: "/", icon: House }];

export default function SideBar() {
    const loginReload = useLoginReloadStore() as LoginReloadState;
    const location = useLocation();
    const navigate = useNavigate();

    const nagivateToRoute = (path: string) => {
        navigate(path);
    };

    let isLoggedIn = MyStorage.getUserInfo() ? true : false;
    let isAdmin = MyStorage.getUserInfo()?.role === "admin" || false;

    console.log(loginReload.reloadFlag);

    return (
        <Sidebar className="">
            <SidebarHeader />
            <SidebarContent>
                <SidebarGroup>
                    {" "}
                    <div className="px-3 py-3">
                        <div className="flex">
                            <div className="w-10 bg-linear-to-r from-cyan-500 to-blue-500 rounded-sm"></div>
                            <div className="flex flex-col justify-center align-middle pl-2">
                                <span className="text-sm font-semibold">
                                    Qubic Network Nodes
                                </span>
                                <span className="text-sm">Adminstration</span>
                            </div>
                        </div>

                        <div className="mt-4">
                            <InputGroup>
                                <InputGroupInput
                                    autoFocus={false}
                                    placeholder="Search..."
                                />
                                <InputGroupAddon>
                                    <Search />
                                </InputGroupAddon>
                            </InputGroup>
                        </div>

                        <div>
                            <ul className="mt-4 text-sm space-y-2">
                                {availableRoutesPublic.map((route) => (
                                    <li
                                        key={route.path}
                                        onClick={() =>
                                            nagivateToRoute(route.path)
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
                                {" "}
                                <hr className="mt-4"></hr>
                                <div className="text-sm mt-4">
                                    {/* <Collapsible className="w-full">
                                <CollapsibleTrigger className="w-full">
                                    <div className="p-2 rounded-sm hover:bg-gray-100 cursor-pointer flex w-full">
                                        <LaptopMinimal
                                            size={20}
                                            className="mr-2"
                                        />
                                        <span className="flex-1 text-left">
                                            Node Management
                                        </span>
                                        <ChevronUp
                                            className="text-gray-500"
                                            size={20}
                                        />
                                    </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <ul className="text-sm pl-3">
                                        <li className="border-l-2 border-l-blue-600 text-blue-600 pl-2 py-2 hover:bg-gray-100 cursor-pointer flex">
                                            General
                                        </li>
                                        <li className="border-l-2 border-l-gray-300 pl-2 py-2 hover:bg-gray-100 cursor-pointer flex">
                                            General
                                        </li>
                                    </ul>
                                </CollapsibleContent>
                            </Collapsible> */}
                                    {isAdmin && (
                                        <>
                                            <DynamicNavigatorMenu
                                                icon={UserRoundPlus}
                                                title="Operator Management"
                                                rootPath="/operator-management"
                                                items={[
                                                    {
                                                        label: "Operator",
                                                        path: "/operator",
                                                    },
                                                ]}
                                            />
                                            <div className="mt-2"></div>
                                        </>
                                    )}
                                    <DynamicNavigatorMenu
                                        icon={LaptopMinimal}
                                        title="Node Management"
                                        rootPath="/node-management"
                                        items={[
                                            {
                                                label: "My Nodes",
                                                path: "/my-nodes",
                                            },
                                            {
                                                label: "Manage Nodes",
                                                path: "/manage-nodes",
                                            },
                                            {
                                                label: "Authentication",
                                                path: "/auth",
                                            },
                                        ]}
                                    />
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
