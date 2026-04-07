import { parse, ParseResult } from './parser/index.js';
import { allRules } from './rules/registry.js';
import { LintMessage, RuleContext } from './rules/types.js';
import { ResolvedConfig } from './config/types.js';
import { getSuppressions, isRuleSuppressed } from './config/suppressions.js';
import { SchemaDefinition } from './schema/types.js';

export function lint(text: string, config: ResolvedConfig, schema?: SchemaDefinition): LintMessage[] {
    const parseResult = parse(text);
    const suppressions = getSuppressions(parseResult.expressions);

    const context: RuleContext = {
        text,
        parseResult,
        helpers: config.helpers,
        ruleSeverities: config.rules,
        docxMode: config.docxMode,
        schema,
    };

    const messages: LintMessage[] = [];

    for (const [code, rule] of allRules) {
        const severity = config.rules[code] ?? rule.meta.defaultSeverity;
        if (severity === 'off') continue;

        // Skip DOCX rules if docxMode is off
        if (code.startsWith('DOCX') && !config.docxMode) continue;

        const ruleMessages = rule.check(context);
        for (const msg of ruleMessages) {
            if (!isRuleSuppressed(msg.ruleCode, msg.range.start.line, suppressions)) {
                messages.push(msg);
            }
        }
    }

    return messages;
}
