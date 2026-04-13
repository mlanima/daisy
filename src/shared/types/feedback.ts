export type StatusTone = "idle" | "success" | "error";

export interface UiStatus {
    tone: StatusTone;
    message: string;
}
