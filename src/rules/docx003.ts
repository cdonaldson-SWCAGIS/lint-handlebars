import { Rule, LintMessage, RuleContext } from './types.js';
import { ExpressionType } from '../parser/index.js';
import { findXmlElements, positionToOffset } from '../parser/xmlPositions.js';

/**
 * DOCX003: Revision tracking (rsid) near expression.
 * Word's revision tracking attributes can cause run-splitting.
 */
export const docx003: Rule = {
    code: 'DOCX003',
    meta: {
        defaultSeverity: 'info',
        description: 'Revision tracking (rsid) near expression',
        fixable: 'safe',
    },
    check(context: RuleContext): LintMessage[] {
        if (!context.docxMode) return [];

        const messages: LintMessage[] = [];
        const severity = context.ruleSeverities[this.code] ?? this.meta.defaultSeverity;
        if (severity === 'off') return messages;

        const { text } = context;
        const runs = findXmlElements(text, 'w:r');

        for (const expr of context.parseResult.expressions) {
            if (expr.type === ExpressionType.CommentStatement) continue;

            const exprStart = positionToOffset(text, expr.range.start.line, expr.range.start.column);

            // Find the containing run
            const containingRun = runs.find(
                r => exprStart >= r.startOffset && exprStart < r.endOffset
            );
            if (!containingRun) continue;

            const runContent = text.substring(containingRun.startOffset, containingRun.endOffset);
            const rsidMatch = runContent.match(/w:rsid\w*="[^"]*"/);
            if (!rsidMatch) continue;

            // Calculate position of the run
            let line = 0, col = 0;
            for (let i = 0; i < containingRun.startOffset && i < text.length; i++) {
                if (text[i] === '\n') { line++; col = 0; } else { col++; }
            }

            // Find the rsid attribute position relative to the run
            const rsidOffset = containingRun.startOffset + runContent.indexOf(rsidMatch[0]);
            let rsidLine = 0, rsidCol = 0;
            for (let i = 0; i < rsidOffset && i < text.length; i++) {
                if (text[i] === '\n') { rsidLine++; rsidCol = 0; } else { rsidCol++; }
            }
            let rsidEndCol = rsidCol;
            let rsidEndLine = rsidLine;
            for (let i = 0; i < rsidMatch[0].length; i++) {
                rsidEndCol++;
            }

            messages.push({
                ruleCode: this.code,
                message: `Revision tracking attribute "${rsidMatch[0]}" near expression "${expr.raw}"`,
                severity,
                range: {
                    start: { line: rsidLine, column: rsidCol },
                    end: { line: rsidEndLine, column: rsidEndCol },
                },
                fix: {
                    description: 'Remove rsid attribute',
                    safe: true,
                    edits: [{
                        range: {
                            start: { line: rsidLine, column: rsidCol },
                            end: { line: rsidEndLine, column: rsidEndCol },
                        },
                        newText: '',
                    }],
                },
            });
        }

        return messages;
    },
};
