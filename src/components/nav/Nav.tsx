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
        <nav className="w-full pl-2 py-3 border-b border-gray-200 flex justify-between">
            <div className="flex items-center">
                <div className="p-2 rounded-sm hover:bg-gray-100 cursor-pointer flex w-fit">
                    <SidebarTrigger>
                        {" "}
                        <PanelLeftClose className="text-black" size={20} />
                    </SidebarTrigger>
                </div>
                <div
                    style={{ width: "0.5px" }}
                    className="bg-gray-300 h-5"
                ></div>
                <span className="ml-3 text-sm flex">
                    {totalPaths === 0 ? (
                        <span className="cursor-pointer hover:underline">
                            Home
                        </span>
                    ) : (
                        paths
                            .map((path) => normlizePathName(path))
                            .map((pathClean, index) => (
                                <div className="flex items-center" key={index}>
                                    {" "}
                                    <span
                                        className={`${
                                            index != totalPaths - 1 &&
                                            "text-gray-600"
                                        } cursor-pointer hover:underline`}
                                        key={pathClean}
                                    >
                                        {pathClean}{" "}
                                    </span>
                                    {index < totalPaths - 1 && (
                                        <ChevronRight
                                            className={`${
                                                index != totalPaths - 1 &&
                                                "text-gray-600"
                                            }`}
                                            size={15}
                                        />
                                    )}
                                </div>
                            ))
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
                        <div className="w-1 h-1 bg-blue-400 mr-3"></div>
                    </>
                ) : (
                    <></>
                )}
                <LoginButton />
            </div>
        </nav>
    );
}
