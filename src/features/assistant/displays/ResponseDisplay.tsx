import { Card } from "../../../shared/components";

interface ResponseDisplayProps {
    content: string;
    isLoading?: boolean;
}

/** Display area for assistant response output. */
export function ResponseDisplay({
    content,
    isLoading = false,
}: Readonly<ResponseDisplayProps>) {
    const hasContent = content.trim().length > 0;
    const charCount = content.trim().length;

    return (
        <Card className="min-h-0 flex-1 gap-3 p-4">
            <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Response
                </h3>
                {hasContent && (
                    <span className="text-xs text-muted-foreground">
                        {charCount} chars
                    </span>
                )}
            </div>

            {hasContent ? (
                <pre className="custom-scrollbar m-0 h-full min-h-0 overflow-auto overscroll-contain rounded-xl border border-border/70 bg-background/65 p-3.5 text-sm leading-relaxed text-foreground whitespace-pre-wrap wrap-break-word">
                    {content}
                </pre>
            ) : (
                <div className="grid h-full min-h-0 place-content-center rounded-xl border border-dashed border-border/70 bg-background/45 p-4 text-center text-sm text-muted-foreground">
                    {isLoading
                        ? "Generating response..."
                        : "Send a prompt to see the response here."}
                </div>
            )}
        </Card>
    );
}
