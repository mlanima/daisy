import { create } from "zustand";
import type { useAppController } from "./useAppController";

export type AppControllerValue = ReturnType<typeof useAppController>;

interface AppControllerStoreState {
    controller: AppControllerValue | null;
    setController: (controller: AppControllerValue) => void;
}

export const useAppControllerStore = create<AppControllerStoreState>((set) => ({
    controller: null,
    setController: (controller) => {
        set({ controller });
    },
}));
