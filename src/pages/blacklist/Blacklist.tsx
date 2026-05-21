import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import useGeneralPost, { useGeneralGet } from "@/networking/api";
import type { BlacklistedPeer } from "@/types/type";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export default function Blacklist() {
    const queryClient = useQueryClient();
    let [ipsInput, setIpsInput] = useState("");
    let [note, setNote] = useState("");
    let [selected, setSelected] = useState<Set<string>>(new Set());

    let { data: blacklist } = useGeneralGet<{
        peers: BlacklistedPeer[];
    }>({
        queryKey: ["blacklisted-peers"],
        path: "/blacklisted-peers",
    });

    let { mutate: addPeers } = useGeneralPost<{
        message: string;
        added: number;
        alreadyPresent: number;
        invalid: string[];
    }>({
        queryKey: ["blacklisted-peers", "add"],
        path: "/blacklisted-peers",
    });

    let { mutate: deletePeers } = useGeneralPost<{
        message: string;
        deleted: number;
    }>({
        queryKey: ["blacklisted-peers", "delete"],
        path: "/blacklisted-peers",
        method: "DELETE",
    });

    const peers = blacklist?.peers ?? [];
    const allSelected =
        peers.length > 0 && peers.every((p) => selected.has(p.ip));

    const toggleOne = (ip: string) => {
        setSelected((prev) => {
            let next = new Set(prev);
            if (next.has(ip)) next.delete(ip);
            else next.add(ip);
            return next;
        });
    };

    const toggleAll = (checked: boolean) => {
        setSelected(checked ? new Set(peers.map((p) => p.ip)) : new Set());
    };

    const handleAdd = () => {
        if (!ipsInput.trim()) {
            toast.error("Enter at least one IP");
            return;
        }
        addPeers(
            {
                ips: ipsInput,
                note: note.trim() || undefined,
            } as any,
            {
                onSuccess: (data) => {
                    setIpsInput("");
                    setNote("");
                    queryClient.invalidateQueries([
                        "blacklisted-peers",
                    ] as any);
                    let { added, alreadyPresent, invalid } = data;
                    let summary =
                        added === 0 && alreadyPresent > 0
                            ? `All ${alreadyPresent} IP(s) already in list`
                            : `Added ${added} IP(s)` +
                              (alreadyPresent
                                  ? `, ${alreadyPresent} already present`
                                  : "");
                    if (invalid && invalid.length > 0) {
                        toast.warning(
                            `${summary}. Skipped invalid: ${invalid.join(", ")}`
                        );
                    } else {
                        toast.success(summary);
                    }
                },
                onError: (error) => {
                    toast.error(
                        "Failed to add IPs: " + (error as Error).message ||
                            "Unknown error"
                    );
                },
            }
        );
    };

    const handleDelete = (ips: string[]) => {
        if (ips.length === 0) return;
        deletePeers(
            {
                ips,
            } as any,
            {
                onSuccess: (data) => {
                    let removed = new Set(ips);
                    queryClient.setQueryData(
                        ["blacklisted-peers"],
                        (oldData: any) => {
                            if (!oldData) return oldData;
                            return {
                                ...oldData,
                                peers: oldData.peers.filter(
                                    (p: BlacklistedPeer) => !removed.has(p.ip)
                                ),
                            };
                        }
                    );
                    setSelected((prev) => {
                        let next = new Set(prev);
                        ips.forEach((ip) => next.delete(ip));
                        return next;
                    });
                    toast.success(
                        `Removed ${data?.deleted ?? ips.length} from blacklist`
                    );
                },
                onError: (error) => {
                    toast.error(
                        "Failed to remove IP(s): " +
                            (error as Error).message || "Unknown error"
                    );
                },
            }
        );
    };

    return (
        <div className="p-4">
            <h3 className="text-2xl font-bold mb-1">Blacklisted Peers</h3>
            <p className="text-sm text-gray-500 dark:text-muted-foreground mb-4">
                Blacklisted IPs are ignored (never returned) by the random-peers
                API.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end mb-4 max-w-3xl">
                <div className="flex-1 w-full">
                    <label className="block mb-1 text-sm">
                        IP(s) — separate multiple with commas
                    </label>
                    <Input
                        type="text"
                        value={ipsInput}
                        placeholder="e.g. 1.2.3.4, 5.6.7.8, 9.10.11.12"
                        onChange={(e) => setIpsInput(e.target.value)}
                        className="w-full border border-gray-300 dark:border-border rounded px-3 py-2"
                    />
                </div>
                <div className="w-full sm:w-56">
                    <label className="block mb-1 text-sm">Note (optional)</label>
                    <Input
                        type="text"
                        value={note}
                        placeholder="reason"
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full border border-gray-300 dark:border-border rounded px-3 py-2"
                    />
                </div>
                <Button className="cursor-pointer" onClick={handleAdd}>
                    Add to Blacklist
                </Button>
            </div>

            <div className="mb-2 h-9 flex items-center">
                {selected.size > 0 && (
                    <Button
                        variant="destructive"
                        className="cursor-pointer"
                        onClick={() => handleDelete([...selected])}
                    >
                        Delete Selected ({selected.size})
                    </Button>
                )}
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-10">
                            <Checkbox
                                checked={allSelected}
                                onCheckedChange={(checked) =>
                                    toggleAll(Boolean(checked))
                                }
                                aria-label="Select all"
                            />
                        </TableHead>
                        <TableHead>IP</TableHead>
                        <TableHead>Note</TableHead>
                        <TableHead>Added By</TableHead>
                        <TableHead>Added At</TableHead>
                        <TableHead>Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {peers.map((peer) => (
                        <TableRow key={peer.ip}>
                            <TableCell>
                                <Checkbox
                                    checked={selected.has(peer.ip)}
                                    onCheckedChange={() => toggleOne(peer.ip)}
                                    aria-label={`Select ${peer.ip}`}
                                />
                            </TableCell>
                            <TableCell>{peer.ip}</TableCell>
                            <TableCell>{peer.note || "-"}</TableCell>
                            <TableCell>{peer.operator}</TableCell>
                            <TableCell>
                                {peer.createdAt
                                    ? new Date(peer.createdAt).toLocaleString()
                                    : "-"}
                            </TableCell>
                            <TableCell>
                                <span
                                    onClick={() => handleDelete([peer.ip])}
                                    className="text-red-500 cursor-pointer"
                                >
                                    Delete
                                </span>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
