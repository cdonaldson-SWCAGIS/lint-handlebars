import { Expression, ExpressionType, Position, SubExpression, UnclosedExpression } from './types.js';

/**
 * Build an array of line-start offsets for O(log n) offset-to-position lookup.
 */
function buildLineOffsets(text: string): number[] {
    const offsets = [0];
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '\n') {
            offsets.push(i + 1);
        }
    }
    return offsets;
}

function offsetToPosition(offset: number, lineOffsets: number[]): Position {
    // Binary search for the line containing this offset
    let lo = 0;
    let hi = lineOffsets.length - 1;
    while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (lineOffsets[mid] <= offset) {
            lo = mid;
        } else {
            hi = mid - 1;
        }
    }
    return { line: lo, column: offset - lineOffsets[lo] };
}

interface RawMatch {
    content: string;  // inner content (between delimiters)
    raw: string;      // full match including delimiters
    start: number;    // offset of first {
    end: number;      // offset after last }
    isRaw: boolean;   // triple-stache {{{ }}}
}

interface BoundaryResult {
    matches: RawMatch[];
    unclosed: { start: number; raw: string }[];
}

/**
 * Scan the text character-by-character to find {{ }} and {{{ }}} boundaries.
 */
function findExpressionBoundaries(text: string): BoundaryResult {
    const matches: RawMatch[] = [];
    const unclosed: { start: number; raw: string }[] = [];
    let i = 0;

    while (i < text.length) {
        if (text[i] === '{' && i + 1 < text.length && text[i + 1] === '{') {
            const start = i;
            const isRaw = i + 2 < text.length && text[i + 2] === '{';
            const openLen = isRaw ? 3 : 2;
            i += openLen;

            // Find the matching close
            let depth = 0;
            const contentStart = i;
            let found = false;

            while (i < text.length) {
                if (isRaw && text[i] === '}' && i + 1 < text.length && text[i + 1] === '}' && i + 2 < text.length && text[i + 2] === '}') {
                    const content = text.substring(contentStart, i);
                    const end = i + 3;
                    matches.push({
                        content,
                        raw: text.substring(start, end),
                        start,
                        end,
                        isRaw: true,
                    });
                    i = end;
                    found = true;
                    break;
                } else if (!isRaw && text[i] === '}' && i + 1 < text.length && text[i + 1] === '}' && depth === 0) {
                    const content = text.substring(contentStart, i);
                    const end = i + 2;
                    matches.push({
                        content,
                        raw: text.substring(start, end),
                        start,
                        end,
                        isRaw: false,
                    });
                    i = end;
                    found = true;
                    break;
                } else if (text[i] === '(') {
                    depth++;
                    i++;
                } else if (text[i] === ')') {
                    depth = Math.max(0, depth - 1);
                    i++;
                } else {
                    i++;
                }
            }

            if (!found) {
                // Collect unclosed expression for reporting
                const endOffset = Math.min(start + 40, text.length);
                unclosed.push({
                    start,
                    raw: text.substring(start, endOffset),
                });
                i = start + openLen;
            }
        } else {
            i++;
        }
    }

    return { matches, unclosed };
}

/**
 * Parse sub-expressions like (helper arg1 arg2) from a string.
 */
function parseSubExpressions(content: string): SubExpression[] {
    const subExprs: SubExpression[] = [];
    const regex = /\(([^()]+)\)/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(content)) !== null) {
        const inner = match[1].trim();
        const parts = splitTokens(inner);
        if (parts.length > 0) {
            subExprs.push({
                name: parts[0],
                params: parts.slice(1),
            });
        }
    }

    return subExprs;
}

/**
 * Split a string into tokens, respecting quoted strings.
 */
function splitTokens(input: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let inQuote: string | null = null;
    let i = 0;

    while (i < input.length) {
        const ch = input[i];

        if (inQuote) {
            current += ch;
            if (ch === inQuote) {
                inQuote = null;
            }
            i++;
        } else if (ch === '"' || ch === "'") {
            current += ch;
            inQuote = ch;
            i++;
        } else if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
            if (current.length > 0) {
                tokens.push(current);
                current = '';
            }
            i++;
        } else if (ch === '(' || ch === ')') {
            // Skip sub-expression delimiters at this level
            if (current.length > 0) {
                tokens.push(current);
                current = '';
            }
            i++;
        } else {
            current += ch;
            i++;
        }
    }

    if (current.length > 0) {
        tokens.push(current);
    }

    return tokens;
}

/**
 * Classify and parse the inner content of a Handlebars expression.
 */
