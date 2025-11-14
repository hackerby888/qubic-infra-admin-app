import { useState } from "react";
import { Button } from "../ui/button";
import copy from "copy-to-clipboard";
import { toast } from "sonner";

export default function LocalTerminal({
    text,
    allowCopy,
}: {
    text: string;
    allowCopy?: boolean;
}) {
    let [isCopied, setIsCopied] = useState(false);

    const handleCopy = (text: string) => {
        copy(text);
        setIsCopied(true);
        toast.success("Terminal content copied to clipboard!");
    };

    return (
        <div className="w-full bg-gray-100 p-4 text-sm rounded h-96 overflow-x-auto relative">
            <Button
                onClick={() => handleCopy(text)}
                variant={"outline"}
                className={`absolute top-2 right-2 cursor-pointer ${
                    !allowCopy && "hidden"
                }`}
            >
                {isCopied ? "Copied!" : "Copy to clipboard"}
            </Button>
            <div className="wrap-anywhere">
                <pre className="whitespace-pre-wrap text-sm font-sans">
                    {text}
                </pre>
            </div>
        </div>
    );
}
