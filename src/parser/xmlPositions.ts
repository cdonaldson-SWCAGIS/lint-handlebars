export interface XmlElement {
    tagName: string;
    startOffset: number;
    endOffset: number;
    selfClosing: boolean;
}

/**
 * Find all instances of opening/self-closing XML elements with a given tag name.
 * Returns start/end offsets for each element.
 */
export function findXmlElements(text: string, tagName: string): XmlElement[] {
    const elements: XmlElement[] = [];
    // Match opening tags: <tagName ...> or <tagName .../>
    const openRegex = new RegExp(`<${escapeRegex(tagName)}(\\s[^>]*)?\\/?>`, 'g');
    let match: RegExpExecArray | null;

    while ((match = openRegex.exec(text)) !== null) {
        const selfClosing = match[0].endsWith('/>');

        if (selfClosing) {
            elements.push({
                tagName,
                startOffset: match.index,
                endOffset: match.index + match[0].length,
                selfClosing: true,
            });
        } else {
            // Find the matching closing tag
            const closeTag = `</${tagName}>`;
            const closeIdx = findMatchingClose(text, match.index + match[0].length, tagName);
            if (closeIdx >= 0) {
                elements.push({
                    tagName,
                    startOffset: match.index,
                    endOffset: closeIdx + closeTag.length,
                    selfClosing: false,
                });
            }
        }
    }

    return elements;
}

/**
 * Find the matching closing tag, handling nested same-name tags.
 */
function findMatchingClose(text: string, startFrom: number, tagName: string): number {
    const openPattern = new RegExp(`<${escapeRegex(tagName)}(\\s[^>]*)?>`, 'g');
    const closePattern = new RegExp(`</${escapeRegex(tagName)}>`, 'g');

    let depth = 1;
    let searchPos = startFrom;

    while (depth > 0 && searchPos < text.length) {
        openPattern.lastIndex = searchPos;
        closePattern.lastIndex = searchPos;

        const nextOpen = openPattern.exec(text);
        const nextClose = closePattern.exec(text);

        if (!nextClose) return -1;

        if (nextOpen && nextOpen.index < nextClose.index && !nextOpen[0].endsWith('/>')) {
            depth++;
            searchPos = nextOpen.index + nextOpen[0].length;
        } else {
            depth--;
            if (depth === 0) return nextClose.index;
            searchPos = nextClose.index + nextClose[0].length;
        }
    }

    return -1;
}

/**
 * Find which element contains a given offset.
 */
export function getContainingElement(offset: number, elements: XmlElement[]): XmlElement | null {
    for (const el of elements) {
        if (offset >= el.startOffset && offset < el.endOffset) {
            return el;
        }
    }
    return null;
}

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get the character offset for a line/column position.
 */
export function positionToOffset(text: string, line: number, column: number): number {
    let currentLine = 0;
    let offset = 0;

    while (currentLine < line && offset < text.length) {
        if (text[offset] === '\n') {
            currentLine++;
        }
        offset++;
    }

    return offset + column;
}
