import { Expression, ExpressionType } from '../parser/index.js';

export interface Suppression {
    rules: string[];
    line: number;
    type: 'block' | 'next-line';
}

/**
 * Parse inline suppression comments from expressions.
 *
 * Supported formats:
 *   {{! hbs-lint-disable RULE1 RULE2 }}
 *   {{! hbs-lint-disable-next-line RULE1 }}
 */
export function getSuppressions(expressions: Expression[]): Suppression[] {
    const suppressions: Suppression[] = [];

    for (const expr of expressions) {
        if (expr.type !== ExpressionType.CommentStatement) continue;

        const text = expr.name.trim();

        if (text.startsWith('hbs-lint-disable-next-line')) {
            const rest = text.slice('hbs-lint-disable-next-line'.length).trim();
            const rules = rest ? rest.split(/\s+/) : [];
            if (rules.length > 0) {
                suppressions.push({
                    rules,
                    line: expr.range.start.line,
                    type: 'next-line',
                });
            }
        } else if (text.startsWith('hbs-lint-disable')) {
            const rest = text.slice('hbs-lint-disable'.length).trim();
            const rules = rest ? rest.split(/\s+/) : [];
            if (rules.length > 0) {
                suppressions.push({
                    rules,
                    line: expr.range.start.line,
                    type: 'block',
                });
            }
        }
    }

    return suppressions;
}

/**
 * Check if a rule is suppressed at a given line.
 */
export function isRuleSuppressed(ruleCode: string, line: number, suppressions: Suppression[]): boolean {
    for (const s of suppressions) {
        if (!s.rules.includes(ruleCode)) continue;

        if (s.type === 'next-line' && line === s.line + 1) {
            return true;
        }
        if (s.type === 'block' && line >= s.line) {
            return true;
        }
    }
    return false;
}
