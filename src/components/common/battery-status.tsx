export default function BatteryStatus({
    percentage,
    forceColor,
}: {
    percentage: number;
    forceColor: string | null;
}) {
    let filledBars = Math.floor((percentage / 100) * 4);
    let colorMap = [
        "bg-red-600",
        "bg-yellow-500",
        "bg-green-400",
        "bg-green-600",
    ];
    return (
        <div className="flex space-x-0.5 justify-center items-center h-full">
            {/* <div className="w-1 h-3.5 bg-green-600 rounded-sm"></div>
            <div className="w-1 h-3.5 bg-green-600 rounded-sm"></div>
            <div className="w-1 h-3.5 bg-green-600 rounded-sm"></div>
            <div className="w-1 h-3.5 bg-green-600 rounded-sm"></div> */}
            {[0, 1, 2, 3].map((idx) => (
                <div
                    key={idx}
                    className={`w-1 h-3.5 rounded-sm ${
                        idx < filledBars
                            ? forceColor || colorMap[filledBars - 1]
                            : "bg-gray-300"
                    }`}
                ></div>
            ))}
        </div>
    );
}
