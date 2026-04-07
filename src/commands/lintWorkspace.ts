import * as vscode from 'vscode';
import { lint } from '../linter.js';
import { toDiagnostic, storeFix, clearFixes } from '../diagnostics.js';
import { resolveConfig } from '../config/resolver.js';
import { HbsLintConfig } from '../config/types.js';
import { isDocxTemplate } from '../activation.js';
import { SchemaDefinition } from '../schema/types.js';

export function registerLintWorkspaceCommand(
    context: vscode.ExtensionContext,
    diagnosticCollection: vscode.DiagnosticCollection,
    getConfig: () => HbsLintConfig | null,
    getSchema: () => SchemaDefinition | null,
): void {
    context.subscriptions.push(
        vscode.commands.registerCommand('hbs-lint.lintWorkspace', async () => {
            await vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: 'HBS Lint: Linting workspace...',
                    cancellable: false,
                },
                async (progress) => {
                    const files = await vscode.workspace.findFiles(
                        '{**/*.hbs,**/*.handlebars,**/templates/**,**/data/**}',
                        '**/node_modules/**',
                    );

                    let totalIssues = 0;
                    let lintedFiles = 0;

                    for (let i = 0; i < files.length; i++) {
                        const uri = files[i];
                        progress.report({
                            message: `File ${i + 1}/${files.length}`,
                            increment: (1 / files.length) * 100,
                        });

                        try {
                            const doc = await vscode.workspace.openTextDocument(uri);
                            const text = doc.getText();

                            // Skip files without handlebars expressions
                            if (!text.includes('{{')) continue;

                            const config = getConfig();
                            const resolved = resolveConfig(config, uri.fsPath);

                            if (config?.docxMode === undefined) {
                                resolved.docxMode = isDocxTemplate(text);
                            }

                            clearFixes(uri.toString());
                            const schema = getSchema() ?? undefined;
                            const messages = lint(text, resolved, schema);

                            const diagnostics = messages.map(msg => {
                                storeFix(uri.toString(), msg);
                                return toDiagnostic(msg);
                            });

                            diagnosticCollection.set(uri, diagnostics);
                            totalIssues += messages.length;
                            lintedFiles++;
                        } catch {
                            // Skip files that can't be opened
                        }
                    }

                    vscode.window.showInformationMessage(
                        `HBS Lint: Linted ${lintedFiles} files, found ${totalIssues} issues.`
                    );
                },
            );
        })
    );
}
