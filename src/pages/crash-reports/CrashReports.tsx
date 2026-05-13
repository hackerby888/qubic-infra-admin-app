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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useGeneralGet } from "@/networking/api";
import type { CrashReport } from "@/types/type";

const TIME_RANGES = [
    { label: "Last 24 hours", value: "1" },
    { label: "Last 3 days", value: "3" },
    { label: "Last 7 days", value: "7" },
    { label: "Last 14 days", value: "14" },
    { label: "Last 30 days", value: "30" },
    { label: "Last 90 days", value: "90" },
    { label: "All time", value: "all" },
];

const SIGNAL_NAMES: Record<number, { name: string; desc: string }> = {
    1: { name: "SIGHUP", desc: "Hangup" },
    2: { name: "SIGINT", desc: "Interrupt (Ctrl+C)" },
    3: { name: "SIGQUIT", desc: "Quit" },
    4: { name: "SIGILL", desc: "Illegal instruction" },
    5: { name: "SIGTRAP", desc: "Trace/breakpoint trap" },
    6: { name: "SIGABRT", desc: "Aborted (abort() called)" },
    7: { name: "SIGBUS", desc: "Bus error (bad memory access)" },
    8: { name: "SIGFPE", desc: "Floating-point exception" },
    9: { name: "SIGKILL", desc: "Killed (cannot be caught)" },
    10: { name: "SIGUSR1", desc: "User-defined signal 1" },
    11: { name: "SIGSEGV", desc: "Segmentation fault" },
    12: { name: "SIGUSR2", desc: "User-defined signal 2" },
    13: { name: "SIGPIPE", desc: "Broken pipe" },
    14: { name: "SIGALRM", desc: "Alarm clock" },
    15: { name: "SIGTERM", desc: "Terminated" },
    16: { name: "SIGSTKFLT", desc: "Stack fault" },
    17: { name: "SIGCHLD", desc: "Child stopped or terminated" },
    18: { name: "SIGCONT", desc: "Continue" },
    19: { name: "SIGSTOP", desc: "Stop (cannot be caught)" },
    20: { name: "SIGTSTP", desc: "Stop (Ctrl+Z)" },
    21: { name: "SIGTTIN", desc: "Terminal input for background process" },
    22: { name: "SIGTTOU", desc: "Terminal output for background process" },
    23: { name: "SIGURG", desc: "Urgent condition on socket" },
    24: { name: "SIGXCPU", desc: "CPU time limit exceeded" },
    25: { name: "SIGXFSZ", desc: "File size limit exceeded" },
    26: { name: "SIGVTALRM", desc: "Virtual alarm clock" },
    27: { name: "SIGPROF", desc: "Profiling timer expired" },
    28: { name: "SIGWINCH", desc: "Window resize" },
    29: { name: "SIGIO", desc: "I/O now possible" },
    30: { name: "SIGPWR", desc: "Power failure" },
    31: { name: "SIGSYS", desc: "Bad system call" },
};

function describeSignal(signal: number) {
    const s = SIGNAL_NAMES[signal];
    if (!s) return `Signal ${signal}`;
    return `${signal} — ${s.name} (${s.desc})`;
}

interface StackFrame {
    index: string;
    body: string;
    location?: string;
}

