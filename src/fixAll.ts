import * as vscode from 'vscode';
import { getFix } from './diagnostics.js';

export class HbsLintFixAllProvider implements vscode.CodeActionProvider {
    public static readonly providedCodeActionKinds = [
        vscode.CodeActionKind.SourceFixAll,
    ];

    provideCodeActions(
        document: vscode.TextDocument,
        _range: vscode.Range,
        context: vscode.CodeActionContext,
    ): vscode.CodeAction[] {
        // Only respond to source.fixAll requests
        if (!context.only?.contains(vscode.CodeActionKind.SourceFixAll)) {
            return [];
        }

        const diagnostics = vscode.languages.getDiagnostics(document.uri);
        const hbsDiagnostics = diagnostics.filter(d => d.source === 'hbs-lint');

        const edit = new vscode.WorkspaceEdit();
        let hasEdits = false;

        for (const diagnostic of hbsDiagnostics) {
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

            if (!fix || !fix.safe) continue;

            for (const textEdit of fix.edits) {
                const editRange = new vscode.Range(
                    textEdit.range.start.line, textEdit.range.start.column,
                    textEdit.range.end.line, textEdit.range.end.column,
                );
                edit.replace(document.uri, editRange, textEdit.newText);
                hasEdits = true;
            }
        }

        if (!hasEdits) return [];

        const action = new vscode.CodeAction(
            'Fix all safe hbs-lint issues',
            vscode.CodeActionKind.SourceFixAll,
        );
        action.edit = edit;
        return [action];
    }
}
