import { RefreshCw, Rocket } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldSet,
} from "@/components/ui/field";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { GithubTag, ServiceType } from "@/types/type";
import useGeneralPost, { useGeneralGet } from "@/networking/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    useSelectedServersStore,
    type SelectedServersState,
} from "@/stores/selected-servers-store";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";

export default function DeployManagement() {
    let queryClient = useQueryClient();

    const selectedStore = useSelectedServersStore() as SelectedServersState;

    let [isOpen, setIsOpen] = useState(false);
    let [currentService, setCurrentService] = useState<ServiceType>("liteNode");
    let [tag, setTag] = useState<string>("");
    let [epochFile, setEpochFile] = useState<string>("");
    let [peers, setPeers] = useState<string>("");

    let { data: tags, isLoading: tagsLoading } = useGeneralGet<GithubTag[]>({
        queryKey: ["github-tags", currentService],
        path: "/github-tags",
        refetchInterval: 60000,
        reqQuery: {
            service: currentService,
        },
    });

    let { mutate: refreshGithubTags } = useGeneralPost({
        queryKey: ["refresh-github-tags", currentService],
        path: "/refresh-github-tags",
    });

    let { mutate: deploy, isPending: isDeploying } = useGeneralPost({
        queryKey: ["deploy"],
        path: "/deploy",
    });

    const handleRefreshTags = () => {
        refreshGithubTags(
            {
                service: currentService,
            } as any,
            {
                onSuccess: (tags: GithubTag[]) => {
                    toast.success("Refreshed GitHub tags...");
                    queryClient.setQueryData(["github-tags"], tags);
                },
                onError: (error) => {
                    toast.error(
                        "Failed to refresh GitHub tags " + error.message
                    );
                },
            }
        );
    };

    const handleDeploy = () => {
        if (selectedStore.selectedServers.length === 0) {
            return toast.error(
                "Please select at least one server to deploy the epoch."
            );
        }

        let peersArray = peers.split(",").map((p) => p.trim());
        for (let peer of peersArray) {
            if (currentService === "liteNode") {
                // The peer should be an IP address (v4) only (dont use regex expression for simplicity)
                let ipSplits = peer.split(".");
                if (
                    ipSplits.length !== 4 ||
                    ipSplits.some((segment) => {
                        let num = Number(segment);
                        return isNaN(num) || num < 0 || num > 255;
                    })
                ) {
                    return toast.error(
                        `Invalid peer address for lite node: ${peer}`
                    );
                }
            } else {
                // The peer should be in the format of bob:ip:port or BM:ip:port[:passcode]
                let parts = peer.split(":");
                if (parts.length < 3) {
                    return toast.error(
                        `Invalid peer format for bob node: ${peer}`
                    );
                }
                let type = parts[0];
                let ip = parts[1];
                let port = Number(parts[2]);
                if (type !== "bob" && type !== "BM") {
                    return toast.error(
                        `Invalid peer type for bob node: ${peer}`
                    );
                }
                let ipSplits = ip.split(".");
                if (
                    ipSplits.length !== 4 ||
                    ipSplits.some((segment) => {
                        let num = Number(segment);
                        return isNaN(num) || num < 0 || num > 255;
                    })
                ) {
                    return toast.error(
                        `Invalid IP address in peer for bob node: ${peer}`
                    );
                }
                if (isNaN(port) || port <= 0 || port > 65535) {
                    return toast.error(
                        `Invalid port in peer for bob node: ${peer}`
                    );
                }
            }
        }

        let body = {
            servers: selectedStore.selectedServers,
            service: currentService,
            tag: tag,
            extraData: {
                epochFile: epochFile,
                peers: peersArray,
            },
        };
        deploy(body as any, {
            onSuccess: () => {
                // Reset all
                setTag("");
                setEpochFile("");
                setPeers("");
                toast.success("Deploy initiated successfully!");
                setIsOpen(false);
            },
            onError: (error) => {
                toast.error("Failed to initiate deploy " + error.message);
            },
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger>
                <Rocket
                    className="cursor-pointer hover:text-blue-500"
                    size={20}
                />
            </DialogTrigger>
            <DialogContent className="overflow-y-auto max-h-[90vh] w-full sm:w-[500px]">
                <DialogHeader>
                    <DialogTitle>Deploy New Epoch</DialogTitle>
                    <DialogDescription>
                        Deploy a new epoch to selected nodes via Github
                        Workflow.
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                    <Tabs
                        onValueChange={(val) =>
                            setCurrentService(val as ServiceType)
                        }
                        defaultValue="lite"
                        value={currentService}
                    >
                        <TabsList>
                            <TabsTrigger value="liteNode">
                                Lite Node
                            </TabsTrigger>
                            <TabsTrigger value="bobNode">Bob Node</TabsTrigger>
                        </TabsList>
                        <Field className="mt-3">
                            {" "}
                            {/* <FieldLabel htmlFor="version">
                                Selected Servers
                            </FieldLabel> */}
                            <div className="space-x-2">
                                {selectedStore.selectedServers.map((server) => {
                                    return (
                                        <span
                                            key={server}
                                            className="cursor-pointer w-fit inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700"
                                        >
                                            {server}
                                        </span>
                                    );
                                })}
                            </div>
                        </Field>
                        <TabsContent value="liteNode">
                            <FieldSet className="mt-4">
                                <FieldGroup>
                                    <Field>
                                        {" "}
                                        <FieldLabel htmlFor="version">
                                            Version
                                        </FieldLabel>
                                        <div className="flex space-x-2">
                                            {!tagsLoading ? (
                                                <Select
                                                    value={tag}
                                                    onValueChange={setTag}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Version" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            <SelectLabel>
                                                                Version
                                                            </SelectLabel>
                                                            {tags?.map(
                                                                (tag) => {
                                                                    return (
                                                                        <SelectItem
                                                                            key={
                                                                                tag.name
                                                                            }
                                                                            value={
                                                                                tag.name
                                                                            }
                                                                        >
                                                                            {
                                                                                tag.name
                                                                            }
                                                                        </SelectItem>
                                                                    );
                                                                }
                                                            )}
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <Skeleton className="h-10 w-full" />
                                            )}
                                            <Button
                                                onClick={handleRefreshTags}
                                                variant={"ghost"}
                                                className="cursor-pointer"
                                            >
                                                <RefreshCw />
                                            </Button>
                                        </div>
                                        <FieldDescription>
                                            Select the version to deploy.
                                        </FieldDescription>
                                    </Field>
                                    <Field>
                                        {" "}
                                        <FieldLabel htmlFor="epoch-file">
                                            Epoch file
                                        </FieldLabel>
                                        <Input
                                            onChange={(e) =>
                                                setEpochFile(e.target.value)
                                            }
                                            value={epochFile}
                                            id="epoch-file"
                                            type="text"
                                            placeholder="Epoch file"
                                        />
                                        <FieldDescription>
                                            Place the link to epoch zip file
                                            (eg. https://dl.qubic/ep189.zip)
                                        </FieldDescription>
                                    </Field>
                                    <Field>
                                        {" "}
                                        <FieldLabel htmlFor="peers">
                                            Peers
                                        </FieldLabel>
                                        <Input
                                            onChange={(e) =>
                                                setPeers(e.target.value)
                                            }
                                            value={peers}
                                            id="peers"
                                            type="text"
                                            placeholder="Peers"
                                        />
                                        <FieldDescription>
                                            Comma separated list of peer
                                            addresses (eg. 1.2.3.4,8.8.8.8)
                                        </FieldDescription>
                                    </Field>
                                </FieldGroup>
                            </FieldSet>
                        </TabsContent>
                        <TabsContent value="bobNode">
                            <FieldSet className="mt-4">
                                <FieldGroup>
                                    <Field>
                                        {" "}
                                        <FieldLabel htmlFor="version">
                                            Version
                                        </FieldLabel>
                                        <div className="flex space-x-2">
                                            {!tagsLoading ? (
                                                <Select
                                                    value={tag}
                                                    onValueChange={setTag}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Version" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            <SelectLabel>
                                                                Version
                                                            </SelectLabel>
                                                            {tags?.map(
                                                                (tag) => {
                                                                    return (
                                                                        <SelectItem
                                                                            key={
                                                                                tag.name
                                                                            }
                                                                            value={
                                                                                tag.name
                                                                            }
                                                                        >
                                                                            {
                                                                                tag.name
                                                                            }
                                                                        </SelectItem>
                                                                    );
                                                                }
                                                            )}
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <Skeleton className="h-10 w-full" />
                                            )}
                                            <Button
                                                onClick={handleRefreshTags}
                                                variant={"ghost"}
                                                className="cursor-pointer"
                                            >
                                                <RefreshCw />
                                            </Button>
                                        </div>
                                        <FieldDescription>
                                            Select the version to deploy.
                                        </FieldDescription>
                                    </Field>
                                    <Field>
                                        {" "}
                                        <FieldLabel htmlFor="epoch-file">
                                            Epoch file
                                        </FieldLabel>
                                        <Input
                                            onChange={(e) =>
                                                setEpochFile(e.target.value)
                                            }
                                            value={epochFile}
                                            id="epoch-file"
                                            type="text"
                                            placeholder="Epoch file"
                                        />
                                        <FieldDescription>
                                            Place the link to epoch zip file
                                            (eg. https://dl.qubic/ep189.zip)
                                        </FieldDescription>
                                    </Field>
                                    <Field>
                                        {" "}
                                        <FieldLabel htmlFor="peers">
                                            Peers
                                        </FieldLabel>
                                        <Input
                                            onChange={(e) =>
                                                setPeers(e.target.value)
                                            }
                                            value={peers}
                                            id="peers"
                                            type="text"
                                            placeholder="Peers"
                                        />
                                        <FieldDescription className="space-y-1">
                                            <div>
                                                Command separated peers,
                                                supported 2 kind of peers
                                            </div>
                                            <ul className="space-y-1">
                                                <li>
                                                    <Badge>
                                                        P2P (Connect to bob
                                                        node)
                                                    </Badge>{" "}
                                                    bob:ip:port
                                                </li>
                                                <li>
                                                    <Badge>
                                                        Baremetal (Connect to
                                                        lite/uefi core node)
                                                    </Badge>{" "}
                                                    BM:ip:port[:0-0-0-0] where
                                                    0-0-0-0 is passcode
                                                    (optional)
                                                </li>
                                                <li>
                                                    <Badge variant={"outline"}>
                                                        Sample
                                                    </Badge>{" "}
                                                    bob:192.168.1.1:21842,BM:127.0.0.2:21841:1-2-3-4
                                                </li>
                                            </ul>
                                        </FieldDescription>
                                    </Field>
                                </FieldGroup>
                            </FieldSet>
                        </TabsContent>
                    </Tabs>

                    <div>
                        {!isDeploying ? (
                            <Button
                                onClick={() => handleDeploy()}
                                className="mt-4 cursor-pointer float-right bg-blue-600"
                            >
                                Deploy
                            </Button>
                        ) : (
                            <Button
                                disabled
                                className="mt-4 cursor-not-allowed float-right"
                            >
                                Deploying...
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
