import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useGeneralGet } from "@/networking/api";

type Instance = {
    instanceId: string;
    leader: boolean;
    uptimeSec: number | null;
    snapshotAgeMs: number | null;
    lastSeenMs: number | null;
    stale: boolean;
};
type ReplicaMember = {
    name: string;
    state: string;
    health: number;
    uptimeSec: number;
    self: boolean;
    lagSec: number;
};
type Replica =
    | { ok: true; set: string; members: ReplicaMember[] }
    | { ok: false; error: string };
type NodesSummary = {
    lite: { total: number; active: number; lagging: number };
    bob: { total: number; active: number };
    network: { tick: number; epoch: number };
} | null;
type SystemHealth = {
    instances: Instance[];
    instancesError?: string;
    replica: Replica | null;
    nodes: NodesSummary;
};

const fmtDuration = (sec?: number | null) => {
    if (sec == null) return "—";
    if (sec < 60) return `${Math.round(sec)}s`;
    if (sec < 3600) return `${Math.floor(sec / 60)}m`;
    if (sec < 86400)
        return `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m`;
    return `${Math.floor(sec / 86400)}d ${Math.floor((sec % 86400) / 3600)}h`;
};
const fmtAgeMs = (ms?: number | null) => {
    if (ms == null) return "—";
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
};
const fmtLastSeen = (ms?: number | null) =>
    ms == null ? "—" : `${Math.round(ms / 1000)}s ago`;

function KpiCard({
    label,
    value,
    sub,
}: {
    label: string;
    value: string | number;
    sub?: string;
}) {
    return (
        <div className="accent-panel p-4 shadow-sm">
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="text-2xl font-bold font-display mt-1">{value}</div>
            {sub && (
                <div className="text-xs text-muted-foreground mt-1">{sub}</div>
            )}
        </div>
    );
}

function stateBadge(state: string) {
    if (state === "PRIMARY") return <Badge>PRIMARY</Badge>;
    if (state === "SECONDARY")
        return <Badge variant="secondary">SECONDARY</Badge>;
    return <Badge variant="outline">{state}</Badge>;
}

export default function SystemHealth() {
    const { data, isLoading, isError, error } = useGeneralGet<SystemHealth>({
        queryKey: ["system-health"],
        path: "/system-health",
        refetchInterval: 5000,
    });

    const instances = data?.instances || [];
    const leaderCount = instances.filter((i) => i.leader).length;
    const upCount = instances.filter((i) => !i.stale).length;
    const replica = data?.replica;
    const nodes = data?.nodes;

    return (
        <div className="p-4">
            <h3 className="text-2xl font-bold mb-4 font-display">
                System Health
            </h3>
            <div className="flex flex-col space-y-6">
                <div className="accent-panel p-4 shadow-sm">
                    <h4 className="text-lg font-semibold mb-2">Overview</h4>
                    <p className="text-sm text-muted-foreground">
                        Live status of the backend instances, the MongoDB replica
                        set, and the managed node fleet. Auto-refreshes every 5s.
                    </p>
                </div>

                {isError && (
                    <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                        Failed to load system health: {(error as Error)?.message}
                    </div>
                )}

                {/* Backend instances */}
                <section>
                    <h4 className="text-lg font-semibold mb-2">
                        Backend Instances{" "}
                        <span className="text-sm font-normal text-muted-foreground">
                            ({upCount} up · {leaderCount} leader)
                        </span>
                    </h4>
                    {isLoading ? (
                        <Skeleton className="h-24 w-full" />
                    ) : data?.instancesError ? (
                        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                            {data.instancesError}
                        </div>
                    ) : instances.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No instances reporting.
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Instance</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Uptime</TableHead>
                                    <TableHead>Snapshot age</TableHead>
                                    <TableHead>Last seen</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {instances.map((i) => (
                                    <TableRow key={i.instanceId}>
                                        <TableCell className="font-mono text-xs">
                                            {i.instanceId.slice(0, 8)}
                                        </TableCell>
                                        <TableCell>
                                            {i.leader ? (
                                                <Badge>LEADER</Badge>
                                            ) : (
                                                <Badge variant="outline">
                                                    replica
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {fmtDuration(i.uptimeSec)}
                                        </TableCell>
                                        <TableCell>
                                            {fmtAgeMs(i.snapshotAgeMs)}
                                        </TableCell>
                                        <TableCell>
                                            {fmtLastSeen(i.lastSeenMs)}
                                        </TableCell>
                                        <TableCell>
                                            {i.stale ? (
                                                <Badge variant="destructive">
                                                    stale
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary">
                                                    live
                                                </Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </section>

                {/* Replica set */}
                <section>
                    <h4 className="text-lg font-semibold mb-2">
                        Database Replica Set
                        {replica && replica.ok && (
                            <span className="text-sm font-normal text-muted-foreground">
                                {" "}
                                · {replica.set}
                            </span>
                        )}
                    </h4>
                    {isLoading ? (
                        <Skeleton className="h-24 w-full" />
                    ) : !replica ? (
                        <p className="text-sm text-muted-foreground">
                            No data.
                        </p>
                    ) : !replica.ok ? (
                        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                            Replica status unavailable:{" "}
                            <span className="font-mono">{replica.error}</span>
                            <div className="text-xs text-muted-foreground mt-1">
                                The app DB user needs the{" "}
                                <span className="font-mono">clusterMonitor</span>{" "}
                                role to read replica status.
                            </div>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Member</TableHead>
                                    <TableHead>State</TableHead>
                                    <TableHead>Health</TableHead>
                                    <TableHead>Lag</TableHead>
                                    <TableHead>Uptime</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {replica.members.map((m) => (
                                    <TableRow key={m.name}>
                                        <TableCell className="font-mono text-xs">
                                            {m.name}
                                            {m.self && (
                                                <span className="text-muted-foreground">
                                                    {" "}
                                                    (self)
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {stateBadge(m.state)}
                                        </TableCell>
                                        <TableCell>
                                            {m.health === 1 ? (
                                                <Badge variant="secondary">
                                                    up
                                                </Badge>
                                            ) : (
                                                <Badge variant="destructive">
                                                    down
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {m.state === "PRIMARY"
                                                ? "—"
                                                : `${m.lagSec.toFixed(1)}s`}
                                        </TableCell>
                                        <TableCell>
                                            {fmtDuration(m.uptimeSec)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </section>

                {/* Managed nodes */}
                <section>
                    <h4 className="text-lg font-semibold mb-2">Managed Nodes</h4>
                    {isLoading ? (
                        <Skeleton className="h-24 w-full" />
                    ) : !nodes ? (
                        <p className="text-sm text-muted-foreground">
                            No data.
                        </p>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <KpiCard
                                label="Lite Nodes"
                                value={`${nodes.lite.active}/${nodes.lite.total}`}
                                sub={`active · ${nodes.lite.lagging} lagging`}
                            />
                            <KpiCard
                                label="Bob Nodes"
                                value={`${nodes.bob.active}/${nodes.bob.total}`}
                                sub="active"
                            />
                            <KpiCard
                                label="Network Tick"
                                value={nodes.network.tick.toLocaleString()}
                            />
                            <KpiCard
                                label="Epoch"
                                value={nodes.network.epoch}
                            />
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