function parseStacktrace(stacktrace: string): StackFrame[] {
    return stacktrace
        .split("\n")
        .map((line) => line.trimEnd())
        .filter((line) => line.length > 0)
        .map((line) => {
            const match = line.match(/^\s*(\d+)#\s*(.*)$/);
            if (!match) return { index: "", body: line };
            const rest = match[2];
            const atIdx = rest.lastIndexOf(" at ");
            const inIdx = rest.lastIndexOf(" in ");
            let body = rest;
            let location: string | undefined;
            if (atIdx > 0) {
                body = rest.slice(0, atIdx);
                location = rest.slice(atIdx + 4);
            } else if (inIdx > 0) {
                body = rest.slice(0, inIdx);
                location = rest.slice(inIdx + 4);
            }
            return { index: match[1], body, location };
        });
}

function summarizeLogs(logs: string): string {
    const parsed = parseLogs(logs);
    if (!parsed) return logs;
    const parts: string[] = [];
    if (typeof parsed.signal === "number") {
        const s = SIGNAL_NAMES[parsed.signal as number];
        parts.push(s ? `${s.name} (${parsed.signal})` : `signal=${parsed.signal}`);
    }
    if (typeof parsed.stacktrace === "string") {
        const first = (parsed.stacktrace as string)
            .split("\n")
            .find((l) => l.trim().length > 0);
        if (first) {
            const m = first.match(/^\s*\d+#\s*(.*)$/);
            parts.push(m ? m[1] : first);
        }
    }
    if (parts.length === 0) {
        const keys = Object.keys(parsed).filter((k) => k !== "type");
        return keys.length > 0 ? keys.join(", ") : logs;
    }
    return parts.join(" — ");
}

function parseLogs(logs: string): Record<string, unknown> | null {
    try {
        const v = JSON.parse(logs);
        return v && typeof v === "object" ? v : null;
    } catch {
        return null;
    }
}

function CrashReportDetail({ report }: { report: CrashReport }) {
    const parsed = parseLogs(report.logs);

    const signal =
        parsed && typeof parsed.signal === "number"
            ? (parsed.signal as number)
            : undefined;
    const stacktrace =
        parsed && typeof parsed.stacktrace === "string"
            ? (parsed.stacktrace as string)
            : undefined;
    const frames = stacktrace ? parseStacktrace(stacktrace) : [];

    const otherEntries = parsed
        ? Object.entries(parsed).filter(
              ([k]) => k !== "signal" && k !== "stacktrace" && k !== "type"
          )
        : [];

    return (
        <div className="space-y-4 text-sm flex-1 overflow-y-auto min-h-0 pr-1">
            <div className="grid grid-cols-3 gap-2">
                <div>
                    <div className="text-xs text-muted-foreground">Timestamp</div>
                    <div>{new Date(report.timestamp).toLocaleString()}</div>
                </div>
                <div>
                    <div className="text-xs text-muted-foreground">Type</div>
                    <div>{report.type || "unknown"}</div>
                </div>
                <div>
                    <div className="text-xs text-muted-foreground">IP</div>
                    <div className="font-mono text-xs">{report.ip}</div>
                </div>
            </div>

            {signal !== undefined && (
                <div>
                    <div className="text-xs text-muted-foreground mb-1">
                        Signal
                    </div>
                    <div className="font-mono text-sm bg-muted px-2 py-1 rounded inline-block">
                        {describeSignal(signal)}
                    </div>
                </div>
            )}

            {otherEntries.length > 0 && (
                <div>
                    <div className="text-xs text-muted-foreground mb-1">
                        Details
                    </div>
                    <div className="bg-muted rounded-md p-3 space-y-1">
                        {otherEntries.map(([k, v]) => (
                            <div key={k} className="flex gap-2 text-xs">
                                <span className="font-semibold min-w-32">
                                    {k}
                                </span>
                                <span className="font-mono break-all">
                                    {typeof v === "string"
                                        ? v
                                        : JSON.stringify(v)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {frames.length > 0 && (
                <div>
                    <div className="text-xs text-muted-foreground mb-1">
                        Stack trace ({frames.length} frames)
                    </div>
                    <div className="bg-muted rounded-md p-3 overflow-x-auto text-xs font-mono">
                        <table className="w-full">
                            <tbody>
                                {frames.map((f, i) => (
                                    <tr
                                        key={i}
                                        className="align-top hover:bg-background/40"
                                    >
                                        <td className="text-muted-foreground pr-3 select-none whitespace-nowrap">
                                            #{f.index || i}
                                        </td>
                                        <td className="pr-3 break-all">
                                            {f.body}
                                        </td>
                                        <td className="text-muted-foreground break-all">
                                            {f.location || ""}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {!parsed && (
                <div>
                    <div className="text-xs text-muted-foreground mb-1">
                        Raw logs
                    </div>
                    <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto whitespace-pre-wrap break-all">
                        {report.logs}
                    </pre>
                </div>
            )}

            <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground">
                    Show raw JSON
                </summary>
                <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto whitespace-pre-wrap break-all mt-2">
                    {parsed
                        ? JSON.stringify(parsed, null, 2)
                        : report.logs}
                </pre>
            </details>
        </div>
    );
}

export default function CrashReports() {
    const [sinceDays, setSinceDays] = useState<string>("7");
    const [typeFilter, setTypeFilter] = useState<string>("");
    const [ipFilter, setIpFilter] = useState<string>("");
    const [search, setSearch] = useState<string>("");
    const [selected, setSelected] = useState<CrashReport | null>(null);

    const reqQuery = useMemo(() => {
        const q: Record<string, string | number> = { limit: 1000 };
        if (sinceDays !== "all") q.sinceDays = sinceDays;
        if (typeFilter.trim()) q.type = typeFilter.trim();
        if (ipFilter.trim()) q.ip = ipFilter.trim();
        return q;
    }, [sinceDays, typeFilter, ipFilter]);

    const { data, isFetching, refetch } = useGeneralGet<{
        items: CrashReport[];
        total: number;
        limit: number;
    }>({
        queryKey: ["crash-reports", reqQuery],
        path: "/crash-reports",
        reqQuery,
    });

    const items = useMemo(() => data?.items ?? [], [data]);
    const total = data?.total ?? 0;

    const filtered = useMemo(() => {
        if (!search.trim()) return items;
        const needle = search.toLowerCase();
        return items.filter(
            (r) =>
                r.ip.toLowerCase().includes(needle) ||
                r.type.toLowerCase().includes(needle) ||
                r.logs.toLowerCase().includes(needle)
        );
    }, [items, search]);

    return (
        <div className="p-4">
            <h3 className="text-2xl font-bold mb-4">Crash Reports</h3>

            <div className="flex flex-wrap gap-3 items-end mb-4">
                <div>
                    <label className="block mb-1 text-xs text-muted-foreground">
                        Time range
                    </label>
                    <Select value={sinceDays} onValueChange={setSinceDays}>
                        <SelectTrigger className="w-44">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {TIME_RANGES.map((r) => (
                                <SelectItem key={r.value} value={r.value}>
                                    {r.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="block mb-1 text-xs text-muted-foreground">
                        Type
                    </label>
                    <Input
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        placeholder="e.g. liteNode"
                        className="w-44"
                    />
                </div>
                <div>
                    <label className="block mb-1 text-xs text-muted-foreground">
                        IP
                    </label>
                    <Input
                        value={ipFilter}
                        onChange={(e) => setIpFilter(e.target.value)}
                        placeholder="e.g. 1.2.3.4"
                        className="w-44"
                    />
                </div>
                <div>
                    <label className="block mb-1 text-xs text-muted-foreground">
                        Search (client-side)
                    </label>
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search in logs"
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
            </div>

            <div className="text-sm text-muted-foreground mb-2">
                Showing {filtered.length} of {items.length} fetched
                {total > items.length ? ` (${total} total in range)` : ""}
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-48">Timestamp</TableHead>
                        <TableHead className="w-40">Type</TableHead>
                        <TableHead className="w-40">IP</TableHead>
                        <TableHead>Logs</TableHead>
                        <TableHead className="w-24">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filtered.length === 0 && !isFetching && (
                        <TableRow>
                            <TableCell
                                colSpan={5}
                                className="text-center text-muted-foreground py-8"
                            >
                                No crash reports in this range.
                            </TableCell>
                        </TableRow>
                    )}
                    {filtered.map((r, idx) => (
                        <TableRow key={`${r.timestamp}-${r.ip}-${idx}`}>
                            <TableCell className="whitespace-nowrap">
                                {new Date(r.timestamp).toLocaleString()}
                            </TableCell>
                            <TableCell>{r.type || "unknown"}</TableCell>
                            <TableCell className="font-mono text-xs">
                                {r.ip}
                            </TableCell>
                            <TableCell className="font-mono text-xs max-w-xl truncate">
                                {summarizeLogs(r.logs)}
                            </TableCell>
                            <TableCell>
                                <span
                                    onClick={() => setSelected(r)}
                                    className="text-blue-500 cursor-pointer"
                                >
                                    View
                                </span>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <Dialog
                open={!!selected}
                onOpenChange={(open) => !open && setSelected(null)}
            >
                <DialogContent className="sm:max-w-[min(95vw,1400px)] w-[95vw] h-[90vh] max-h-[90vh] flex flex-col overflow-hidden">
                    <DialogHeader className="shrink-0">
                        <DialogTitle>Crash Report</DialogTitle>
                    </DialogHeader>
                    {selected && <CrashReportDetail report={selected} />}
                </DialogContent>
            </Dialog>
        </div>
    );
}
