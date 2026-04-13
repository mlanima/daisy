import { create } from "zustand";
import type { useAppController } from "./useAppController";

/** Public shape returned by the app controller hook. */
export type AppControllerValue = ReturnType<typeof useAppController>;

interface AppControllerStoreState {
    controller: AppControllerValue | null;
    setController: (controller: AppControllerValue) => void;
}

/** Global container for the current app controller instance. */
export const useAppControllerStore = create<AppControllerStoreState>((set) => ({
    controller: null,
    setController: (controller) => {
        set({ controller });
    },
}));
