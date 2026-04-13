pub fn build_prompt(template: &str, source_text: &str) -> String {
    let normalized_text = source_text.trim();
    let normalized_template = template.trim();

    if normalized_template.is_empty() {
        return normalized_text.to_string();
    }

    if normalized_template.contains("{text}") {
        return normalized_template.replace("{text}", normalized_text);
    }

    if normalized_text.is_empty() {
        return normalized_template.to_string();
    }

    format!("{}\n\n{}", normalized_template, normalized_text)
}

pub fn normalized_system_prompt(template: &str) -> Option<String> {
    let normalized = template.replace("{text}", "");
    let normalized = normalized.trim();

    if normalized.is_empty() {
        None
    } else {
        Some(normalized.to_string())
    }
}
