export function calculateTimeDiffInSeconds(timestamp: number): number {
    const now = Date.now();
    const diffInMs = now - timestamp;
    return Math.floor(diffInMs / 1000);
}

export function badgeOperatorColor(operator: string) {
    let bgMap = {
        "core-tech": "bg-red-400 text-white",
        unknown: "",
    };

    return bgMap[operator as keyof typeof bgMap];
}
