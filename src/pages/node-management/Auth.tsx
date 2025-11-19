import { Button } from "@/components/ui/button";
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSet,
} from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import useGeneralPost, { useGeneralGet } from "@/networking/api";
import type { User } from "@/types/type";
import { useEffect, useState } from "react";
import { toast } from "sonner";
export default function Auth() {
    let {
        data: myInfo,
        error: getMyInfoError,
        isLoading: isGetMyInfoLoading,
    } = useGeneralGet<{ user: User }>({
        queryKey: ["my-info"],
        path: "/my-info",
    });

    let { mutate: setSSHPrivateKey, isPending: isSettingPrivateKey } =
        useGeneralPost({
            queryKey: ["set-ssh-private-key"],
            path: "/set-ssh-key",
        });

    let [sshPrivateKey, setSshPrivateKey] = useState("");

    useEffect(() => {
        if (myInfo?.user.currentsshPrivateKey) {
            setSshPrivateKey(myInfo.user.currentsshPrivateKey);
        }
    }, [myInfo]);

    const handleSubmit = () => {
        if (!sshPrivateKey) {
            toast.error("SSH Private Key cannot be empty.");
            return;
        }
        setSSHPrivateKey({ sshPrivateKey: sshPrivateKey.trim() } as any, {
            onSuccess: () => {
                toast.success("SSH Private Key saved successfully.");
            },
            onError: (error) => {
                toast.error("Failed to save SSH Private Key: " + error.message);
            },
        });
    };

    return (
        <div className="p-4">
            <h3 className="text-2xl font-bold mb-4">Authentication</h3>
            <div className="w-full flex justify-center">
                <div className="w-full max-w-md">
                    <FieldGroup>
                        <FieldSet>
                            <FieldLegend>Authentication</FieldLegend>
                            <FieldDescription>
                                Provide your SSH credentials to connect to your
                                server.
                            </FieldDescription>
                        </FieldSet>
                        <Field>
                            <FieldLabel htmlFor="checkout-7j9-card-name-43j">
                                SSH Private Key
                            </FieldLabel>
                            <FieldDescription>
                                To genrate private key, use ssh-keygen command
                            </FieldDescription>
                            {!isGetMyInfoLoading ? (
                                <Textarea
                                    onChange={(e) =>
                                        setSshPrivateKey(e.target.value)
                                    }
                                    value={sshPrivateKey}
                                    placeholder={`-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACDVhUiLJAnnVOx/6l8Pxp00ef9nPFuQl4nGluy4t5BXLwAAAJC7mAnyu5gJ
8gAAAAtzc2gtZWQcNTUxOQAAACDVhUcLJAnnVOx/6l8Pxp00ef9nPFuQl4nGluy4t5BXLw
AAAECGg2FOENZjU33HbSdr71fLtLfBAJQoHu/cgYA3X+wsS9WFSIskCedU7H/qXw/GnTR5
/2c8W5CXicaW7Li3kFcvAAAACWthbGlAa2FsaQECAwQ=
-----END OPENSSH PRIVATE KEY-----
`}
                                    required
                                />
                            ) : (
                                <Skeleton className="h-60 w-full rounded-sm" />
                            )}
                        </Field>
                        {!isGetMyInfoLoading ? (
                            !isSettingPrivateKey ? (
                                <Button
                                    onClick={() => handleSubmit()}
                                    className="cursor-pointer mt-4"
                                >
                                    Save Credentials
                                </Button>
                            ) : (
                                <Button className="mt-4" disabled>
                                    Saving...
                                </Button>
                            )
                        ) : (
                            <Skeleton className="w-full h-10 rounded-sm"></Skeleton>
                        )}
                        {getMyInfoError && (
                            <p className="text-red-500 mt-2">
                                Error loading user info:{" "}
                                {getMyInfoError.message}
                            </p>
                        )}
                    </FieldGroup>
                </div>
            </div>
        </div>
    );
}
