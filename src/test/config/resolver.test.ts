import * as assert from 'assert';
import { resolveConfig } from '../../config/resolver.js';
import { HbsLintConfig } from '../../config/types.js';

describe('resolveConfig', () => {
    it('returns defaults when config is null', () => {
        const resolved = resolveConfig(null, 'test.hbs');
        assert.strictEqual(resolved.docxMode, true);
        assert.strictEqual(resolved.lintOn, 'save');
        assert.strictEqual(resolved.rules['HBS001'], 'error');
    });

    it('merges custom helpers', () => {
        const config: HbsLintConfig = { helpers: ['formatDate', 'padZero'] };
        const resolved = resolveConfig(config, 'test.hbs');
        assert.deepStrictEqual(resolved.helpers, ['formatDate', 'padZero']);
    });

    it('overrides rule severities', () => {
        const config: HbsLintConfig = { rules: { HBS001: 'warning', HBS005: 'off' } };
        const resolved = resolveConfig(config, 'test.hbs');
        assert.strictEqual(resolved.rules['HBS001'], 'warning');
        assert.strictEqual(resolved.rules['HBS005'], 'off');
        // Other rules keep defaults
        assert.strictEqual(resolved.rules['HBS002'], 'error');
    });

    it('applies file-pattern overrides', () => {
        const config: HbsLintConfig = {
            overrides: [
                { files: ['**/partials/**'], rules: { DOCX001: 'off' } },
            ],
        };
        const resolved = resolveConfig(config, 'templates/partials/header.hbs');
        assert.strictEqual(resolved.rules['DOCX001'], 'off');
    });

    it('does not apply non-matching overrides', () => {
        const config: HbsLintConfig = {
            overrides: [
                { files: ['**/partials/**'], rules: { DOCX001: 'off' } },
            ],
        };
        const resolved = resolveConfig(config, 'templates/main.hbs');
        assert.strictEqual(resolved.rules['DOCX001'], 'error');
    });

    it('sets schemaFile', () => {
        const config: HbsLintConfig = { schemaFile: './data/schema.json' };
        const resolved = resolveConfig(config, 'test.hbs');
        assert.strictEqual(resolved.schemaFile, './data/schema.json');
    });

    it('sets lintOn', () => {
        const config: HbsLintConfig = { lintOn: 'type' };
        const resolved = resolveConfig(config, 'test.hbs');
        assert.strictEqual(resolved.lintOn, 'type');
    });
});
