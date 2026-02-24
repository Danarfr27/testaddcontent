// fungsi utilitas

export function detectCodeBlocks(text) {
    let result = [];
    let remainingText = text;
    const codeBlockPattern = /```([a-zA-Z0-9_]+)?\s*([\s\S]*?)```/g;
    let match;
    let lastIndex = 0;

    while ((match = codeBlockPattern.exec(text)) !== null) {
        if (match.index > lastIndex) {
            result.push({
                type: 'text',
                content: text.substring(lastIndex, match.index)
            });
        }
        const language = match[1] || 'text';
        const codeContent = match[2].trim();

        result.push({
            type: 'code',
            language: language,
            content: codeContent
        });
        lastIndex = codeBlockPattern.lastIndex;
    }

    if (lastIndex < text.length) {
        result.push({
            type: 'text',
            content: text.substring(lastIndex)
        });
    }

    return result.length > 0 ? result : [{ type: 'text', content: text }];
}

export function copyToClipboard(text, message) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        // We might need a way to show notification from here, or return success
        return successful;
    } catch (err) {
        console.error('Failed to copy: ', err);
        return false;
    } finally {
        document.body.removeChild(textArea);
    }
}

export function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
