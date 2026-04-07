import { Rule, LintMessage, RuleContext } from './types.js';
import { ExpressionType } from '../parser/index.js';
import { createScopeAnalyzer } from '../schema/scopeMap.js';

/**
 * HBS007: Accessing child field that doesn't exist on parent type.
 * Specifically targets field access inside block scopes (e.g., inside {{#each}}).
 */
export const hbs007: Rule = {
    code: 'HBS007',
    meta: {
        defaultSeverity: 'warning',
        description: 'Accessing child field that doesn\'t exist on parent type',
        fixable: false,
    },
    check(context: RuleContext): LintMessage[] {
        if (!context.schema) return [];

        const messages: LintMessage[] = [];
        const severity = context.ruleSeverities[this.code] ?? this.meta.defaultSeverity;
        if (severity === 'off') return messages;

        const analyzer = createScopeAnalyzer(context.parseResult, context.schema);
        let blockDepth = 0;

        analyzer.walk((expr, tracker) => {
            if (expr.type === ExpressionType.BlockStatement && expr.name !== 'else') {
                blockDepth++;
                return;
            }

            if (expr.type === ExpressionType.CloseBlock) {
                blockDepth--;
                return;
            }

            if (blockDepth === 0) return;

            // Only check simple field references
            if (expr.type !== ExpressionType.MustacheStatement &&
                expr.type !== ExpressionType.RawMustacheStatement) return;

            if (expr.params.length > 0 || Object.keys(expr.hash).length > 0) return;

            const name = expr.name;
            if (name === 'this' || name === '.' || name.startsWith('@')) return;
            if (name === 'else') return;

            const result = tracker.resolve(name);
            if (!result.found) {
                messages.push({
                    ruleCode: this.code,
                    message: `Child field "${name}" doesn't exist on parent type`,
                    severity,
                    range: expr.range,
                });
            }
        });

        return messages;
    },
};
