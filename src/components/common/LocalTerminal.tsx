export default function LocalTerminal({ text }: { text: string }) {
    return (
        <div className="w-full bg-gray-100 p-4 text-sm rounded h-96 overflow-x-scroll">
            <div className="overflow-auto whitespace-pre-line">{text}</div>
        </div>
    );
}
