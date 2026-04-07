import { Rule, LintMessage, RuleContext } from './types.js';

/**
 * HBS009: Orphaned block closer.
 * Flags {{/name}} that has no matching {{#name}} opener.
 */
export const hbs009: Rule = {
    code: 'HBS009',
    meta: {
        defaultSeverity: 'error',
        description: 'Orphaned block closer (close without open)',
        fixable: false,
    },
    check(context: RuleContext): LintMessage[] {
        const messages: LintMessage[] = [];
        const severity = context.ruleSeverities[this.code] ?? this.meta.defaultSeverity;
        if (severity === 'off') return messages;

        for (const block of context.parseResult.blocks) {
            // Orphaned closers are stored with open === close by the block matcher
            if (block.open === block.close && block.mismatch) {
                messages.push({
                    ruleCode: this.code,
                    message: `Orphaned block closer "{{/${block.close!.name}}}" has no matching opener`,
                    severity,
                    range: block.close!.range,
                });
            }
        }

        return messages;
    },
};
