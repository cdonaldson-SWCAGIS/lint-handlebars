import { Rule, LintMessage, RuleContext } from './types.js';

/**
 * HBS001: Mismatched block closer.
 * Flags when a block's closing tag name doesn't match the opening tag name.
 * e.g., {{#if}}...{{/unless}}
 */
export const hbs001: Rule = {
    code: 'HBS001',
    meta: {
        defaultSeverity: 'error',
        description: 'Mismatched block closer',
        fixable: 'unsafe',
    },
    check(context: RuleContext): LintMessage[] {
        const messages: LintMessage[] = [];
        const severity = context.ruleSeverities[this.code] ?? this.meta.defaultSeverity;
        if (severity === 'off') return messages;

        for (const block of context.parseResult.blocks) {
            if (block.mismatch && block.close && block.open !== block.close) {
                messages.push({
                    ruleCode: this.code,
                    message: `Mismatched block closer: opened as "{{#${block.open.name}}}" but closed as "{{/${block.close.name}}}"`,
                    severity,
                    range: block.close.range,
                    fix: {
                        description: `Change "{{/${block.close.name}}}" to "{{/${block.open.name}}}"`,
                        safe: false,
                        edits: [{
                            range: block.close.range,
                            newText: `{{/${block.open.name}}}`,
                        }],
                    },
                });
            }
        }

        return messages;
    },
};
