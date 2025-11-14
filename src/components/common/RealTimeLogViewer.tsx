import socket from "@/networking/socket";
import type { ServiceType } from "@/types/type";
import { useEffect, useState } from "react";
import LocalTerminal from "./LocalTerminal";
import { Button } from "../ui/button";
import { toast } from "sonner";

export default function RealTimeLogViewer({
    service,
    host,
}: {
    service: ServiceType;
    host: string;
}) {
    let [logs, setLogs] = useState<string>("");
    let [isSubscribed, setIsSubscribed] = useState<boolean>(false);
    useEffect(() => {
        socket.on(
            "serviceLogUpdate",
            (data: { service: ServiceType; log: string }) => {
                if (data.service === service) {
                    console.log(
                        "Received log data:",
                        data.log.replaceAll("\n", "\\n")
                    );
                    setLogs((text) => text + data.log);
                }
            }
        );

        return () => {
            socket.emit("unsubscribeFromServiceLogs", { service, host });
            socket.off("serviceLogUpdate");
        };
    }, []);

    const handleSubscribe = () => {
        if (isSubscribed) return;
        socket.emit("subscribeToServiceLogs", { service, host });
        setIsSubscribed(true);
        toast.info("Please wait, loading logs...");
    };

    let renderLogs = logs.replaceAll("\n\n", "\\n\\n");
    renderLogs = renderLogs.replaceAll("\n", "");
    renderLogs = renderLogs.replaceAll("\\n", "\n");

    return (
        <div className="relative">
            {!isSubscribed && (
                <div className="absolute inset-0 bg-gray-100 bg-opacity-90 flex items-center justify-center z-10 cursor-pointer">
                    <Button onClick={handleSubscribe} variant={"outline"}>
                        Load Logs
                    </Button>
                </div>
            )}
            <LocalTerminal text={logs} />
        </div>
    );
}
