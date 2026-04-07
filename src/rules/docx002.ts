import { Rule, LintMessage, RuleContext } from './types.js';
import { ExpressionType } from '../parser/index.js';
import { findXmlElements, positionToOffset } from '../parser/xmlPositions.js';

/**
 * DOCX002: <w:proofErr> markup near expression.
 * Word inserts spell-check artifacts that can interfere with expressions.
 */
export const docx002: Rule = {
    code: 'DOCX002',
    meta: {
        defaultSeverity: 'warning',
        description: '<w:proofErr> markup near expression',
        fixable: 'safe',
    },
    check(context: RuleContext): LintMessage[] {
        if (!context.docxMode) return [];

        const messages: LintMessage[] = [];
        const severity = context.ruleSeverities[this.code] ?? this.meta.defaultSeverity;
        if (severity === 'off') return messages;

        const { text } = context;
        const proofErrs = findXmlElements(text, 'w:proofErr');
        if (proofErrs.length === 0) return messages;

        // Find paragraphs containing expressions
        const paragraphs = findXmlElements(text, 'w:p');

        for (const expr of context.parseResult.expressions) {
            if (expr.type === ExpressionType.CommentStatement) continue;

            const exprStart = positionToOffset(text, expr.range.start.line, expr.range.start.column);

            // Find the containing paragraph
            const containingPara = paragraphs.find(
                p => exprStart >= p.startOffset && exprStart < p.endOffset
            );
            if (!containingPara) continue;

            // Find proofErr elements in the same paragraph
            const nearbyProofErrs = proofErrs.filter(
                pe => pe.startOffset >= containingPara.startOffset && pe.endOffset <= containingPara.endOffset
            );

            for (const pe of nearbyProofErrs) {
                const proofErrText = text.substring(pe.startOffset, pe.endOffset);

                // Build line/col for the proofErr
                let line = 0, col = 0;
                for (let i = 0; i < pe.startOffset && i < text.length; i++) {
                    if (text[i] === '\n') { line++; col = 0; } else { col++; }
                }
                let endLine = line, endCol = col;
                for (let i = pe.startOffset; i < pe.endOffset && i < text.length; i++) {
                    if (text[i] === '\n') { endLine++; endCol = 0; } else { endCol++; }
                }

                messages.push({
                    ruleCode: this.code,
                    message: `<w:proofErr> found near expression "${expr.raw}"`,
                    severity,
                    range: {
                        start: { line, column: col },
                        end: { line: endLine, column: endCol },
                    },
                    fix: {
                        description: 'Remove <w:proofErr> element',
                        safe: true,
                        edits: [{
                            range: {
                                start: { line, column: col },
                                end: { line: endLine, column: endCol },
                            },
                            newText: '',
                        }],
                    },
                });
            }
        }

        // Deduplicate by offset (same proofErr might be near multiple expressions)
        const seen = new Set<string>();
        return messages.filter(m => {
            const key = `${m.range.start.line}:${m.range.start.column}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    },
};
