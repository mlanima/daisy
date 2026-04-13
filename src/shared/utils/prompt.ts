/**
 * Injects source text into a template while supporting the `{text}` placeholder.
 * @param template Prompt template that may include a `{text}` placeholder.
 * @param text Source text captured from the user context.
 * @returns Final prompt string sent to the model.
 */
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
