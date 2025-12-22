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

    return (
        <BrowserRouter>
            <QueryClientProvider client={queryClient}>
                {
                    {
                        map: <Map />,
                        "": (
                            <SidebarProvider>
                                <>
                                    <Toaster />
                                    <div className="flex w-full h-full">
                                        <SideBar />
                                        <main className="w-full flex flex-col">
                                            <Nav />
                                            <div className="overflow-y-auto">
                                                <Routes>
                                                    <Route
                                                        path="/"
                                                        element={<Home />}
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
                                                            path="auth"
                                                            element={<Auth />}
                                                        />
                                                    </Route>
                                                </Routes>
                                            </div>
                                        </main>
                                    </div>
                                </>
                            </SidebarProvider>
                        ),
                    }[subdomain || ""]
                }
            </QueryClientProvider>
        </BrowserRouter>
    );
}

export default App;
