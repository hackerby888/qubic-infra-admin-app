import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import type { LogEvent } from "@/types/type";

const StandardLogTypeToLabel: Record<number, string> = {
    0: "QU_TRANSFER",
    1: "ASSET_ISSUANCE",
    2: "ASSET_OWNERSHIP_CHANGE",
    3: "ASSET_POSSESSION_CHANGE",
    8: "BURNING",
    11: "ASSET_OWNERSHIP_MANAGING_CONTRACT_CHANGE",
    12: "ASSET_POSSESSION_MANAGING_CONTRACT_CHANGE",
};

export default function EventViewer({ log }: { log: LogEvent }) {
    return (
        <span className="text-sm text-gray-500">
            [{log.message.timestamp}] {log.message.logTypename}:{" "}
            <Dialog>
                <DialogTrigger>
                    <span className="hover:underline hover:font-bold">
                        Click here to view
                    </span>
                </DialogTrigger>
                <DialogContent className="[&>button[data-slot='dialog-close']]:hidden">
                    <div className="text-sm">
                        <div className="bg-gray-50 p-2 rounded">
                            <div>
                                <span className="font-semibold text-gray-700">
                                    Log Type:
                                </span>{" "}
                                <span className="text-gray-600">
                                    {StandardLogTypeToLabel[log.message.type] ||
                                        `Unknown (${log.message.type})`}
                                    <span className="ml-1">
                                        (logId: {log.message.logId})
                                    </span>
                                </span>
                                <span></span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-700">
                                    Digest:
                                </span>{" "}
                                <span className="text-gray-600">
                                    {log.message.logDigest}
                                </span>
                            </div>
                        </div>
                        <div className="mt-2 bg-gray-50 p-2 rounded">
                            {Object.entries(log.message.body).map(
                                ([key, value]) => (
                                    <div key={key} className="mb-2">
                                        <span className="font-semibold text-gray-700">
                                            {key}:
                                        </span>{" "}
                                        <span className="text-gray-600 text-wrap wrap-anywhere">
                                            {String(value)}
                                        </span>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </span>
    );
}
