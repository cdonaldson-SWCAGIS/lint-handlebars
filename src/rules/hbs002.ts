import { Rule, LintMessage, RuleContext } from './types.js';

/**
 * HBS002: Unclosed block helper.
 * Flags when a block opening tag has no corresponding closing tag.
 */
export const hbs002: Rule = {
    code: 'HBS002',
    meta: {
        defaultSeverity: 'error',
        description: 'Unclosed block helper',
        fixable: false,
    },
    check(context: RuleContext): LintMessage[] {
        const messages: LintMessage[] = [];
        const severity = context.ruleSeverities[this.code] ?? this.meta.defaultSeverity;
        if (severity === 'off') return messages;

        for (const block of context.parseResult.blocks) {
            if (block.close === null) {
                messages.push({
                    ruleCode: this.code,
                    message: `Unclosed block helper "{{#${block.open.name}}}"`,
                    severity,
                    range: block.open.range,
                });
            }
        }

        return messages;
    },
};
