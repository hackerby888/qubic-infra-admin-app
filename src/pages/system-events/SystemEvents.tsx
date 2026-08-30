import { useMemo, useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useGeneralGet } from "@/networking/api";
import useGeneralPost from "@/networking/api";
import type { SystemEvent } from "@/types/type";

// Values are durations in ms — the backend resolves them per request (see `sinceMs`).
const TIME_RANGES = [
    { label: "Last 30 minutes", value: String(30 * 60_000) },
    { label: "Last 6 hours", value: String(6 * 3_600_000) },
    { label: "Last 1 day", value: String(86_400_000) },
    { label: "Last 3 days", value: String(3 * 86_400_000) },
    { label: "Last 7 days", value: String(7 * 86_400_000) },
    { label: "Last 30 days", value: String(30 * 86_400_000) },
];

const EVENT_TYPES = [
    { label: "All types", value: "all" },
    { label: "Node down", value: "node_down" },
    { label: "Node recovered", value: "node_recovered" },
    { label: "Node lagging", value: "node_lagging" },
    { label: "Node caught up", value: "node_lag_recovered" },
    { label: "Main node lagging", value: "main_node_lagging" },
    { label: "Main node recovered", value: "main_node_recovered" },
    { label: "Main node failover", value: "main_node_failover" },
    { label: "MongoDB down", value: "db_down" },
    { label: "MongoDB recovered", value: "db_recovered" },
    { label: "Backend started", value: "backend_started" },
    { label: "Backend stopped", value: "backend_stopped" },
];

const TYPE_LABELS: Record<string, string> = Object.fromEntries(EVENT_TYPES.map((type) => [type.value, type.label]));

function severityBadge(severity: SystemEvent["severity"]) {
    if (severity === "error") return <Badge variant="destructive">error</Badge>;
    if (severity === "warn") return <Badge variant="secondary">warn</Badge>;
    return <Badge variant="outline">info</Badge>;
}

