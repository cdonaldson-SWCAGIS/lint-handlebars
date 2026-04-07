import { RuleSeverity } from '../rules/types.js';

export interface HbsLintOverride {
    files: string[];
    rules: Record<string, RuleSeverity>;
}

export interface HbsLintConfig {
    helpers?: string[];
    schemaFile?: string;
    docxMode?: boolean;
    lintOn?: 'save' | 'type';
    rules?: Record<string, RuleSeverity>;
    overrides?: HbsLintOverride[];
}

export interface ResolvedConfig {
    helpers: string[];
    schemaFile: string | null;
    docxMode: boolean;
    lintOn: 'save' | 'type';
    rules: Record<string, RuleSeverity>;
}
