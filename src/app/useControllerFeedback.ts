import { useCallback, useState } from "react";
import type { StatusTone, UiStatus } from "../shared/types/feedback";
import type { ErrorPresenter } from "./controllerUtils";

export function useControllerFeedback(errorPresenter: ErrorPresenter) {
    const [status, setStatus] = useState<UiStatus>({
        tone: "idle",
        message: "",
    });
    const [lastErrorDetails, setLastErrorDetails] = useState("");

    const setStatusMessage = useCallback(
        (tone: StatusTone, message: string) => {
            setStatus({ tone, message });
        },
        [],
    );

    const clearErrorDetails = useCallback(() => {
        setLastErrorDetails("");
    }, []);

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
