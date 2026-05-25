import "./App.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router";
import Home from "./pages/home/Home";
import { SidebarProvider } from "./components/ui/sidebar";
import SideBar from "./components/sidebar/SideBar";
import Nav from "./components/nav/Nav";
import Operator from "./pages/operator-management/Operator";
import MyNodes from "./pages/node-management/MyNodes";
import { Toaster } from "@/components/ui/sonner";
import Auth from "./pages/node-management/Auth";
import ManageServers from "./pages/node-management/ManageServers";
import Map from "./pages/map/Map";
import CronJobs from "./pages/cron-jobs/CronJobs";
import LogsRealTime from "./pages/logs-realtime/LogsRealtime";
import CrashReports from "./pages/crash-reports/CrashReports";
import Blacklist from "./pages/blacklist/Blacklist";
import { useEffect } from "react";
import socket from "@/networking/socket";
import { toast } from "sonner";
import { MyStorage } from "@/utils/storage";
import {
    useLoginReloadStore,
    type LoginReloadState,
} from "@/stores/login-reload-store";

// Create a client
const queryClient = new QueryClient();

function getSubdomain() {
    const hostname = window.location.hostname;
    console.log("Hostname:", hostname);
    const parts = hostname.split(".");
    console.log("Hostname parts:", parts);
    return parts.length >= 2 ? parts[0] : null;
}

function App() {
    const supportingDomains = ["map"];
    let subdomain = getSubdomain();
    if (subdomain && !supportingDomains.includes(subdomain)) {
        subdomain = null;
    }
    console.log("Subdomain detected:", subdomain);

    const loginReload = useLoginReloadStore() as LoginReloadState;

    useEffect(() => {
        if (!MyStorage.getUserInfo()?.username) return;
        const register = () => {
            const operator = MyStorage.getUserInfo()?.username;
            if (operator) socket.emit("registerNotifications", { operator });
        };
        register();
        socket.on("connect", register);
        const onMainNodeEvent = (e: {
            type: "promote" | "demote";
            server: string;
            groupId: string;
            reason: string;
        }) => {
            toast(
                e.type === "promote"
                    ? `Main promoted: ${e.server}`
                    : `Main demoted: ${e.server}`,
                {
                    description: `${e.reason} (group ${e.groupId.slice(0, 8)})`,
                }
            );
        };
        socket.on("mainNodeEvent", onMainNodeEvent);
        return () => {
            socket.off("connect", register);
            socket.off("mainNodeEvent", onMainNodeEvent);
        };
    }, [loginReload.reloadFlag]);

    return (
        <BrowserRouter>
            <QueryClientProvider client={queryClient}>
                {
                    {
                        map: <Map />,
                        "": (
                            <SidebarProvider>
                                <div className="w-full h-screen">
                                    <Toaster />
                                    <div className="flex w-full h-full">
                                        <SideBar />
                                        <main className="w-full flex flex-col h-full">
                                            <Nav />
                                            <div className="overflow-y-auto w-full h-full">
                                                <Routes>
                                                    <Route
                                                        path="/"
                                                        element={<Home />}
                                                    />
                                                    <Route
                                                        path="/logs-realtime"
                                                        element={
                                                            <LogsRealTime />
                                                        }
                                                    />
                                                    <Route
                                                        path="/map"
                                                        element={<Map />}
                                                    />
                                                    <Route path="operator-management">
                                                        <Route
                                                            path="operator"
                                                            element={
                                                                <Operator />
                                                            }
                                                        />
                                                        <Route
                                                            path="blacklist"
                                                            element={
                                                                <Blacklist />
                                                            }
                                                        />
                                                    </Route>
                                                    <Route path="node-management">
                                                        <Route
                                                            path="my-nodes"
                                                            element={
                                                                <MyNodes />
                                                            }
                                                        />
                                                        <Route
                                                            path="manage-servers"
                                                            element={
                                                                <ManageServers />
                                                            }
                                                        />
                                                        <Route
                                                            path="cron-jobs"
                                                            element={
                                                                <CronJobs />
                                                            }
                                                        />
                                                        <Route
                                                            path="crash-reports"
                                                            element={
                                                                <CrashReports />
                                                            }
                                                        />
                                                        <Route
                                                            path="auth"
                                                            element={<Auth />}
                                                        />
                                                    </Route>
                                                </Routes>
                                            </div>
                                        </main>
                                    </div>
                                </div>
                            </SidebarProvider>
                        ),
                    }[subdomain || ""]
                }
            </QueryClientProvider>
        </BrowserRouter>
    );
}

export default App;
