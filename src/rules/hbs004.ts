import { Rule, LintMessage, RuleContext } from './types.js';
import { BUILTIN_HELPERS } from '../config/defaults.js';

/**
 * HBS004: Unknown sub-expression helper.
 * Flags sub-expression helpers that are not in the built-in set or configured helpers.
 */
export const hbs004: Rule = {
    code: 'HBS004',
    meta: {
        defaultSeverity: 'warning',
        description: 'Unknown sub-expression helper',
        fixable: false,
    },
    check(context: RuleContext): LintMessage[] {
        const messages: LintMessage[] = [];
        const severity = context.ruleSeverities[this.code] ?? this.meta.defaultSeverity;
        if (severity === 'off') return messages;

        const knownHelpers = new Set([...BUILTIN_HELPERS, ...context.helpers]);

        for (const expr of context.parseResult.expressions) {
            for (const sub of expr.subExpressions) {
                if (!knownHelpers.has(sub.name)) {
                    messages.push({
                        ruleCode: this.code,
                        message: `Unknown sub-expression helper "${sub.name}"`,
                        severity,
                        range: expr.range,
                    });
                }
            }
        }

        return messages;
    },
};
