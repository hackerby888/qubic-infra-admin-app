import { ChevronUp, type LucideIcon } from "lucide-react";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useLocation, useNavigate } from "react-router";

function isPathActive(currentPath: string, targetPaths: string) {
    let targetPathsArray = targetPaths.split("/").filter((path) => path !== "");
    let currentPathNormalized = currentPath.replaceAll("/", "");
    return targetPathsArray.includes(currentPathNormalized);
}

export default function DynamicNavigatorMenu({
    title,
    items,
    icon: Icon,
    rootPath,
}: {
    title: string;
    items: { label: string; path: string }[];
    icon: LucideIcon;
    rootPath: string;
}) {
    let navigate = useNavigate();
    let location = useLocation();
    let paths = location.pathname.split("/").filter((path) => path !== "");
    let isMatchRoot = isPathActive(rootPath, location.pathname);
    return (
        <Collapsible className="w-full">
            <CollapsibleTrigger className="w-full">
                <div
                    className={`${
                        isMatchRoot
                            ? "bg-blue-400 text-white hover:bg-blue-500"
                            : "hover:bg-gray-100"
                    } p-2 rounded-sm cursor-pointer flex w-full`}
                >
                    <Icon size={20} className="mr-2" />
                    <span className="flex-1 text-left">{title}</span>
                    <ChevronUp
                        className={`${isMatchRoot ? "white" : "text-gray-500"}`}
                        size={20}
                    />
                </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <ul className="text-sm pl-3 pt-2">
                    {items.map((item) => (
                        <li
                            onClick={() => navigate(rootPath + item.path)}
                            key={item.path}
                            className={`${
                                isPathActive(item.path, location.pathname) &&
                                isMatchRoot
                                    ? "border-l-gray-700"
                                    : "border-l-gray-300"
                            } border-l-2 pl-2 py-2 hover:bg-gray-100 cursor-pointer flex`}
                        >
                            {item.label}
                        </li>
                    ))}
                </ul>
            </CollapsibleContent>
        </Collapsible>
    );
}
