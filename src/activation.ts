import * as vscode from 'vscode';

/**
 * Determine if a document should be linted.
 * Activates for:
 *   - .hbs, .handlebars files
 *   - Files inside jsreport templates/ or data/ directories
 *   - Files containing both {{ and <w: (DOCX template XML)
 */
export function shouldLintDocument(document: vscode.TextDocument): boolean {
    // Language ID check
    if (document.languageId === 'handlebars') {
        return true;
    }

    const filePath = document.uri.fsPath.replace(/\\/g, '/');

    // Extension check
    if (filePath.endsWith('.hbs') || filePath.endsWith('.handlebars')) {
        return true;
    }

    // jsreport directory check
    if (/\/templates\//.test(filePath) || /\/data\//.test(filePath)) {
        const text = document.getText();
        if (text.includes('{{')) {
            return true;
        }
    }

    // DOCX template XML check
    const text = document.getText();
    if (text.includes('{{') && text.includes('<w:')) {
        return true;
    }

    return false;
}

/**
 * Determine if a document is DOCX template XML.
 */
export function isDocxTemplate(text: string): boolean {
    return text.includes('{{') && text.includes('<w:');
}
