import { Rule, LintMessage, RuleContext } from './types.js';
import { ExpressionType } from '../parser/index.js';

/**
 * HBS008: Empty expression.
 * Flags expressions like {{}} or {{  }} that have no content.
 */
export const hbs008: Rule = {
    code: 'HBS008',
    meta: {
        defaultSeverity: 'error',
        description: 'Empty expression',
        fixable: false,
    },
    check(context: RuleContext): LintMessage[] {
        const messages: LintMessage[] = [];
        const severity = context.ruleSeverities[this.code] ?? this.meta.defaultSeverity;
        if (severity === 'off') return messages;

        for (const expr of context.parseResult.expressions) {
            if (expr.type === ExpressionType.CommentStatement) continue;

            if (!expr.name || expr.name.trim() === '') {
                messages.push({
                    ruleCode: this.code,
                    message: 'Empty expression',
                    severity,
                    range: expr.range,
                });
            }
        }

        return messages;
    },
};
