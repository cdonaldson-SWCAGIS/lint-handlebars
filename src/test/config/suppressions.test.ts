import * as assert from 'assert';
import { parse } from '../../parser/index.js';
import { getSuppressions, isRuleSuppressed } from '../../config/suppressions.js';

describe('suppressions', () => {
    describe('getSuppressions', () => {
        it('parses block disable comment', () => {
            const result = parse('{{! hbs-lint-disable DOCX001 }}');
            const suppressions = getSuppressions(result.expressions);
            assert.strictEqual(suppressions.length, 1);
            assert.deepStrictEqual(suppressions[0].rules, ['DOCX001']);
            assert.strictEqual(suppressions[0].type, 'block');
        });

        it('parses multiple rules in disable comment', () => {
            const result = parse('{{! hbs-lint-disable DOCX001 HBS003 }}');
            const suppressions = getSuppressions(result.expressions);
            assert.strictEqual(suppressions.length, 1);
            assert.deepStrictEqual(suppressions[0].rules, ['DOCX001', 'HBS003']);
        });

        it('parses next-line disable comment', () => {
            const result = parse('{{! hbs-lint-disable-next-line HBS005 }}');
            const suppressions = getSuppressions(result.expressions);
            assert.strictEqual(suppressions.length, 1);
            assert.strictEqual(suppressions[0].type, 'next-line');
            assert.deepStrictEqual(suppressions[0].rules, ['HBS005']);
        });

        it('ignores regular comments', () => {
            const result = parse('{{! just a comment }}');
            const suppressions = getSuppressions(result.expressions);
            assert.strictEqual(suppressions.length, 0);
        });
    });

    describe('isRuleSuppressed', () => {
        it('suppresses rule on next line for next-line disable', () => {
            const result = parse('{{! hbs-lint-disable-next-line HBS005 }}\n{{fieldName}}');
            const suppressions = getSuppressions(result.expressions);
            assert.strictEqual(isRuleSuppressed('HBS005', 1, suppressions), true);
        });

        it('does not suppress wrong rule', () => {
            const result = parse('{{! hbs-lint-disable-next-line HBS005 }}\n{{fieldName}}');
            const suppressions = getSuppressions(result.expressions);
            assert.strictEqual(isRuleSuppressed('HBS003', 1, suppressions), false);
        });

        it('suppresses rule at and after block disable line', () => {
            const result = parse('{{! hbs-lint-disable DOCX001 }}\n{{expr1}}\n{{expr2}}');
            const suppressions = getSuppressions(result.expressions);
            assert.strictEqual(isRuleSuppressed('DOCX001', 0, suppressions), true);
            assert.strictEqual(isRuleSuppressed('DOCX001', 1, suppressions), true);
            assert.strictEqual(isRuleSuppressed('DOCX001', 2, suppressions), true);
        });

        it('next-line does not suppress same line', () => {
            const result = parse('{{! hbs-lint-disable-next-line HBS005 }}');
            const suppressions = getSuppressions(result.expressions);
            assert.strictEqual(isRuleSuppressed('HBS005', 0, suppressions), false);
        });
    });
});
