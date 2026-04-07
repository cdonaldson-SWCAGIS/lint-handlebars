import { Rule, LintMessage, RuleContext } from './types.js';
import { ExpressionType } from '../parser/index.js';
import { BUILTIN_HELPERS } from '../config/defaults.js';

/**
 * HBS003: Unknown helper.
 * Flags helpers that are not in the built-in set or the configured helpers list.
 * Block statements are always helpers. Mustache statements are helpers if they have params.
 */
export const hbs003: Rule = {
    code: 'HBS003',
    meta: {
        defaultSeverity: 'warning',
        description: 'Unknown helper',
        fixable: false,
    },
    check(context: RuleContext): LintMessage[] {
        const messages: LintMessage[] = [];
        const severity = context.ruleSeverities[this.code] ?? this.meta.defaultSeverity;
        if (severity === 'off') return messages;

        const knownHelpers = new Set([...BUILTIN_HELPERS, ...context.helpers]);

        for (const expr of context.parseResult.expressions) {
            let isHelper = false;

            if (expr.type === ExpressionType.BlockStatement) {
                isHelper = true;
            } else if (expr.type === ExpressionType.MustacheStatement) {
                // A mustache with params is a helper call: {{formatDate value}}
                isHelper = expr.params.length > 0 || Object.keys(expr.hash).length > 0;
            }

            if (isHelper && !knownHelpers.has(expr.name)) {
                messages.push({
                    ruleCode: this.code,
                    message: `Unknown helper "${expr.name}"`,
                    severity,
                    range: expr.range,
                });
            }
        }

        return messages;
    },
};
