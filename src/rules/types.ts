import { ParseResult, Range } from '../parser/index.js';
import { SchemaDefinition } from '../schema/types.js';

export type RuleSeverity = 'error' | 'warning' | 'info' | 'off';

export interface TextEdit {
    range: Range;
    newText: string;
}

export interface Fix {
    description: string;
    safe: boolean;
    edits: TextEdit[];
}

export interface LintMessage {
    ruleCode: string;
    message: string;
    severity: RuleSeverity;
    range: Range;
    fix?: Fix;
}

export interface RuleContext {
    text: string;
    parseResult: ParseResult;
    helpers: string[];
    ruleSeverities: Record<string, RuleSeverity>;
    docxMode: boolean;
    schema?: SchemaDefinition;
}

export interface RuleMeta {
    defaultSeverity: RuleSeverity;
    description: string;
    fixable: false | 'safe' | 'unsafe';
}

export interface Rule {
    code: string;
    meta: RuleMeta;
    check(context: RuleContext): LintMessage[];
}
