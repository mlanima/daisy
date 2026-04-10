use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelConfig {
    pub model: String,
    pub temperature: f32,
    pub max_tokens: Option<u32>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum WindowSize {
    Small,
    Medium,
    Big,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Agent {
    pub id: String,
    pub name: String,
    pub description: String,
    #[serde(alias = "promptTemplate")]
    pub system_prompt: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub auto_send_prompt: bool,
    pub dark_mode: bool,
    pub api_base_url: String,
    #[serde(default)]
    pub window_size: WindowSize,
    #[serde(default)]
    pub recent_agent_ids: Vec<String>,
    #[serde(default)]
    pub model: ModelConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppStateSnapshot {
    pub agents: Vec<Agent>,
    pub selected_agent_id: Option<String>,
    pub settings: AppSettings,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub api_key: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TokenUsage {
    pub prompt_tokens: Option<u32>,
    pub completion_tokens: Option<u32>,
    pub total_tokens: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiRunResponse {
    pub output_text: String,
    pub prompt_used: String,
    pub model: String,
    pub request_id: Option<String>,
    pub usage: Option<TokenUsage>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RunAgentRequest {
    pub agent_id: String,
    pub source_text: String,
    pub prompt_override: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClipboardCapturedEvent {
    pub text: String,
    pub captured_at_epoch_ms: u64,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            auto_send_prompt: false,
            dark_mode: true,
            api_base_url: "https://api.openai.com/v1/chat/completions".to_string(),
            window_size: WindowSize::Medium,
            recent_agent_ids: Vec::new(),
            model: ModelConfig::default(),
        }
    }
}

impl Default for ModelConfig {
    fn default() -> Self {
        Self {
            model: "gpt-4o-mini".to_string(),
            temperature: 0.2,
            max_tokens: Some(800),
        }
    }
}

impl Default for WindowSize {
    fn default() -> Self {
        Self::Medium
    }
}

impl Default for AppStateSnapshot {
    fn default() -> Self {
        let agents = vec![
            Agent {
                id: "translate-ua".to_string(),
                name: "Translate".to_string(),
                description: "Translate any text to Ukrainian".to_string(),
                system_prompt:
                    "Translate the user's text to Ukrainian. Keep names and formatting intact."
                        .to_string(),
            },
            Agent {
                id: "grammar-de".to_string(),
                name: "Grammar".to_string(),
                description: "Correct German grammar and explain edits".to_string(),
                system_prompt:
                    "Correct grammar mistakes in German text and briefly explain each correction."
                        .to_string(),
            },
            Agent {
                id: "explain".to_string(),
                name: "Explain".to_string(),
                description: "Explain text for a language learner".to_string(),
                system_prompt:
                    "Explain the user's text for a language learner using simple wording and examples."
                        .to_string(),
            },
        ];

        Self {
            selected_agent_id: Some(agents[0].id.clone()),
            agents,
            settings: AppSettings::default(),
            api_key: None,
        }
    }
}
