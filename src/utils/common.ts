export function isNodeActive(lastTickChanged: number): boolean {
    // Consider a node active if its tick has changed in the last 2 minutes
    return Date.now() - lastTickChanged < 2 * 60 * 1000;
}

export function millisToSeconds(ms: number): number {
    return Number((ms / 1000).toFixed(2));
}
