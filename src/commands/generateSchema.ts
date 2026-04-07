import * as vscode from 'vscode';
import * as fs from 'fs';
import { inferSchema, schemaToJson } from '../schema/generator.js';

export function registerGenerateSchemaCommand(
    context: vscode.ExtensionContext,
): void {
    context.subscriptions.push(
        vscode.commands.registerCommand('hbs-lint.generateSchema', async () => {
            // Prompt for a JSON data file
            const files = await vscode.window.showOpenDialog({
                canSelectMany: false,
                filters: { 'JSON Files': ['json'] },
                title: 'Select a JSON data file to generate schema from',
            });

            if (!files || files.length === 0) return;

            const dataFile = files[0];

            try {
                const content = fs.readFileSync(dataFile.fsPath, 'utf-8');
                const data = JSON.parse(content);
                const schema = inferSchema(data);

                if (!schema) {
                    vscode.window.showErrorMessage('Could not infer schema — data must be a JSON object.');
                    return;
                }

                const jsonOutput = schemaToJson(schema);

                // Prompt for save location
                const saveUri = await vscode.window.showSaveDialog({
                    defaultUri: vscode.Uri.file('schema.json'),
                    filters: { 'JSON Files': ['json'] },
                    title: 'Save schema file',
                });

                if (!saveUri) return;

                const schemaText = JSON.stringify(jsonOutput, null, 2) + '\n';
                fs.writeFileSync(saveUri.fsPath, schemaText, 'utf-8');

                // Open the generated file
                const doc = await vscode.workspace.openTextDocument(saveUri);
                await vscode.window.showTextDocument(doc);

                vscode.window.showInformationMessage(
                    'Schema generated. Review and commit the file.'
                );
            } catch (err) {
                vscode.window.showErrorMessage(
                    `Failed to generate schema: ${err instanceof Error ? err.message : String(err)}`
                );
            }
        })
    );
}
