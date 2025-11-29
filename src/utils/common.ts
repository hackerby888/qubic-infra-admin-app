export function isNodeActive(lastTickChanged: number): boolean {
    // Consider a node active if its tick has changed in the last 2 minutes
    return Date.now() - lastTickChanged < 2 * 60 * 1000;
}

export function millisToSeconds(ms: number): number {
    return Number((ms / 1000).toFixed(2));
}

export function mainAuxStatusToString(status: number): string {
    return (
        {
            0: "aux&aux",
            1: "MAIN&aux",
            2: "aux&MAIN",
            3: "MAIN&MAIN",
        }[status] || "unknown"
    );
}
