import { Rule, LintMessage, RuleContext } from './types.js';
import { ExpressionType } from '../parser/index.js';
import { createScopeAnalyzer } from '../schema/scopeMap.js';

/**
 * HBS006: {{#each}} on a non-array field.
 * Flags when {{#each}} is used on a field that is an object or scalar, not an array.
 */
export const hbs006: Rule = {
    code: 'HBS006',
    meta: {
        defaultSeverity: 'warning',
        description: '{{#each}} on a non-array field',
        fixable: false,
    },
    check(context: RuleContext): LintMessage[] {
        if (!context.schema) return [];

        const messages: LintMessage[] = [];
        const severity = context.ruleSeverities[this.code] ?? this.meta.defaultSeverity;
        if (severity === 'off') return messages;

        const analyzer = createScopeAnalyzer(context.parseResult, context.schema);

        analyzer.walk((expr, tracker) => {
            if (expr.type !== ExpressionType.BlockStatement) return;
            if (expr.name !== 'each') return;

            const arg = expr.params[0];
            if (!arg) return;

            const isArray = tracker.isArray(arg);
            if (isArray === false) {
                messages.push({
                    ruleCode: this.code,
                    message: `"${arg}" is not an array — {{#each}} expects an array`,
                    severity,
                    range: expr.range,
                });
            }
        });

        return messages;
    },
};
