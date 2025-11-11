import "./App.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import Home from "./pages/home/Home";
import { SidebarProvider, SidebarTrigger } from "./components/ui/sidebar";
import SideBar from "./components/sidebar/SideBar";
import LoginButton from "./components/login/Login";
import Nav from "./components/nav/Nav";
import Operator from "./pages/operator-management/Operator";
import MyNodes from "./pages/node-management/MyNodes";
import { Toaster } from "@/components/ui/sonner";
import ManageNode from "./pages/node-management/ManageNode";
import Auth from "./pages/node-management/Auth";

// Create a client
const queryClient = new QueryClient();

function App() {
    return (
        <BrowserRouter>
            <QueryClientProvider client={queryClient}>
                <SidebarProvider>
                    <>
                        <Toaster />
                        <div className="flex w-full h-full">
                            <SideBar />
                            <main className="w-full flex flex-col">
                                <Nav />
                                <div className="overflow-y-auto">
                                    <Routes>
                                        <Route path="/" element={<Home />} />
                                        <Route path="operator-management">
                                            <Route
                                                path="operator"
                                                element={<Operator />}
                                            />
                                        </Route>
                                        <Route path="node-management">
                                            <Route
                                                path="my-nodes"
                                                element={<MyNodes />}
                                            />
                                            <Route
                                                path="manage-nodes"
                                                element={<ManageNode />}
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
            </QueryClientProvider>
        </BrowserRouter>
    );
}

export default App;
