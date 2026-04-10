export function buildPromptFromTemplate(
    template: string,
    text: string,
): string {
    const normalizedText = text.trim();
    const normalizedTemplate = template.trim();

    if (!normalizedTemplate) {
        return normalizedText;
    }

    if (normalizedTemplate.includes("{text}")) {
        return normalizedTemplate.split("{text}").join(normalizedText);
    }

    if (!normalizedText) {
        return normalizedTemplate;
    }

    return `${normalizedTemplate}\n\n${normalizedText}`;
}
