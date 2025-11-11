import { Button } from "@/components/ui/button";
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSeparator,
    FieldSet,
    FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
export default function Auth() {
    return (
        <div className="p-4">
            <h3 className="text-2xl font-bold mb-4">Authentication</h3>
            <div className="w-full flex justify-center">
                <form className="w-full max-w-md">
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
                            <Textarea
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
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="checkout-7j9-card-name-43j">
                                Encryption Passphrase
                            </FieldLabel>
                            <FieldDescription>
                                We store your ssh key securely by encrypting it
                                with this passphrase and only exposed when used
                                to connect to your server.
                            </FieldDescription>
                            <Input
                                placeholder="Encryption Passphrase"
                                required
                            />
                        </Field>
                        <Button className="cursor-pointer mt-4">
                            Save Credentials
                        </Button>
                    </FieldGroup>
                </form>
            </div>
        </div>
    );
}
