import { Button, Card } from "../../../shared/components";

interface ApiCredentialsCardProps {
    keyPreview: string;
    isSavingKey: boolean;
    onOpenKeyModal: () => void;
    onClearKey: () => void;
}

/** Displays the API key preview and credential management actions. */
export function ApiCredentialsCard({
    keyPreview,
    isSavingKey,
    onOpenKeyModal,
    onClearKey,
}: Readonly<ApiCredentialsCardProps>) {
    return (
        <Card className="flex flex-col gap-4">
            <div>
                <h3 className="text-base font-semibold">API Credentials</h3>
                <p className="text-xs text-muted-foreground">
                    Your key is stored securely and used for requests.
                </p>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-border/75 bg-card/70 px-3 py-2.5">
                <span className="font-mono text-sm text-muted-foreground min-w-0">
                    {keyPreview === "<loading>" ? "Loading..." : keyPreview}
                </span>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Button variant="primary" onClick={onOpenKeyModal}>
                        Set Secret Key
                    </Button>
                    {keyPreview !== "<not found>" &&
                    keyPreview !== "<loading>" ? (
                        <Button
                            variant="ghost"
                            danger
                            disabled={isSavingKey}
                            onClick={onClearKey}
                        >
                            Clear Key
                        </Button>
                    ) : null}
                </div>
            </div>
        </Card>
    );
}
