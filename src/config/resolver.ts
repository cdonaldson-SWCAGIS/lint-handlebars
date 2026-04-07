import { HbsLintConfig, ResolvedConfig } from './types.js';
import { DEFAULT_CONFIG } from './defaults.js';

/**
 * Convert a simple glob pattern to a regex.
 * Supports *, **, and ? wildcards.
 */
function globToRegex(pattern: string): RegExp {
    let regex = '';
    let i = 0;

    while (i < pattern.length) {
        const ch = pattern[i];
        if (ch === '*') {
            if (i + 1 < pattern.length && pattern[i + 1] === '*') {
                // ** matches any path segment(s)
                if (i + 2 < pattern.length && pattern[i + 2] === '/') {
                    regex += '(?:.*/)?';
                    i += 3;
                } else {
                    regex += '.*';
                    i += 2;
                }
            } else {
                // * matches anything except /
                regex += '[^/]*';
                i++;
            }
        } else if (ch === '?') {
            regex += '[^/]';
            i++;
        } else if (ch === '.') {
            regex += '\\.';
            i++;
        } else if (ch === '\\') {
            regex += '/';
            i++;
        } else {
            regex += ch;
            i++;
        }
    }

    return new RegExp(`^${regex}$`);
}

/**
 * Check if a file path matches a glob pattern.
 */
function matchesGlob(filePath: string, pattern: string): boolean {
    // Normalize to forward slashes
    const normalized = filePath.replace(/\\/g, '/');
    const regex = globToRegex(pattern);
    return regex.test(normalized);
}

/**
 * Resolve config for a specific file by merging defaults, base config, and matching overrides.
 */
export function resolveConfig(baseConfig: HbsLintConfig | null, filePath: string): ResolvedConfig {
    const resolved: ResolvedConfig = { ...DEFAULT_CONFIG, rules: { ...DEFAULT_CONFIG.rules } };

    if (!baseConfig) return resolved;

    if (baseConfig.helpers) {
        resolved.helpers = [...baseConfig.helpers];
    }
    if (baseConfig.schemaFile !== undefined) {
        resolved.schemaFile = baseConfig.schemaFile;
    }
    if (baseConfig.docxMode !== undefined) {
        resolved.docxMode = baseConfig.docxMode;
    }
    if (baseConfig.lintOn !== undefined) {
        resolved.lintOn = baseConfig.lintOn;
    }
    if (baseConfig.rules) {
        for (const [code, severity] of Object.entries(baseConfig.rules)) {
            resolved.rules[code] = severity;
        }
    }

    // Apply matching overrides
    if (baseConfig.overrides) {
        for (const override of baseConfig.overrides) {
            const matches = override.files.some(pattern => matchesGlob(filePath, pattern));
            if (matches) {
                for (const [code, severity] of Object.entries(override.rules)) {
                    resolved.rules[code] = severity;
                }
            }
        }
    }

    return resolved;
}
