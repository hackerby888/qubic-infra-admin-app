import useGeneralPost from "@/networking/api";
import { useState } from "react";
import { toast } from "sonner";

export default function ServerNoteTyper({
    server,
    currentNote,
}: {
    server: string;
    currentNote: string;
}) {
    let [note, setNote] = useState(currentNote);
    let { mutate: updateServerNote } = useGeneralPost({
        queryKey: ["updateServerNote", server],
        method: "POST",
        path: "/update-server-note",
    });
    const onBlur = async () => {
        if (note === currentNote) return; // No change, skip API call

        updateServerNote({ server, note } as any, {
            onSuccess: () => {
                toast.success(`Note updated for ${server}`);
            },
            onError: (err) => {
                toast.error(
                    "Failed to update note " +
                        (err instanceof Error ? err.message : "")
                );
                setNote(currentNote); // Revert to old note on error
            },
        });
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.currentTarget.blur(); // Trigger onBlur to save note
        }
    };

    return (
        <input
            onClick={(e) => e.stopPropagation()}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Tap to add note"
            className="text-[0.8rem] text-gray-700 bg-gray-100 rounded mt-2 p-1 cursor-pointer placeholder:italic placeholder:text-[0.7rem]"
        />
    );
}
