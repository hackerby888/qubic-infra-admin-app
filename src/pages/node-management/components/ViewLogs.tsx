import { SquareTerminal } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGeneralGet } from "@/networking/api";
import LocalTerminal from "@/components/common/LocalTerminal";
import RealTimeLogViewer from "@/components/common/RealTimeLogViewer";

export default function ViewLogs({ server }: { server: string }) {
    let { data: setupLogs, isPending: isSetupLogsLoading } = useGeneralGet<{
        setupLogs: {
            stdout: string;
            stderr: string;
        };
        deployLogs: {
            liteNode?: {
                stdout: string;
                stderr: string;
            };
            bobNode?: {
                stdout: string;
                stderr: string;
            };
        };
    }>({
        queryKey: ["setup-logs", server],
        path: `/setup-logs`,
        reqQuery: {
            server: server,
        },
    });

    return (
        <Dialog>
            <DialogTrigger className="w-full">
                <div className="pl-2 w-full flex items-center py-1 cursor-pointer hover:bg-gray-100">
                    <SquareTerminal size={20} />
                    <span className="ml-1">View Logs</span>
                </div>
            </DialogTrigger>
            <DialogContent className="min-w-3/6">
                <DialogHeader>
                    <DialogTitle>Node Logs</DialogTitle>
                    <DialogDescription>
                        View the logs of your node here.
                    </DialogDescription>
                </DialogHeader>
                <div className="w-full">
                    <Tabs defaultValue="lite-logs">
                        <TabsList>
                            <TabsTrigger value="lite-logs">
                                Lite Logs
                            </TabsTrigger>
                            <TabsTrigger value="bob-logs">Bob Logs</TabsTrigger>
                            <TabsTrigger value="setup">Setup Logs</TabsTrigger>
                        </TabsList>
                        <TabsContent value="lite-logs">
                            <Tabs defaultValue="stdout">
                                <TabsList className="max-w-80 md:max-w-full overflow-x-auto">
                                    <TabsTrigger value="stdout">
                                        Deploy Standard Output
                                    </TabsTrigger>
                                    <TabsTrigger value="stderr">
                                        Deploy Standard Error
                                    </TabsTrigger>
                                    <TabsTrigger value="realtime">
                                        Realtime Logs
                                    </TabsTrigger>
                                </TabsList>
                                <TabsContent value="stdout">
                                    <LocalTerminal
                                        allowCopy={true}
                                        text={
                                            isSetupLogsLoading
                                                ? "Loading..."
                                                : setupLogs?.deployLogs
                                                      ?.liteNode?.stdout ||
                                                  "No lite node logs available."
                                        }
                                    />
                                </TabsContent>
                                <TabsContent value="stderr">
                                    <LocalTerminal
                                        text={
                                            isSetupLogsLoading
                                                ? "Loading..."
                                                : setupLogs?.deployLogs
                                                      ?.liteNode?.stderr ||
                                                  "No lite node logs available."
                                        }
                                        allowCopy={true}
                                    />
                                </TabsContent>
                                <TabsContent value="realtime">
                                    <RealTimeLogViewer
                                        host={server}
                                        service={"liteNode"}
                                    />
                                </TabsContent>
                            </Tabs>
                        </TabsContent>
                        <TabsContent value="bob-logs" className="">
                            {" "}
                            <Tabs defaultValue="stdout" className="">
                                <TabsList className="max-w-80 md:max-w-full overflow-x-auto">
                                    <TabsTrigger value="stdout">
                                        Deploy Standard Output
                                    </TabsTrigger>
                                    <TabsTrigger value="stderr">
                                        Deploy Standard Error
                                    </TabsTrigger>
                                    <TabsTrigger value="realtime">
                                        Realtime Logs
                                    </TabsTrigger>
                                </TabsList>
                                <TabsContent value="stdout">
                                    <LocalTerminal
                                        text={
                                            isSetupLogsLoading
                                                ? "Loading..."
                                                : setupLogs?.deployLogs?.bobNode
                                                      ?.stdout ||
                                                  "No lite node logs available."
                                        }
                                        allowCopy={true}
                                    />
                                </TabsContent>
                                <TabsContent value="stderr">
                                    <LocalTerminal
                                        text={
                                            isSetupLogsLoading
                                                ? "Loading..."
                                                : setupLogs?.deployLogs?.bobNode
                                                      ?.stderr ||
                                                  "No lite node logs available."
                                        }
                                        allowCopy={true}
                                    />
                                </TabsContent>
                                <TabsContent value="realtime">
                                    {" "}
                                    <RealTimeLogViewer
                                        host={server}
                                        service={"bobNode"}
                                    />
                                </TabsContent>
                            </Tabs>
                        </TabsContent>
                        <TabsContent value="setup">
                            {isSetupLogsLoading ? (
                                <div>Loading...</div>
                            ) : (
                                <Tabs defaultValue="stdout">
                                    <TabsList>
                                        <TabsTrigger value="stdout">
                                            Standard Output
                                        </TabsTrigger>
                                        <TabsTrigger value="stderr">
                                            Standard Error
                                        </TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="stdout">
                                        <LocalTerminal
                                            text={
                                                setupLogs?.setupLogs.stdout ||
                                                "No logs found"
                                            }
                                        />
                                    </TabsContent>
                                    <TabsContent value="stderr">
                                        <LocalTerminal
                                            text={
                                                setupLogs?.setupLogs.stderr ||
                                                "No logs found"
                                            }
                                        />
                                    </TabsContent>
                                </Tabs>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
                <DialogFooter></DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
