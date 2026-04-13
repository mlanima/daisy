export interface ModelConfig {
    model: string;
    temperature: number;
    maxTokens: number | null;
}

export type WindowSize = "small" | "medium" | "big";

export interface Agent {
    id: string;
    name: string;
    description: string;
    systemPrompt: string;
}

export interface AppSettings {
    autoSendPrompt: boolean;
    darkMode: boolean;
    apiBaseUrl: string;
    windowSize: WindowSize;
    recentAgentIds: string[];
    model: ModelConfig;
}

export interface AppStateSnapshot {
    agents: Agent[];
    selectedAgentId: string | null;
    settings: AppSettings;
    apiKey?: string;
}

export interface ClipboardCapturedEvent {
    text: string;
    capturedAtEpochMs: number;
}

export interface TokenUsage {
    promptTokens: number | null;
    completionTokens: number | null;
    totalTokens: number | null;
}

export interface AiRunResponse {
    outputText: string;
    promptUsed: string;
    model: string;
    requestId: string | null;
    usage: TokenUsage | null;
}

export interface RunAgentRequest {
    agentId: string;
    sourceText: string;
    promptOverride: string | null;
}
