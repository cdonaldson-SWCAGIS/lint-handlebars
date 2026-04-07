import { Rule, LintMessage, RuleContext } from './types.js';
import { ExpressionType } from '../parser/index.js';
import { findXmlElements, positionToOffset } from '../parser/xmlPositions.js';

/**
 * DOCX001: Expression split across <w:r> runs.
 * Detects when a Handlebars expression spans multiple Word runs,
 * which happens when Word inserts formatting or proofing markup mid-expression.
 */
export const docx001: Rule = {
    code: 'DOCX001',
    meta: {
        defaultSeverity: 'error',
        description: 'Expression split across <w:r> runs',
        fixable: 'unsafe',
    },
    check(context: RuleContext): LintMessage[] {
        if (!context.docxMode) return [];

        const messages: LintMessage[] = [];
        const severity = context.ruleSeverities[this.code] ?? this.meta.defaultSeverity;
        if (severity === 'off') return messages;

        const { text } = context;
        const runs = findXmlElements(text, 'w:r');
        if (runs.length === 0) return messages;

        for (const expr of context.parseResult.expressions) {
            if (expr.type === ExpressionType.CommentStatement) continue;

            const exprStart = positionToOffset(text, expr.range.start.line, expr.range.start.column);
            const exprEnd = positionToOffset(text, expr.range.end.line, expr.range.end.column);

            // Find which runs contain the start and end of the expression
            let startRun: number | null = null;
            let endRun: number | null = null;

            for (let i = 0; i < runs.length; i++) {
                const run = runs[i];
                if (exprStart >= run.startOffset && exprStart < run.endOffset) {
                    startRun = i;
                }
                if (exprEnd > run.startOffset && exprEnd <= run.endOffset) {
                    endRun = i;
                }
            }

            if (startRun !== null && endRun !== null && startRun !== endRun) {
                // Expression spans multiple runs
                const runsBetween = text.substring(
                    runs[startRun].startOffset,
                    runs[endRun].endOffset,
                );

                messages.push({
                    ruleCode: this.code,
                    message: `Expression "${expr.raw}" is split across ${endRun - startRun + 1} <w:r> runs`,
                    severity,
                    range: expr.range,
                    fix: {
                        description: 'Reconstitute expression into a single run (may lose some formatting)',
                        safe: false,
                        edits: [{
                            range: {
                                start: expr.range.start,
                                end: expr.range.end,
                            },
                            // The fix would need to rebuild the run — simplified here
                            newText: expr.raw,
                        }],
                    },
                });
            }
        }

        return messages;
    },
};
