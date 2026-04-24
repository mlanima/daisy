import type {
    Agent,
    AppStateSnapshot,
    ClipboardCapturedEvent,
    RunAgentRequest,
} from "../../shared/types/appState";
import { resolveSelectedAgent } from "./agentUtils";
import {
    fetchQuickCaptureData,
    streamAgentResponse,
    subscribeClipboardCaptured,
    type QuickCaptureData,
} from "./assistantService";
import { persistWorkspaceSnapshot } from "../../app/services/workspaceService";

export interface AssistantFlowDependencies {
    fetchQuickCaptureData: () => Promise<QuickCaptureData>;
    streamAgentResponse: (
        request: RunAgentRequest,
        onChunk: (chunk: string) => void,
    ) => Promise<void>;
    subscribeClipboardCaptured: (
        handler: (payload: ClipboardCapturedEvent) => void,
    ) => Promise<() => void>;
    resolveSelectedAgent: (snapshot: AppStateSnapshot | null) => Agent | null;
    persistSnapshot: (snapshot: AppStateSnapshot) => Promise<AppStateSnapshot>;
}

export const defaultAssistantFlowDependencies: AssistantFlowDependencies = {
    fetchQuickCaptureData,
    streamAgentResponse,
    subscribeClipboardCaptured,
    resolveSelectedAgent,
    persistSnapshot: persistWorkspaceSnapshot,
};
