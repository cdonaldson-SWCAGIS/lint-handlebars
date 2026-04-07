import * as vscode from 'vscode';
import { LintMessage } from './rules/types.js';
import { Fix } from './rules/types.js';

// Store fixes keyed by document URI + diagnostic range for code action lookup
const fixStore = new Map<string, Fix>();

function fixKey(uri: string, ruleCode: string, line: number, col: number): string {
    return `${uri}|${ruleCode}|${line}:${col}`;
}

export function storeFix(uri: string, msg: LintMessage): void {
    if (msg.fix) {
        fixStore.set(
            fixKey(uri, msg.ruleCode, msg.range.start.line, msg.range.start.column),
            msg.fix,
        );
    }
}

export function getFix(uri: string, ruleCode: string, line: number, col: number): Fix | undefined {
    return fixStore.get(fixKey(uri, ruleCode, line, col));
}

export function clearFixes(uri: string): void {
    for (const key of fixStore.keys()) {
        if (key.startsWith(uri + '|')) {
            fixStore.delete(key);
        }
    }
}

function severityToVscode(severity: string): vscode.DiagnosticSeverity {
    switch (severity) {
        case 'error': return vscode.DiagnosticSeverity.Error;
        case 'warning': return vscode.DiagnosticSeverity.Warning;
        case 'info': return vscode.DiagnosticSeverity.Information;
        default: return vscode.DiagnosticSeverity.Information;
    }
}

export function toDiagnostic(msg: LintMessage): vscode.Diagnostic {
    const range = new vscode.Range(
        msg.range.start.line, msg.range.start.column,
        msg.range.end.line, msg.range.end.column,
    );

    const diagnostic = new vscode.Diagnostic(range, msg.message, severityToVscode(msg.severity));
    diagnostic.source = 'hbs-lint';
    diagnostic.code = msg.ruleCode;

    return diagnostic;
}