export default function SystemEvents() {
    const [rangeMs, setRangeMs] = useState<string>(TIME_RANGES[2].value);
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [search, setSearch] = useState<string>("");
    const [selected, setSelected] = useState<SystemEvent | null>(null);

    // A duration, not an absolute `since`: the server resolves it per request, so the 15s
    // refetch keeps showing a sliding window even on a page left open for hours.
    const reqQuery = useMemo(() => {
        const query: Record<string, string | number> = { limit: 1000, sinceMs: Number(rangeMs) };

        if (typeFilter !== "all") {
            query.type = typeFilter;
        }

        return query;
    }, [rangeMs, typeFilter]);

    const { data, isFetching, isError, error, refetch } = useGeneralGet<{
        items: SystemEvent[];
        total: number;
        limit: number;
    }>({
        queryKey: ["system-events", reqQuery],
        path: "/system-events",
        reqQuery,
        refetchInterval: 15000,
    });

    // One mutation for the whole page: ids for a single row, the current filter for
    // "clear range". The backend picks the branch off the body.
    const { mutate: deleteEvents } = useGeneralPost<{
        message: string;
        deletedCount: number;
    }>({
        queryKey: ["system-events", "delete"],
        path: "/system-events",
        method: "DELETE",
    });

    const items = useMemo(() => data?.items ?? [], [data]);
    const total = data?.total ?? 0;

    const filtered = useMemo(() => {
        if (!search.trim()) return items;
        const needle = search.toLowerCase();
        return items.filter(
            (event) =>
                event.message.toLowerCase().includes(needle) ||
                event.type.toLowerCase().includes(needle) ||
                (event.server ?? "").toLowerCase().includes(needle) ||
                (event.service ?? "").toLowerCase().includes(needle)
        );
    }, [items, search]);

    const runDelete = (body: Record<string, unknown>, successMessage: string) => {
        deleteEvents(body as any, {
            onSuccess: (result) => {
                toast.success(`${successMessage} (${result?.deletedCount ?? 0})`);
                refetch();
            },
            onError: (error) => {
                toast.error("Failed to delete: " + ((error as Error).message || "Unknown error"));
            },
        });
    };

    return (
        <div className="p-4">
            <h3 className="text-2xl font-bold mb-4 font-display">
                System Events
            </h3>

            <div className="accent-panel p-4 shadow-sm mb-4">
                <p className="text-sm text-muted-foreground">
                    History of node down / recovery, tick lag, main-node
                    failover, database and backend lifecycle events. Written by
                    the leader instance at each state change; kept for 31 days.
                </p>
            </div>

            {isError && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive mb-4">
                    Failed to load system events:{" "}
                    {(error as Error)?.message || "Unknown error"}
                </div>
            )}

            <div className="flex flex-wrap gap-3 items-end mb-4">
                <div>
                    <label className="block mb-1 text-xs text-muted-foreground">
                        Time range
                    </label>
                    <Select value={rangeMs} onValueChange={setRangeMs}>
                        <SelectTrigger className="w-44">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {TIME_RANGES.map((range) => (
                                <SelectItem key={range.value} value={range.value}>
                                    {range.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="block mb-1 text-xs text-muted-foreground">
                        Type
                    </label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-52">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {EVENT_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="block mb-1 text-xs text-muted-foreground">
                        Search (client-side)
                    </label>
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search message, server, type"
                        className="w-64"
                    />
                </div>
                <Button
                    variant="outline"
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="cursor-pointer"
                >
                    {isFetching ? "Loading..." : "Refresh"}
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="outline"
                            disabled={items.length === 0}
                            className="cursor-pointer text-destructive"
                        >
                            Clear this range
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Are you absolutely sure?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                This permanently deletes every system event
                                matching the current time range and type filter
                                ({total} event{total === 1 ? "" : "s"}). This
                                cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() =>
                                    runDelete(
                                        { sinceMs: reqQuery.sinceMs, ...(typeFilter !== "all" ? { type: typeFilter } : {}) },
                                        "Cleared events"
                                    )
                                }
                                className="bg-destructive hover:bg-destructive/90 cursor-pointer"
                            >
                                Delete All
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>

            <div className="text-sm text-muted-foreground mb-2">
                Showing {filtered.length} of {items.length} fetched
                {total > items.length ? ` (${total} total in range)` : ""}
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-48">Time</TableHead>
                        <TableHead className="w-24">Severity</TableHead>
                        <TableHead className="w-44">Type</TableHead>
                        <TableHead className="w-40">Server</TableHead>
                        <TableHead className="w-24">Service</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead className="w-28">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filtered.length === 0 && !isFetching && (
                        <TableRow>
                            <TableCell
                                colSpan={7}
                                className="text-center text-muted-foreground py-8"
                            >
                                No system events in this range.
                            </TableCell>
                        </TableRow>
                    )}
                    {filtered.map((event) => (
                        <TableRow key={event._id}>
                            <TableCell className="whitespace-nowrap">
                                {new Date(event.timestamp).toLocaleString()}
                            </TableCell>
                            <TableCell>{severityBadge(event.severity)}</TableCell>
                            <TableCell>{TYPE_LABELS[event.type] ?? event.type}</TableCell>
                            <TableCell className="font-mono text-xs">
                                {event.server ?? "—"}
                            </TableCell>
                            <TableCell className="text-xs">
                                {event.service ?? "—"}
                            </TableCell>
                            <TableCell className="max-w-xl truncate">
                                {event.message}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                                <span
                                    onClick={() => setSelected(event)}
                                    className="text-primary cursor-pointer mr-3"
                                >
                                    View
                                </span>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <span className="text-destructive cursor-pointer">
                                            Delete
                                        </span>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>
                                                Delete this event?
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                                {event.message}
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>
                                                Cancel
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => runDelete({ ids: [event._id] }, "Event deleted")}
                                                className="bg-destructive hover:bg-destructive/90 cursor-pointer"
                                            >
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <Dialog
                open={!!selected}
                onOpenChange={(open) => !open && setSelected(null)}
            >
                <DialogContent className="sm:max-w-[min(95vw,900px)] w-[95vw] max-h-[90vh] flex flex-col overflow-hidden">
                    <DialogHeader className="shrink-0">
                        <DialogTitle>System Event</DialogTitle>
                    </DialogHeader>
                    {selected && (
                        <div className="space-y-4 text-sm flex-1 overflow-y-auto min-h-0 pr-1">
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <div className="text-xs text-muted-foreground">
                                        Time
                                    </div>
                                    <div>
                                        {new Date(
                                            selected.timestamp
                                        ).toLocaleString()}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">
                                        Type
                                    </div>
                                    <div>
                                        {TYPE_LABELS[selected.type] ??
                                            selected.type}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">
                                        Server
                                    </div>
                                    <div className="font-mono text-xs">
                                        {selected.server ?? "—"}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-muted-foreground mb-1">
                                    Message
                                </div>
                                <div>{selected.message}</div>
                            </div>
                            {selected.details && (
                                <div>
                                    <div className="text-xs text-muted-foreground mb-1">
                                        Details
                                    </div>
                                    <div className="bg-muted rounded-md p-3 space-y-1">
                                        {Object.entries(selected.details).map(([key, value]) => (
                                            <div key={key} className="flex gap-2 text-xs">
                                                <span className="font-semibold min-w-32">{key}</span>
                                                <span className="font-mono break-all">
                                                    {typeof value === "string" ? value : JSON.stringify(value)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
