import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { useAppController } from "./useAppController";

type AppControllerValue = ReturnType<typeof useAppController>;

const AppControllerContext = createContext<AppControllerValue | null>(null);

interface AppControllerProviderProps {
    children: ReactNode;
}

export function AppControllerProvider({
    children,
}: Readonly<AppControllerProviderProps>) {
    const controller = useAppController();

    return (
        <AppControllerContext.Provider value={controller}>
            {children}
        </AppControllerContext.Provider>
    );
}

export function useAppControllerContext(): AppControllerValue {
    const context = useContext(AppControllerContext);

    if (!context) {
        throw new Error(
            "useAppControllerContext must be used within AppControllerProvider",
        );
    }

    return context;
}
