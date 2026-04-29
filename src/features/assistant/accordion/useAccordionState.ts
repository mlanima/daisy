import { useCallback, useState } from "react";

/** Hook to manage accordion open/closed state. */
export function useAccordionState() {
    const [openId, setOpenId] = useState<string | null>(null);

    const toggle = useCallback((id: string) => {
        setOpenId((current) => (current === id ? null : id));
    }, []);

    const isOpen = useCallback((id: string) => openId === id, [openId]);

    return { openId, toggle, isOpen };
}
