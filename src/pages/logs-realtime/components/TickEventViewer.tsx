import type { TickEvent } from "@/types/type";
import EventViewer from "./EventViewer";
import React, { useEffect, useMemo } from "react";

export default React.memo(function TickEventViewer({
    tickEvent,
}: {
    tickEvent: TickEvent;
}) {
    const isExpansible = tickEvent.logs.length > 5;
    let [isExpanded, setIsExpanded] = React.useState(
        tickEvent.logs.length <= 5
    );
    let displayedLogs = useMemo(() => {
        let localLogs = tickEvent.logs;
        localLogs = localLogs.sort((a, b) => a.message.logId - b.message.logId);
        if (isExpanded) {
            return localLogs;
        } else {
            return localLogs.slice(0, 5);
        }
    }, [isExpanded, tickEvent.logs]);

    useEffect(() => {
        if (tickEvent.logs.length <= 5) {
            setIsExpanded(true);
        } else {
            setIsExpanded(false);
        }
    }, [tickEvent.logs.length]);

    return (
        <div className="border rounded-sm bg-white p-2 cursor-pointer">
            <div>
                <span className="text-sm font-bold text-gray-700">
                    Tick: {tickEvent.tick.toLocaleString()} (
                    {tickEvent.logs.length} logs)
                </span>
            </div>
            <div className="flex flex-col space-y-1 mt-1">
                {displayedLogs.map((log) => (
                    <div key={log.message.logDigest} className="">
                        <EventViewer log={log} />
                    </div>
                ))}
                {isExpansible && (
                    <>
                        {!isExpanded && (
                            <div
                                className="text-sm text-blue-500 hover:underline mt-1"
                                onClick={() => setIsExpanded(true)}
                            >
                                Show more...
                            </div>
                        )}
                        {isExpanded && (
                            <div
                                className="text-sm text-blue-500 hover:underline mt-1"
                                onClick={() => setIsExpanded(false)}
                            >
                                Show less...
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
});
