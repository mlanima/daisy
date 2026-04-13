import { z } from "zod";

export const windowSizeSchema = z.enum(["small", "medium", "big"]);

export const modelConfigSchema = z.object({
    model: z.string(),
    temperature: z.number(),
    maxTokens: z.number().nullable(),
});

export const agentSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    systemPrompt: z.string(),
});

export const appSettingsSchema = z.object({
    autoSendPrompt: z.boolean(),
    darkMode: z.boolean(),
    apiBaseUrl: z.string(),
    windowSize: windowSizeSchema,
    recentAgentIds: z.array(z.string()),
    model: modelConfigSchema,
});

export const appStateSnapshotSchema = z.object({
    agents: z.array(agentSchema),
    selectedAgentId: z.string().nullable(),
    settings: appSettingsSchema,
    apiKey: z.string().optional(),
});

export const clipboardCapturedEventSchema = z.object({
    text: z.string(),
    capturedAtEpochMs: z.number(),
});

export const tokenUsageSchema = z.object({
    promptTokens: z.number().nullable(),
    completionTokens: z.number().nullable(),
    totalTokens: z.number().nullable(),
});

export const aiRunResponseSchema = z.object({
    outputText: z.string(),
    promptUsed: z.string(),
    model: z.string(),
    requestId: z.string().nullable(),
    usage: tokenUsageSchema.nullable(),
});

export const runAgentRequestSchema = z.object({
    agentId: z.string().min(1),
    sourceText: z.string(),
    promptOverride: z.string().nullable(),
});

export const quickWindowResizeResultSchema = z.object({
    width: z.number(),
    height: z.number(),
    isHeightClamped: z.boolean(),
});

export const apiKeySchema = z.string().trim().min(1, "API key is required.");

export const aiStreamChunkSchema = z.string();
