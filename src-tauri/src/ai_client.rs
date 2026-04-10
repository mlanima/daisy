use crate::models::{AiRunResponse, ModelConfig, TokenUsage};
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};
use std::time::Duration;

#[derive(Debug, Serialize)]
struct ChatRequest<'a> {
    model: &'a str,
    messages: Vec<ChatMessage<'a>>,
    temperature: f32,
    #[serde(skip_serializing_if = "Option::is_none")]
    max_tokens: Option<u32>,
}

#[derive(Debug, Serialize)]
struct ChatMessage<'a> {
    role: &'a str,
    content: &'a str,
}

#[derive(Debug, Deserialize)]
struct ChatCompletionResponse {
    id: Option<String>,
    model: Option<String>,
    choices: Vec<Choice>,
    usage: Option<Usage>,
}

#[derive(Debug, Deserialize)]
struct Choice {
    message: ChoiceMessage,
}

#[derive(Debug, Deserialize)]
struct ChoiceMessage {
    content: String,
}

#[derive(Debug, Deserialize)]
struct Usage {
    prompt_tokens: Option<u32>,
    completion_tokens: Option<u32>,
    total_tokens: Option<u32>,
}

pub async fn run_chat_completion(
    api_key: &str,
    endpoint: &str,
    model_config: &ModelConfig,
    system_prompt: Option<&str>,
    user_prompt: &str,
) -> Result<AiRunResponse, String> {
    let http_client = reqwest::Client::builder()
        .timeout(Duration::from_secs(45))
        .build()
        .map_err(|error| format!("Failed to build HTTP client: {error}"))?;

    let mut messages = Vec::with_capacity(2);
    if let Some(system_prompt) = system_prompt {
        if !system_prompt.trim().is_empty() {
            messages.push(ChatMessage {
                role: "system",
                content: system_prompt,
            });
        }
    }

    messages.push(ChatMessage {
        role: "user",
        content: user_prompt,
    });

    let request_payload = ChatRequest {
        model: &model_config.model,
        messages,
        temperature: model_config.temperature,
        max_tokens: model_config.max_tokens,
    };

    let response = http_client
        .post(endpoint)
        .bearer_auth(api_key)
        .json(&request_payload)
        .send()
        .await
        .map_err(|error| {
            format!(
                "Failed to call AI API.\nendpoint: {}\nmodel: {}\ntransportError: {}",
                endpoint, model_config.model, error
            )
        })?;

    let status = response.status();
    let request_id_header = response
        .headers()
        .get("x-request-id")
        .and_then(|value| value.to_str().ok())
        .map(str::to_string);
    let response_text = response
        .text()
        .await
        .map_err(|error| {
            format!(
                "Failed to read AI API response.\nendpoint: {}\nmodel: {}\nreadError: {}",
                endpoint, model_config.model, error
            )
        })?;

    if !status.is_success() {
        return Err(build_http_error(
            status,
            endpoint,
            &model_config.model,
            request_id_header.as_deref(),
            &response_text,
        ));
    }

    let parsed: ChatCompletionResponse = serde_json::from_str(&response_text)
        .map_err(|error| {
            format!(
                "Failed to parse AI API response.\nendpoint: {}\nmodel: {}\nparseError: {}\nresponseBody: {}",
                endpoint,
                model_config.model,
                error,
                summarize_response_body(&response_text),
            )
        })?;

    let output_text = parsed
        .choices
        .first()
        .map(|choice| choice.message.content.trim().to_string())
        .unwrap_or_default();

    if output_text.is_empty() {
        return Err(format!(
            "AI API returned an empty response.\nendpoint: {}\nmodel: {}\nresponseBody: {}",
            endpoint,
            model_config.model,
            summarize_response_body(&response_text),
        ));
    }

    Ok(AiRunResponse {
        output_text,
        prompt_used: user_prompt.to_string(),
        model: parsed.model.unwrap_or_else(|| model_config.model.clone()),
        request_id: parsed.id,
        usage: parsed.usage.map(|usage| TokenUsage {
            prompt_tokens: usage.prompt_tokens,
            completion_tokens: usage.completion_tokens,
            total_tokens: usage.total_tokens,
        }),
    })
}

fn build_http_error(
    status: StatusCode,
    endpoint: &str,
    model: &str,
    request_id: Option<&str>,
    response_text: &str,
) -> String {
    let trimmed = response_text.trim();
    let request_id_line = match request_id {
        Some(value) if !value.is_empty() => value,
        _ => "<missing>",
    };

    if trimmed.is_empty() {
        return format!(
            "AI API error.\nstatus: HTTP {}\nendpoint: {}\nmodel: {}\nrequestId: {}\nresponseBody: <empty>",
            status.as_u16(),
            endpoint,
            model,
            request_id_line,
        );
    }

    format!(
        "AI API error.\nstatus: HTTP {}\nendpoint: {}\nmodel: {}\nrequestId: {}\nresponseBody: {}",
        status.as_u16(),
        endpoint,
        model,
        request_id_line,
        summarize_response_body(trimmed),
    )
}

fn summarize_response_body(text: &str) -> String {
    const MAX_CHARS: usize = 2500;

    let trimmed = text.trim();
    let body: String = trimmed.chars().take(MAX_CHARS).collect();

    if trimmed.chars().count() > MAX_CHARS {
        return format!(
            "{}... <truncated {} chars>",
            body,
            trimmed.chars().count() - MAX_CHARS
        );
    }

    body
}
