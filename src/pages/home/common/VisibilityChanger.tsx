import { Badge } from "@/components/ui/badge";
import useGeneralPost from "@/networking/api";
import type {
    BobNodeTickInfo,
    LiteNodeTickInfo,
    ServersStatus,
    ServiceType,
    User,
} from "@/types/type";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function VisibilityChanger({
    stat,
    operatorInfo,
    service,
}: {
    stat: LiteNodeTickInfo | BobNodeTickInfo;
    operatorInfo?: User;
    service: ServiceType;
}) {
    let queryClient = useQueryClient();
    let { mutate: toggleVisibility } = useGeneralPost({
        queryKey: ["change-visibility", service],
        path: "/change-visibility",
    });

    const handleToggleVisibility = (server: string, isPrivate: boolean) => {
        toggleVisibility(
            {
                server: server,
                service: service,
                isPrivate: isPrivate,
            } as any,
            {
                onSuccess: () => {
                    toast.success(
                        `Changed visibility successfully for ${server} to ${
                            isPrivate ? "Private" : "Public"
                        }`
                    );

                    // Update in-memory cache
                    queryClient.setQueryData(
                        [
                            "servers-status",
                            operatorInfo?.username || "no-valid-operator",
                        ],
                        (oldData: ServersStatus) => {
                            if (!oldData) return oldData;
                            let updatedLiteNodes = oldData.statuses.liteNodes;
                            let updatedBobNodes = oldData.statuses.bobNodes;

                            if (service === "liteNode") {
                                updatedLiteNodes =
                                    oldData.statuses.liteNodes.map((node) =>
                                        node.server === server
                                            ? { ...node, isPrivate: isPrivate }
                                            : node
                                    );
                            } else if (service === "bobNode") {
                                updatedBobNodes = oldData.statuses.bobNodes.map(
                                    (node) =>
                                        node.server === server
                                            ? { ...node, isPrivate: isPrivate }
                                            : node
                                );
                            }
                            return {
                                ...oldData,
                                statuses: {
                                    liteNodes: updatedLiteNodes,
                                    bobNodes: updatedBobNodes,
                                },
                            };
                        }
                    );
                },
                onError: (error: any) => {
                    toast.error(
                        `Error: ${
                            error.message ||
                            "Failed to change visibility for " + server
                        }`
                    );
                },
            }
        );
    };
    return (
        <div className="flex items-center">
            {operatorInfo ? (
                <>
                    {" "}
                    <Badge
                        onClick={() =>
                            handleToggleVisibility(stat.server, true)
                        }
                        variant={"secondary"}
                        className={`${
                            stat.isPrivate && "bg-blue-500 text-white"
                        } cursor-pointer mr-2`}
                    >
                        Private
                    </Badge>
                    <Badge
                        onClick={() =>
                            handleToggleVisibility(stat.server, false)
                        }
                        variant={"secondary"}
                        className={`${
                            !stat.isPrivate && "bg-blue-500 text-white"
                        } cursor-pointer`}
                    >
                        Public
                    </Badge>
                </>
            ) : (
                <div className="flex items-center">
                    {" "}
                    {stat.isPrivate ? "Private" : "Public"}
                </div>
            )}
        </div>
    );
}
