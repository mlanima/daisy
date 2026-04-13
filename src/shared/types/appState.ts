import type { z } from "zod";
import {
    agentSchema,
    aiRunResponseSchema,
    appSettingsSchema,
    appStateSnapshotSchema,
    clipboardCapturedEventSchema,
    modelConfigSchema,
    runAgentRequestSchema,
    tokenUsageSchema,
    windowSizeSchema,
} from "../schemas/appStateSchema";

export type ModelConfig = z.infer<typeof modelConfigSchema>;

export type WindowSize = z.infer<typeof windowSizeSchema>;

export type Agent = z.infer<typeof agentSchema>;

export type AppSettings = z.infer<typeof appSettingsSchema>;

export type AppStateSnapshot = z.infer<typeof appStateSnapshotSchema>;

export type ClipboardCapturedEvent = z.infer<
    typeof clipboardCapturedEventSchema
>;

export type TokenUsage = z.infer<typeof tokenUsageSchema>;

export type AiRunResponse = z.infer<typeof aiRunResponseSchema>;

export type RunAgentRequest = z.infer<typeof runAgentRequestSchema>;
