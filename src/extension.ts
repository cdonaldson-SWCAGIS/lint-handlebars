import * as vscode from 'vscode';
import * as path from 'path';
import { lint } from './linter.js';
import { toDiagnostic, storeFix, clearFixes } from './diagnostics.js';
import { shouldLintDocument, isDocxTemplate } from './activation.js';
import { loadConfig } from './config/loader.js';
import { resolveConfig } from './config/resolver.js';
import { HbsLintConfig } from './config/types.js';
import { loadSchema } from './schema/loader.js';
import { SchemaDefinition } from './schema/types.js';
import { HbsLintCodeActionProvider } from './codeActions.js';
import { HbsLintFixAllProvider } from './fixAll.js';
import { registerLintWorkspaceCommand } from './commands/lintWorkspace.js';
import { registerGenerateSchemaCommand } from './commands/generateSchema.js';

let diagnosticCollection: vscode.DiagnosticCollection;
let outputChannel: vscode.OutputChannel;
let currentConfig: HbsLintConfig | null = null;
let currentSchema: SchemaDefinition | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | undefined;

function getWorkspaceRoot(): string | undefined {
    return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

function reloadConfig(): void {
    const root = getWorkspaceRoot();
    if (root) {
        currentConfig = loadConfig(root);
        // Load schema if configured
        const resolved = resolveConfig(currentConfig, '');
        if (resolved.schemaFile) {
            const schemaPath = path.resolve(root, resolved.schemaFile);
            currentSchema = loadSchema(schemaPath);
        } else {
            currentSchema = null;
        }
        outputChannel.appendLine('Config reloaded');
    }
}

function lintDocument(document: vscode.TextDocument): void {
    if (!shouldLintDocument(document)) return;

    const text = document.getText();
    const filePath = document.uri.fsPath;
    const resolved = resolveConfig(currentConfig, filePath);

    // Auto-detect DOCX mode from content if not explicitly configured
    if (currentConfig?.docxMode === undefined) {
        resolved.docxMode = isDocxTemplate(text);
    }

    clearFixes(document.uri.toString());
    const messages = lint(text, resolved, currentSchema ?? undefined);

    const diagnostics = messages.map(msg => {
        storeFix(document.uri.toString(), msg);
        return toDiagnostic(msg);
    });

    diagnosticCollection.set(document.uri, diagnostics);
}

function lintAllOpen(): void {
    for (const document of vscode.workspace.textDocuments) {
        lintDocument(document);
    }
}

export function activate(context: vscode.ExtensionContext): void {
    outputChannel = vscode.window.createOutputChannel('HBS Lint');
    outputChannel.appendLine('hbs-lint active');
    context.subscriptions.push(outputChannel);

    diagnosticCollection = vscode.languages.createDiagnosticCollection('hbs-lint');
    context.subscriptions.push(diagnosticCollection);

    reloadConfig();

    const resolvedCfg = resolveConfig(currentConfig, '');
    const lintOnType = resolvedCfg.lintOn === 'type';

    // Lint on open
    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(doc => lintDocument(doc))
    );

    // Lint on save
    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument(doc => lintDocument(doc))
    );

    // Lint on type (debounced)
    if (lintOnType) {
        context.subscriptions.push(
            vscode.workspace.onDidChangeTextDocument(event => {
                if (debounceTimer) clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => lintDocument(event.document), 300);
            })
        );
    }

    // Clear diagnostics on close
    context.subscriptions.push(
        vscode.workspace.onDidCloseTextDocument(doc => {
            diagnosticCollection.delete(doc.uri);
            clearFixes(doc.uri.toString());
        })
    );

    // Watch for config changes
    const configWatcher = vscode.workspace.createFileSystemWatcher('**/.hbslintrc.json');
    configWatcher.onDidChange(() => { reloadConfig(); lintAllOpen(); });
    configWatcher.onDidCreate(() => { reloadConfig(); lintAllOpen(); });
    configWatcher.onDidDelete(() => { currentConfig = null; lintAllOpen(); });
    context.subscriptions.push(configWatcher);

    // Register code action providers
    const docSelector: vscode.DocumentSelector = [
        { language: 'handlebars' },
        { pattern: '**/*.hbs' },
        { pattern: '**/*.handlebars' },
    ];

    context.subscriptions.push(
        vscode.languages.registerCodeActionsProvider(
            docSelector,
            new HbsLintCodeActionProvider(),
            { providedCodeActionKinds: HbsLintCodeActionProvider.providedCodeActionKinds },
        )
    );

    context.subscriptions.push(
        vscode.languages.registerCodeActionsProvider(
            docSelector,
            new HbsLintFixAllProvider(),
            { providedCodeActionKinds: HbsLintFixAllProvider.providedCodeActionKinds },
        )
    );

    // Register commands
    registerLintWorkspaceCommand(
        context,
        diagnosticCollection,
        () => currentConfig,
        () => currentSchema,
    );
    registerGenerateSchemaCommand(context);

    // Lint all currently open documents
    lintAllOpen();
}

export function deactivate(): void {
    if (debounceTimer) clearTimeout(debounceTimer);
}
