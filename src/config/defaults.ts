import { ResolvedConfig } from './types.js';
import { RuleSeverity } from '../rules/types.js';

export const DEFAULT_RULE_SEVERITIES: Record<string, RuleSeverity> = {
    HBS001: 'error',
    HBS002: 'error',
    HBS003: 'warning',
    HBS004: 'warning',
    HBS005: 'info',
    HBS006: 'warning',
    HBS007: 'warning',
    HBS008: 'error',
    HBS009: 'error',
    HBS010: 'error',
    HBS011: 'info',
    DOCX001: 'error',
    DOCX002: 'warning',
    DOCX003: 'info',
    DOCX004: 'info',
};

export const BUILTIN_HELPERS = new Set([
    'if', 'unless', 'each', 'with', 'lookup', 'log', 'else',
]);

export const JSREPORT_HELPERS = [
    'docxList', 'docxTable', 'docxImage', 'docxStyle',
    'docxChart', 'docxHtml', 'docxWatermark', 'docxRemove',
];

export const DEFAULT_HELPERS = [
    'if', 'unless', 'each', 'with', 'lookup', 'log',
    ...JSREPORT_HELPERS,
];

export const DEFAULT_CONFIG: ResolvedConfig = {
    helpers: [],
    schemaFile: null,
    docxMode: true,
    lintOn: 'save',
    rules: { ...DEFAULT_RULE_SEVERITIES },
};
