import { Rule, LintMessage, RuleContext } from './types.js';
import { ExpressionType } from '../parser/index.js';
import { SchemaDefinition } from '../schema/types.js';
import { createScopeAnalyzer } from '../schema/scopeMap.js';

/**
 * HBS005: Field not found in data schema.
 * Flags field references that don't exist at the current scope level.
 */
export const hbs005: Rule = {
    code: 'HBS005',
    meta: {
        defaultSeverity: 'info',
        description: 'Field not found in data schema',
        fixable: false,
    },
    check(context: RuleContext): LintMessage[] {
        if (!context.schema) return [];

        const messages: LintMessage[] = [];
        const severity = context.ruleSeverities[this.code] ?? this.meta.defaultSeverity;
        if (severity === 'off') return messages;

        const analyzer = createScopeAnalyzer(context.parseResult, context.schema);

        analyzer.walk((expr, tracker) => {
            // Only check simple field references (mustache without params)
            if (expr.type !== ExpressionType.MustacheStatement &&
                expr.type !== ExpressionType.RawMustacheStatement) return;

            // Skip helpers (have params or hash)
            if (expr.params.length > 0 || Object.keys(expr.hash).length > 0) return;

            const name = expr.name;

            // Skip special references
            if (name === 'this' || name === '.' || name.startsWith('@')) return;

            // Skip else
            if (name === 'else') return;

            const result = tracker.resolve(name);
            if (!result.found) {
                messages.push({
                    ruleCode: this.code,
                    message: `Field "${name}" not found in data schema`,
                    severity,
                    range: expr.range,
                });
            }
        });

        return messages;
    },
};
