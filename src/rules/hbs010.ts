import { Rule, LintMessage, RuleContext } from './types.js';

/**
 * HBS010: Unclosed expression.
 * Flags {{ or {{{ that are never closed with matching }} or }}}.
 */
export const hbs010: Rule = {
    code: 'HBS010',
    meta: {
        defaultSeverity: 'error',
        description: 'Unclosed expression',
        fixable: false,
    },
    check(context: RuleContext): LintMessage[] {
        const messages: LintMessage[] = [];
        const severity = context.ruleSeverities[this.code] ?? this.meta.defaultSeverity;
        if (severity === 'off') return messages;

        for (const unclosed of context.parseResult.unclosedExpressions) {
            messages.push({
                ruleCode: this.code,
                message: `Unclosed expression: ${unclosed.raw.trim()}`,
                severity,
                range: {
                    start: unclosed.start,
                    end: { line: unclosed.start.line, column: unclosed.start.column + 2 },
                },
            });
        }

        return messages;
    },
};
