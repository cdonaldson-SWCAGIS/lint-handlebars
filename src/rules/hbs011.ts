import { Rule, LintMessage, RuleContext } from './types.js';
import { ExpressionType } from '../parser/index.js';
import { BUILTIN_HELPERS, JSREPORT_HELPERS } from '../config/defaults.js';

const SAFE_RAW_HELPERS = new Set([...BUILTIN_HELPERS, ...JSREPORT_HELPERS]);

/**
 * HBS011: Triple-stache raw output.
 * Informational warning when {{{ }}} is used, as it bypasses HTML escaping.
 * Skips known jsreport helpers that handle their own output safely.
 */
export const hbs011: Rule = {
    code: 'HBS011',
    meta: {
        defaultSeverity: 'info',
        description: 'Triple-stache raw output (unescaped)',
        fixable: false,
    },
    check(context: RuleContext): LintMessage[] {
        const messages: LintMessage[] = [];
        const severity = context.ruleSeverities[this.code] ?? this.meta.defaultSeverity;
        if (severity === 'off') return messages;

        const knownSafe = new Set([...SAFE_RAW_HELPERS, ...context.helpers]);

        for (const expr of context.parseResult.expressions) {
            if (expr.type !== ExpressionType.RawMustacheStatement) continue;

            if (knownSafe.has(expr.name)) continue;

            messages.push({
                ruleCode: this.code,
                message: `Triple-stache "{{{${expr.name}}}}" outputs raw unescaped content`,
                severity,
                range: expr.range,
            });
        }

        return messages;
    },
};
