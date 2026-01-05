import { useEffect, useMemo, useState } from "react";
import TickEventViewer from "./components/TickEventViewer";
import type {
    BobNodeTickInfo,
    LiteNodeTickInfo,
    LogEvent,
    TickEvent,
} from "@/types/type";
import { useGeneralGet } from "@/networking/api";
import { toast } from "sonner";

export default function LogsRealtime() {
    let { data: statuses } = useGeneralGet<{
        liteNodes: LiteNodeTickInfo[];
        bobNodes: BobNodeTickInfo[];
    }>({
        queryKey: ["servers-status"],
        path: "/servers-status",
        reqQuery: {
            plainIp: "true",
        },
    });

    let [logs, setLogs] = useState<{
        [key: number]: TickEvent;
    }>({});

    let [isSubscribed, setIsSubscribed] = useState(false);
    let [isConnected, setIsConnected] = useState(false);
    let [candidateBobNode, setCandidateBobNode] = useState<string | null>(null);

    useEffect(() => {
        if (!statuses) {
            return;
        }

        // obtain candidate servers from statuses (bob nodes) with cluster of max 50 ticks difference
        let maxTick = Math.max(
            ...statuses.bobNodes.map((node) => node.currentFetchingTick)
        );
        let candidateServers = statuses.bobNodes.filter(
            (node) =>
                maxTick - node.currentFetchingTick <= 50 &&
                node.currentFetchingTick > 0
        );

        if (candidateServers.length === 0) {
            toast.error(
                "No available Bob nodes to connect for real-time logs."
            );
            return;
        }

        // pick a random server from candidate servers
        let randomIndex = Math.floor(Math.random() * candidateServers.length);
        let selectedServer = candidateServers[randomIndex];
        setCandidateBobNode(selectedServer.server);

        // connect to the selected server via WebSocket
        const ws = new WebSocket(`ws://${selectedServer.server}:40420/ws/logs`);

        ws.onmessage = (event) => {
            let log = JSON.parse(event.data) as LogEvent;
            if (!log.message || !log.message.tick) {
                if (log.type === "welcome") {
                    setIsSubscribed(true);
                }
                return;
            }

            setLogs((prev) => {
                const tick = log.message.tick;
                const prevTick = prev[tick];

                return {
                    ...prev,
                    [tick]: {
                        tick,
                        logs: prevTick ? [...prevTick.logs, log] : [log],
                    },
                };
            });
            console.log("Received log:", log);
        };

        ws.onopen = () => {
            let subscribeLogTypes = [];
            for (let i = 0; i <= 12; i++) {
                subscribeLogTypes.push({ scIndex: 0, logType: i });
            }
            // Optionally, send a message to the server
            setTimeout(() => {
                ws.send(
                    JSON.stringify({
                        action: "subscribe",
                        subscriptions: [...subscribeLogTypes],
                    })
                );
            }, 2000);
            console.log("WebSocket connection opened");
            setIsConnected(true);
        };

        ws.onclose = () => {
            console.log("WebSocket connection closed");
            setIsConnected(false);
        };

        return () => {
            ws.close();
        };
    }, [statuses]);

    // convert logs object to array and sort by tick number descending
    const sortedTickEvents = useMemo(() => {
        return Object.values(logs)
            .sort((a, b) => b.tick - a.tick)
            .slice(0, 100);
    }, [logs]);

    return (
        <div className="w-full h-full">
            <div className="h-full w-full flex flex-col p-4">
                <div className="rounded p-2 bg-gray-50 mt-2">
                    <span className="text-gray-700 text-sm font-semibold">
                        Real-time Logs Viewer (Serve by Bob Node){" "}
                        {candidateBobNode &&
                            `@ ws://${candidateBobNode}:40420/ws/logs`}
                    </span>
                </div>
                <div className="rounded p-2 bg-gray-50 mt-2 flex-1 overflow-auto space-y-2">
                    {isSubscribed ? (
                        sortedTickEvents.map((tickEvent) => (
                            <TickEventViewer
                                key={tickEvent.tick}
                                tickEvent={tickEvent}
                            />
                        ))
                    ) : (
                        <div className="text-center text-gray-500">
                            {isConnected
                                ? "Subscribing to logs..."
                                : "Connecting to log server..."}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
