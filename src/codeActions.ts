import * as vscode from 'vscode';
import { getFix } from './diagnostics.js';
import { Range as LintRange } from './parser/index.js';

export class HbsLintCodeActionProvider implements vscode.CodeActionProvider {
    public static readonly providedCodeActionKinds = [
        vscode.CodeActionKind.QuickFix,
    ];

    provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range,
        context: vscode.CodeActionContext,
    ): vscode.CodeAction[] {
        const actions: vscode.CodeAction[] = [];

        for (const diagnostic of context.diagnostics) {
            if (diagnostic.source !== 'hbs-lint') continue;

            const ruleCode = typeof diagnostic.code === 'string'
                ? diagnostic.code
                : typeof diagnostic.code === 'object' && diagnostic.code
                    ? String(diagnostic.code.value)
                    : '';

            const fix = getFix(
                document.uri.toString(),
                ruleCode,
                diagnostic.range.start.line,
                diagnostic.range.start.character,
            );

            if (!fix) continue;

            const title = fix.safe
                ? `Fix: ${fix.description}`
                : `Fix (unsafe): ${fix.description}`;

            const action = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
            action.diagnostics = [diagnostic];

            const edit = new vscode.WorkspaceEdit();
            for (const textEdit of fix.edits) {
                const editRange = new vscode.Range(
                    textEdit.range.start.line, textEdit.range.start.column,
                    textEdit.range.end.line, textEdit.range.end.column,
                );
                edit.replace(document.uri, editRange, textEdit.newText);
            }
            action.edit = edit;

            if (fix.safe) {
                action.isPreferred = true;
            }

            actions.push(action);
        }

        return actions;
    }
}
