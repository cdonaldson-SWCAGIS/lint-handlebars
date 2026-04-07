import { Rule, LintMessage, RuleContext } from './types.js';
import { ExpressionType } from '../parser/index.js';
import { findXmlElements, positionToOffset } from '../parser/xmlPositions.js';

/**
 * DOCX004: Block helper spans table row boundaries.
 * Flags when {{#each}}, {{#if}}, etc. open in one <w:tr> and close in another.
 */
export const docx004: Rule = {
    code: 'DOCX004',
    meta: {
        defaultSeverity: 'info',
        description: 'Block helper spans table row boundaries',
        fixable: false,
    },
    check(context: RuleContext): LintMessage[] {
        if (!context.docxMode) return [];

        const messages: LintMessage[] = [];
        const severity = context.ruleSeverities[this.code] ?? this.meta.defaultSeverity;
        if (severity === 'off') return messages;

        const { text } = context;
        const tableRows = findXmlElements(text, 'w:tr');
        if (tableRows.length === 0) return messages;

        for (const block of context.parseResult.blocks) {
            if (!block.close) continue;

            const openStart = positionToOffset(text, block.open.range.start.line, block.open.range.start.column);
            const closeStart = positionToOffset(text, block.close.range.start.line, block.close.range.start.column);

            // Find which table row contains each
            const openRow = tableRows.find(
                r => openStart >= r.startOffset && openStart < r.endOffset
            );
            const closeRow = tableRows.find(
                r => closeStart >= r.startOffset && closeStart < r.endOffset
            );

            // Flag if they're in different rows, or if one is outside any row
            if (openRow && closeRow && openRow !== closeRow) {
                messages.push({
                    ruleCode: this.code,
                    message: `Block "{{#${block.open.name}}}" spans across table row boundaries`,
                    severity,
                    range: block.open.range,
                });
            }
        }

        return messages;
    },
};
