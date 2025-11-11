import { useEffect, useState } from "react";

export default function FlashText({
    value,
    noFlash,
}: {
    value: string;
    noFlash?: boolean;
}) {
    const [highlight, setHighlight] = useState(false);

    useEffect(() => {
        setHighlight(true);
        const timeout = setTimeout(() => setHighlight(false), 1000); // 1s flash
        return () => clearTimeout(timeout);
    }, [value]);

    if (noFlash) {
        return <span>{value}</span>;
    }

    return (
        <span
            className={`transition-colors duration-500 ${
                highlight ? "text-green-500" : "text-black"
            }`}
        >
            {value}
        </span>
    );
}
