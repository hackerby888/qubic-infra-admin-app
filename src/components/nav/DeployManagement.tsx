import { ChevronsUpDown, RefreshCw, Rocket } from "lucide-react";
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
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { Textarea } from "../ui/textarea";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from "../ui/input-group";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "../ui/collapsible";
import { Checkbox } from "../ui/checkbox";

export default function DeployManagement() {
    let queryClient = useQueryClient();

    const selectedStore = useSelectedServersStore() as SelectedServersState;

    let [isOpen, setIsOpen] = useState(false);
    let [currentService, setCurrentService] = useState<ServiceType>("liteNode");
    let [tag, setTag] = useState<string>("");
    let [epochFile, setEpochFile] = useState<string>("");
    let [peers, setPeers] = useState<string>("");
    let [ids, setIds] = useState<string>("");
    let [mode, setMode] = useState<string>("aux");
    let [customBinary, setCustomBinary] = useState<string>("");
    let [bobConfig, setBobConfig] = useState<string>("");
    let [keydbConfig, setKeydbConfig] = useState<string>("");
    let [kvrocksConfig, setKvrocksConfig] = useState<string>("");
    let [loggingPasscode, setLoggingPasscode] = useState<string>("0-0-0-0");
    let [operatorId, setOperatorId] = useState<string>(
        "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
    );
    let [isSelectTagOpen, setIsSelectTagOpen] = useState<boolean>(false);
    let [keepOldConfig, setKeepOldConfig] = useState<boolean>(false);

    let {
        data: tags,
        isLoading: tagsLoading,
        isFetching: isTagsFetching,
    } = useGeneralGet<GithubTag[]>({
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
    let {
        data: randomPeers,
        refetch: fetchRandomPeers,
        isPending: isFetchingRandomPeers,
    } = useGeneralGet<
        | {
              peers: string[];
          }
        | {
              litePeers: string[];
              bobPeers: string[];
          }
    >({
        queryKey: ["random-peers", currentService],
        path: "/random-peers",
        reqQuery: {
            service: currentService,
            litePeers: currentService == "liteNode" ? 4 : 2,
        },
    });

    let { mutate: deploy, isPending: isDeploying } = useGeneralPost({
        queryKey: ["deploy"],
        path: "/deploy",
    });

    const handleOnKeyDownCustomBinary = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            setIsSelectTagOpen(false);
            setTag(customBinary);
        }
    };

    const handleFetchRandomPeers = () => {
        fetchRandomPeers().then(() => {
            if (currentService === "liteNode") {
                setPeers((randomPeers as { peers: string[] })?.peers.join(","));
                toast.success("Fetched random peers successfully");
                return;
            } else if (currentService === "bobNode") {
                let fetchedPeers = randomPeers as {
                    litePeers: string[];
                    bobPeers: string[];
                };
                let targetPeers: string = "";
                if (fetchedPeers.litePeers.length > 0) {
                    targetPeers += fetchedPeers.litePeers
                        .map((peer) => `BM:${peer}:21841:0-0-0-0`)
                        .join(",");
                }
                if (fetchedPeers.bobPeers.length > 0) {
                    targetPeers += ",";
                    targetPeers += fetchedPeers.bobPeers
                        .map((peer) => `bob:${peer}:21842`)
                        .join(",");
                }
                setPeers(targetPeers);
                toast.success("Fetched random peers successfully");
                return;
            } else {
                toast.error("Unknown service type for fetching peers");
                return;
            }
        });
    };

    const handleRefreshTags = () => {
        refreshGithubTags(
            {
                service: currentService,
            } as any,
            {
                onSuccess: (tags: GithubTag[]) => {
                    toast.success("Refreshed GitHub tags");
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

        let peersArray = peers
            .split(",")
            .map((p) =>
                p
                    .trim()
                    .split(":")
                    .map((s) => s.trim())
                    .join(":")
            )
            .filter((p) => p.length > 0);

        for (let peer of peersArray) {
            if (currentService === "liteNode") {
                // The peer should be an IP address (v4) only (dont use regex expression for simplicity)
                let ipSplits = peer.split(".");
                if (
                    ipSplits[0] !== "auto_p2p" &&
                    (ipSplits.length !== 4 ||
                        ipSplits.some((segment) => {
                            let num = Number(segment);
                            return isNaN(num) || num < 0 || num > 255;
                        }))
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

        // check logging passcode format
        let passcodeParts = loggingPasscode.split("-");
        if (passcodeParts.length !== 4) {
            return toast.error(
                "Logging passcode must be in the format X-X-X-X"
            );
        } else if (
            passcodeParts.some((part) => {
                let num = Number(part);
                return isNaN(num);
            })
        ) {
            return toast.error(
                "Each part of logging passcode must be a number"
            );
        }

        // check operator ID format
        if (operatorId.length !== 60) {
            return toast.error("Operator ID must be exactly 55 characters");
        }

        let mainAuxStatus: number =
            {
                main: 3,
                aux: 0,
            }[mode] || 0;

        let keydbConfigArray = [];
        for (let line of keydbConfig.split("\n")) {
            if (line.trim().length > 0) {
                keydbConfigArray.push(line.trim());
            }
        }
        let kvrocksConfigArray = [];
        for (let line of kvrocksConfig.split("\n")) {
            if (line.trim().length > 0) {
                kvrocksConfigArray.push(line.trim());
            }
        }
        let body = {
            servers: selectedStore.selectedServers,
            service: currentService,
            tag: tag,
            extraData: {
                epochFile: epochFile,
                peers: peersArray,
                mainAuxStatus,
                ids: ids
                    .split(",")
                    .map((id) => id.trim())
                    .filter((id) => id.length === 55),
                loggingPasscode: loggingPasscode,
                operatorId: operatorId.toUpperCase(),
                keydbConfig: keydbConfigArray,
                kvrocksConfig: kvrocksConfigArray,
                keepOldConfig: keepOldConfig,
            },
        };
        let jsonBobConfig = {};
        if (currentService === "bobNode" && bobConfig.trim().length > 0) {
            try {
                jsonBobConfig = JSON.parse(bobConfig);
            } catch (e) {
                return toast.error("Invalid JSON format for bob config");
            }
            (body.extraData as any).bobConfig = jsonBobConfig;
        }
        console.log("Deploy body:", body);
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

    useEffect(() => {
        setTag("");
        setEpochFile("");
        setPeers("");
        setIds("");
    }, [currentService]);

    let totalIdsAdded = ids
        .split(",")
        .filter((id) => id.trim().length === 55).length;
    let isThereInvalidId = ids
        .split(",")
        .some((id) => id.trim().length > 0 && id.trim().length !== 55);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger>
                <Rocket className="cursor-pointer" size={20} />
            </DialogTrigger>
            <DialogContent className="overflow-y-auto max-h-[90vh] w-full sm:w-[500px]">
                <DialogHeader>
                    <DialogTitle>Deploy New Epoch</DialogTitle>
                    <DialogDescription>
                        Deploy a new epoch to selected nodes using automated
                        systems.
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
                            <div className="space-x-2 space-y-2">
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
                                            {!(
                                                tagsLoading || isTagsFetching
                                            ) ? (
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
                                            MAIN/aux status
                                        </FieldLabel>
                                        <Tabs
                                            onValueChange={(val) =>
                                                setMode(val)
                                            }
                                            value={mode}
                                        >
                                            <TabsList>
                                                <TabsTrigger value="aux">
                                                    aux
                                                </TabsTrigger>
                                                <TabsTrigger value="main">
                                                    MAIN
                                                </TabsTrigger>
                                            </TabsList>
                                            <TabsContent value="main">
                                                <div className="w-full">
                                                    <div className="mb-2 text-sm w-full text-gray-800">
                                                        <span>Added</span>
                                                        <Badge className="ml-1 text-[11px]">
                                                            +{totalIdsAdded}
                                                        </Badge>
                                                        <span className="ml-1">
                                                            IDs
                                                        </span>
                                                    </div>
                                                    {isThereInvalidId && (
                                                        <div className="mb-2 text-sm w-full text-red-600">
                                                            Some seeds are
                                                            invalid. Each seed
                                                            should be exactly 55
                                                            characters.
                                                        </div>
                                                    )}
                                                    <Textarea
                                                        spellCheck={false}
                                                        value={ids}
                                                        onChange={(e) =>
                                                            setIds(
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="Your computor seeds (comma separated)"
                                                    />
                                                </div>
                                            </TabsContent>
                                            <TabsContent value="aux"></TabsContent>
                                        </Tabs>
                                        <FieldDescription>
                                            Select the node status to deploy
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
                                        <InputGroup>
                                            <InputGroupInput
                                                onChange={(e) =>
                                                    setPeers(e.target.value)
                                                }
                                                value={peers}
                                                placeholder="Peers"
                                            />
                                            <InputGroupAddon align="inline-end">
                                                {!isFetchingRandomPeers ? (
                                                    <InputGroupButton
                                                        onClick={() =>
                                                            handleFetchRandomPeers()
                                                        }
                                                        className="cursor-pointer"
                                                        variant="secondary"
                                                    >
                                                        Auto fetch peers
                                                    </InputGroupButton>
                                                ) : (
                                                    <InputGroupButton
                                                        disabled={true}
                                                        className="cursor-pointer"
                                                        variant="secondary"
                                                    >
                                                        Fetching...
                                                    </InputGroupButton>
                                                )}
                                            </InputGroupAddon>
                                        </InputGroup>
                                        <FieldDescription>
                                            Comma separated list of peer
                                            addresses (eg. 1.2.3.4,8.8.8.8)
                                        </FieldDescription>
                                    </Field>

                                    <Collapsible className="p-2 shadow-sm border rounded-md">
                                        <CollapsibleTrigger>
                                            <span className="cursor-pointer font-semibold text-[14px]">
                                                Advanced
                                                <ChevronsUpDown
                                                    className="inline-block ml-1 mb-1"
                                                    size={14}
                                                />
                                            </span>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent className="pt-2 space-y-3">
                                            <Field>
                                                <FieldLabel>
                                                    Operator ID
                                                </FieldLabel>
                                                <Input
                                                    value={operatorId}
                                                    onChange={(e) =>
                                                        setOperatorId(
                                                            e.target.value
                                                        )
                                                    }
                                                    type="text"
                                                    placeholder="Operator ID"
                                                />
                                            </Field>
                                            <Field>
                                                <FieldLabel>
                                                    Logging Passcode
                                                </FieldLabel>
                                                <Input
                                                    value={loggingPasscode}
                                                    onChange={(e) =>
                                                        setLoggingPasscode(
                                                            e.target.value
                                                        )
                                                    }
                                                    type="text"
                                                    placeholder="Logging passcode"
                                                />
                                                <FieldDescription>
                                                    Optional passcode to secure
                                                    logging access (default is
                                                    0-0-0-0)
                                                </FieldDescription>
                                            </Field>
                                        </CollapsibleContent>
                                    </Collapsible>
                                </FieldGroup>
                            </FieldSet>
                        </TabsContent>
                        <TabsContent className="w-full" value="bobNode">
                            <FieldSet className="mt-4">
                                <FieldGroup>
                                    <Field>
                                        <FieldLabel htmlFor="version">
                                            Version
                                        </FieldLabel>
                                        <div className="flex space-x-2">
                                            {!(
                                                tagsLoading || isTagsFetching
                                            ) ? (
                                                <Select
                                                    open={isSelectTagOpen}
                                                    onOpenChange={
                                                        setIsSelectTagOpen
                                                    }
                                                    value={tag}
                                                    onValueChange={setTag}
                                                >
                                                    <SelectTrigger className="w-11/12">
                                                        <SelectValue placeholder="Version" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            <SelectLabel>
                                                                Version
                                                            </SelectLabel>
                                                            <Input
                                                                value={
                                                                    customBinary
                                                                }
                                                                onKeyDown={(
                                                                    e
                                                                ) =>
                                                                    handleOnKeyDownCustomBinary(
                                                                        e
                                                                    )
                                                                }
                                                                onChange={(e) =>
                                                                    setCustomBinary(
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                placeholder="Custom binary"
                                                                className="my-2"
                                                            />
                                                            {customBinary && (
                                                                <SelectItem
                                                                    className="hidden"
                                                                    key={
                                                                        customBinary
                                                                    }
                                                                    value={
                                                                        customBinary
                                                                    }
                                                                >
                                                                    {
                                                                        customBinary
                                                                    }
                                                                </SelectItem>
                                                            )}
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
                                        <InputGroup>
                                            <InputGroupInput
                                                onChange={(e) =>
                                                    setPeers(e.target.value)
                                                }
                                                value={peers}
                                                placeholder="Peers"
                                            />
                                            <InputGroupAddon align="inline-end">
                                                {!isFetchingRandomPeers ? (
                                                    <InputGroupButton
                                                        onClick={() =>
                                                            handleFetchRandomPeers()
                                                        }
                                                        className="cursor-pointer"
                                                        variant="secondary"
                                                    >
                                                        Auto fetch peers
                                                    </InputGroupButton>
                                                ) : (
                                                    <InputGroupButton
                                                        disabled={true}
                                                        className="cursor-pointer"
                                                        variant="secondary"
                                                    >
                                                        Fetching...
                                                    </InputGroupButton>
                                                )}
                                            </InputGroupAddon>
                                        </InputGroup>
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
                                    <Collapsible className="p-2 shadow-sm border rounded-md">
                                        <CollapsibleTrigger>
                                            <span className="cursor-pointer font-semibold text-[14px]">
                                                Advanced
                                                <ChevronsUpDown
                                                    className="inline-block ml-1 mb-1"
                                                    size={14}
                                                />
                                            </span>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent className="pt-2 space-y-3">
                                            <Field>
                                                <FieldDescription className="space-y-1">
                                                    (Optional) Provide a custom
                                                    properties JSON to override
                                                    default bob node
                                                    configurations (it won't
                                                    override all settings, only
                                                    the provided keys).
                                                </FieldDescription>
                                                <Textarea
                                                    value={bobConfig}
                                                    onChange={(e) =>
                                                        setBobConfig(
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="custom bob config (json)"
                                                />
                                            </Field>
                                            <Field>
                                                <FieldDescription className="space-y-1">
                                                    (Optional) Provide a custom
                                                    configuration entry for
                                                    keydb.conf
                                                </FieldDescription>
                                                <Textarea
                                                    value={keydbConfig}
                                                    onChange={(e) =>
                                                        setKeydbConfig(
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder={`maxmemory 8gb
maxmemory-policy allkeys-lru`}
                                                />
                                            </Field>
                                            <Field>
                                                <FieldDescription className="space-y-1">
                                                    (Optional) Provide a custom
                                                    configuration entry for
                                                    kvrocks.conf
                                                </FieldDescription>
                                                <Textarea
                                                    value={kvrocksConfig}
                                                    onChange={(e) =>
                                                        setKvrocksConfig(
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder={`rocksdb.ttl 1814400
                                                        `}
                                                />
                                            </Field>
                                            <Field>
                                                <FieldDescription className="space-y-1">
                                                    Keep old bob configurations
                                                </FieldDescription>
                                                <div
                                                    onClick={() =>
                                                        setKeepOldConfig(
                                                            !keepOldConfig
                                                        )
                                                    }
                                                    className="flex items-center cursor-pointer"
                                                >
                                                    <Checkbox
                                                        checked={keepOldConfig}
                                                        onCheckedChange={(
                                                            checked
                                                        ) =>
                                                            setKeepOldConfig(
                                                                Boolean(checked)
                                                            )
                                                        }
                                                    />
                                                    <span className="ml-2 text-sm">
                                                        Keep old bob
                                                        configurations
                                                        (bob_config.json will
                                                        not be deleted during
                                                        deployment)
                                                    </span>
                                                </div>
                                            </Field>
                                        </CollapsibleContent>
                                    </Collapsible>
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
