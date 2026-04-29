import type { Agent, WindowSize } from "../../shared/types/appState";

export interface AssistantPageProps {
    agents: Agent[];
    selectedAgentId: string | null;
    promptText: string;
    responseText: string;
    isSending: boolean;
    apiKeyPresent: boolean;
    errorDetails: string;
    onSelectAgent: (agentId: string) => void;
    onPromptChange: (value: string) => void;
    onSend: () => void;
    onUpdateAgents: (agents: Agent[], selectedAgentId: string | null) => void;
    onClearErrorDetails: () => void;
}

export interface QuickAssistantPageProps {
    agents: Agent[];
    selectedAgentId: string | null;
    recentAgentIds: string[];
    promptText: string;
    responseText: string;
    isSending: boolean;
    apiKeyPresent: boolean;
    windowSize: WindowSize;
    onSelectAgent: (agentId: string) => void;
    onPromptChange: (value: string) => void;
    onRefreshCapture: () => Promise<void>;
    onSend: () => void;
    onOpenFullApp: () => void;
}
