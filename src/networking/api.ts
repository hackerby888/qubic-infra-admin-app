import { API_SERVER } from "@/consts/api-server";
import { useMutation, useQuery } from "@tanstack/react-query";
import { MyStorage } from "@/utils/storage";
import { useNavigate } from "react-router";

export async function handleApiResponse(
    res: Response,
    navigate?: (path: string) => void
) {
    let json = await res.json();

    if (res.status !== 200) {
        if (res.status === 401) {
            if (navigate) {
                MyStorage.setLoginCredential("");
                navigate("/login");
            }
        }
        throw new Error(json.error);
    }

    return json;
}

export function useGeneralGet<T>({
    queryKey,
    path,
    enabled = true,
    reqQuery,
    refetchInterval,
}: {
    queryKey: any[];
    path: string;
    enabled?: boolean;
    reqQuery?: {
        [key: string]: any;
    };
    refetchInterval?: number;
}) {
    let navigate = useNavigate();
    return useQuery<T>({
        queryKey,
        queryFn: async () => {
            let reqQueryString = "";
            if (reqQuery) {
                reqQueryString = Object.keys(reqQuery)
                    .map((key) => `${key}=${reqQuery[key]}`)
                    .join("&");
            } else {
                reqQueryString = "_=blank";
            }
            let res = await fetch(`${API_SERVER}${path}?${reqQueryString}`, {
                headers: {
                    Authorization: "Bearer " + MyStorage.getLoginCredential(),
                },
            });
            return handleApiResponse(res, navigate);
        },
        enabled,
        refetchInterval,
    });
}

export default function useGeneralPost({
    queryKey,
    path,
    reqQuery,
    method = "POST",
}: {
    queryKey: any[];
    path: string;
    reqQuery?: {
        [key: string]: any;
    };
    method?: "POST" | "PUT" | "DELETE";
}) {
    return useMutation({
        mutationKey: queryKey,
        mutationFn: async (data) => {
            let reqQueryString = "";
            if (reqQuery) {
                reqQueryString = Object.keys(reqQuery)
                    .map((key) => `${key}=${reqQuery[key]}`)
                    .join("&");
            } else {
                reqQueryString = "_=blank";
            }
            let res = await fetch(`${API_SERVER}${path}?${reqQueryString}`, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + MyStorage.getLoginCredential(),
                },
                body: JSON.stringify(data),
            });

            return handleApiResponse(res);
        },
    });
}