function parseContent(content: string, isRaw: boolean): Pick<Expression, 'type' | 'name' | 'params' | 'hash' | 'subExpressions' | 'blockParams'> {
    const trimmed = content.trim();

    // Comment: {{! ... }} or {{!-- ... --}}
    if (trimmed.startsWith('!')) {
        const commentBody = trimmed.startsWith('!--')
            ? trimmed.slice(3, trimmed.endsWith('--') ? -2 : undefined)
            : trimmed.slice(1);
        return {
            type: ExpressionType.CommentStatement,
            name: commentBody.trim(),
            params: [],
            hash: {},
            subExpressions: [],
        };
    }

    // Partial: {{> partialName }}
    if (trimmed.startsWith('>')) {
        const rest = trimmed.slice(1).trim();
        const tokens = splitTokens(rest);
        return {
            type: ExpressionType.PartialStatement,
            name: tokens[0] || '',
            params: tokens.slice(1),
            hash: {},
            subExpressions: [],
        };
    }

    // Close block: {{/blockName}}
    if (trimmed.startsWith('/')) {
        return {
            type: ExpressionType.CloseBlock,
            name: trimmed.slice(1).trim(),
            params: [],
            hash: {},
            subExpressions: [],
        };
    }

    // Block open: {{#helperName ...}} or {{else}} / {{^}}
    const isBlock = trimmed.startsWith('#');
    const isElse = trimmed === 'else' || trimmed.startsWith('else ');
    const isInverse = trimmed.startsWith('^');

    // Extract sub-expressions before tokenizing (they contain spaces)
    const subExpressions = parseSubExpressions(content);

    // Remove sub-expression contents for tokenizing
    const withoutSubs = content.replace(/\([^()]*\)/g, '__SUB__');

    let bodyStr: string;
    if (isBlock) {
        bodyStr = withoutSubs.trim().slice(1); // remove #
    } else if (isInverse) {
        bodyStr = withoutSubs.trim().slice(1); // remove ^
    } else {
        bodyStr = withoutSubs.trim();
    }

    const tokens = splitTokens(bodyStr);
    const name = tokens[0] || '';
    const params: string[] = [];
    const hash: Record<string, string> = {};

    for (let i = 1; i < tokens.length; i++) {
        const token = tokens[i];
        if (token === '__SUB__') continue;
        const eqIdx = token.indexOf('=');
        if (eqIdx > 0 && !token.startsWith('"') && !token.startsWith("'")) {
            const key = token.substring(0, eqIdx);
            let value = token.substring(eqIdx + 1);
            // Strip quotes from value
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            hash[key] = value;
        } else {
            params.push(token);
        }
    }

    // Extract block parameters: "as |item index|"
    let blockParams: string[] | undefined;
    const asIdx = params.indexOf('as');
    if (asIdx >= 0 && asIdx < params.length - 1) {
        const remaining = params.slice(asIdx + 1);
        // Collect tokens between pipe delimiters
        const pipeTokens: string[] = [];
        let inPipes = false;
        const extraParams: string[] = [];
        for (const token of remaining) {
            const stripped = token.replace(/\|/g, '');
            if (token.startsWith('|')) inPipes = true;
            if (inPipes && stripped) pipeTokens.push(stripped);
            if (token.endsWith('|')) { inPipes = false; continue; }
            if (!inPipes && !token.startsWith('|')) extraParams.push(token);
        }
        if (pipeTokens.length > 0) {
            blockParams = pipeTokens;
            // Remove "as" and pipe tokens from params
            params.splice(asIdx);
            params.push(...extraParams);
        }
    }

    let type: ExpressionType;
    if (isBlock || isInverse) {
        type = ExpressionType.BlockStatement;
    } else if (isRaw) {
        type = ExpressionType.RawMustacheStatement;
    } else if (isElse) {
        // Treat else as a block statement for matching purposes
        type = ExpressionType.BlockStatement;
    } else {
        type = ExpressionType.MustacheStatement;
    }

    return { type, name, params, hash, subExpressions, blockParams };
}

export interface ExtractionResult {
    expressions: Expression[];
    unclosedExpressions: UnclosedExpression[];
}

/**
 * Extract all Handlebars expressions from text with position information.
 */
export function extractExpressions(text: string): ExtractionResult {
    const lineOffsets = buildLineOffsets(text);
    const { matches: rawMatches, unclosed } = findExpressionBoundaries(text);
    const expressions: Expression[] = [];

    for (const match of rawMatches) {
        const parsed = parseContent(match.content, match.isRaw);
        const start = offsetToPosition(match.start, lineOffsets);
        const end = offsetToPosition(match.end, lineOffsets);

        expressions.push({
            ...parsed,
            raw: match.raw,
            range: { start, end },
        });
    }

    const unclosedExpressions: UnclosedExpression[] = unclosed.map(u => ({
        start: offsetToPosition(u.start, lineOffsets),
        raw: u.raw,
    }));

    return { expressions, unclosedExpressions };
}
