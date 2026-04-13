import { useCallback, useState } from "react";
import type { StatusTone, UiStatus } from "../shared/types/feedback";
import type { ErrorPresenter } from "./controllerUtils";

/**
 * Manages UI feedback state in one place so feature flows can report
 * success/error information without duplicating message formatting.
 */
export function useControllerFeedback(errorPresenter: ErrorPresenter) {
    const [status, setStatus] = useState<UiStatus>({
        tone: "idle",
        message: "",
    });
    const [lastErrorDetails, setLastErrorDetails] = useState("");

    /** Sets current status banner tone and message. */
    const setStatusMessage = useCallback(
        (tone: StatusTone, message: string) => {
            setStatus({ tone, message });
        },
        [],
    );

    /** Clears expanded error-details panel content. */
    const clearErrorDetails = useCallback(() => {
        setLastErrorDetails("");
    }, []);

    /** Formats unknown errors and stores message + details in UI state. */
    const setErrorState = useCallback(
        (error: unknown, prefix?: string) => {
            const message = errorPresenter.getMessage(error);
            setStatusMessage(
                "error",
                prefix ? `${prefix}: ${message}` : message,
            );
            setLastErrorDetails(errorPresenter.getDetails(error));
        },
        [errorPresenter, setStatusMessage],
    );

    return {
        status,
        lastErrorDetails,
        setStatusMessage,
        clearErrorDetails,
        setErrorState,
    };
}
