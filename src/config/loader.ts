import * as fs from 'fs';
import * as path from 'path';
import { HbsLintConfig } from './types.js';

/**
 * Load .hbslintrc.json from the given workspace root.
 * Returns null if the file doesn't exist or is invalid.
 */
export function loadConfig(workspaceRoot: string): HbsLintConfig | null {
    const configPath = path.join(workspaceRoot, '.hbslintrc.json');
    try {
        const content = fs.readFileSync(configPath, 'utf-8');
        return JSON.parse(content) as HbsLintConfig;
    } catch {
        return null;
    }
}
