import * as assert from 'assert';
import { extractExpressions } from '../../parser/expressionExtractor.js';
import { ExpressionType } from '../../parser/types.js';

describe('expressionExtractor', () => {
    it('extracts simple mustache expression', () => {
        const { expressions: exprs } = extractExpressions('{{foo}}');
        assert.strictEqual(exprs.length, 1);
        assert.strictEqual(exprs[0].type, ExpressionType.MustacheStatement);
        assert.strictEqual(exprs[0].name, 'foo');
        assert.strictEqual(exprs[0].raw, '{{foo}}');
    });

    it('extracts dotted path', () => {
        const { expressions: exprs } = extractExpressions('{{foo.bar.baz}}');
        assert.strictEqual(exprs.length, 1);
        assert.strictEqual(exprs[0].name, 'foo.bar.baz');
    });

    it('extracts raw (triple-stache) expression', () => {
        const { expressions: exprs } = extractExpressions('{{{rawContent}}}');
        assert.strictEqual(exprs.length, 1);
        assert.strictEqual(exprs[0].type, ExpressionType.RawMustacheStatement);
        assert.strictEqual(exprs[0].name, 'rawContent');
    });

    it('extracts block statement', () => {
        const { expressions: exprs } = extractExpressions('{{#if condition}}hello{{/if}}');
        assert.strictEqual(exprs.length, 2);
        assert.strictEqual(exprs[0].type, ExpressionType.BlockStatement);
        assert.strictEqual(exprs[0].name, 'if');
        assert.deepStrictEqual(exprs[0].params, ['condition']);
        assert.strictEqual(exprs[1].type, ExpressionType.CloseBlock);
        assert.strictEqual(exprs[1].name, 'if');
    });

    it('extracts partial statement', () => {
        const { expressions: exprs } = extractExpressions('{{>header}}');
        assert.strictEqual(exprs.length, 1);
        assert.strictEqual(exprs[0].type, ExpressionType.PartialStatement);
        assert.strictEqual(exprs[0].name, 'header');
    });

    it('extracts comment statement', () => {
        const { expressions: exprs } = extractExpressions('{{! this is a comment }}');
        assert.strictEqual(exprs.length, 1);
        assert.strictEqual(exprs[0].type, ExpressionType.CommentStatement);
        assert.strictEqual(exprs[0].name, 'this is a comment');
    });

    it('extracts long-form comment', () => {
        const { expressions: exprs } = extractExpressions('{{!-- long comment --}}');
        assert.strictEqual(exprs.length, 1);
        assert.strictEqual(exprs[0].type, ExpressionType.CommentStatement);
    });

    it('parses hash arguments', () => {
        const { expressions: exprs } = extractExpressions('{{helper key="value" num=42}}');
        assert.strictEqual(exprs.length, 1);
        assert.strictEqual(exprs[0].name, 'helper');
        assert.strictEqual(exprs[0].hash['key'], 'value');
        assert.strictEqual(exprs[0].hash['num'], '42');
    });

    it('parses sub-expressions', () => {
        const { expressions: exprs } = extractExpressions('{{helper (sub arg1 arg2)}}');
        assert.strictEqual(exprs.length, 1);
        assert.strictEqual(exprs[0].subExpressions.length, 1);
        assert.strictEqual(exprs[0].subExpressions[0].name, 'sub');
        assert.deepStrictEqual(exprs[0].subExpressions[0].params, ['arg1', 'arg2']);
    });

    it('tracks position on first line', () => {
        const { expressions: exprs } = extractExpressions('hello {{foo}} world');
        assert.strictEqual(exprs.length, 1);
        assert.strictEqual(exprs[0].range.start.line, 0);
        assert.strictEqual(exprs[0].range.start.column, 6);
        assert.strictEqual(exprs[0].range.end.line, 0);
        assert.strictEqual(exprs[0].range.end.column, 13);
    });

    it('tracks position across multiple lines', () => {
        const text = 'line one\nline two {{foo}}\nline three';
        const { expressions: exprs } = extractExpressions(text);
        assert.strictEqual(exprs.length, 1);
        assert.strictEqual(exprs[0].range.start.line, 1);
        assert.strictEqual(exprs[0].range.start.column, 9);
        assert.strictEqual(exprs[0].range.end.line, 1);
        assert.strictEqual(exprs[0].range.end.column, 16);
    });

    it('extracts multiple expressions', () => {
        const { expressions: exprs } = extractExpressions('{{a}} some text {{b}} more {{c}}');
        assert.strictEqual(exprs.length, 3);
        assert.strictEqual(exprs[0].name, 'a');
        assert.strictEqual(exprs[1].name, 'b');
        assert.strictEqual(exprs[2].name, 'c');
    });

    it('handles each with params', () => {
        const { expressions: exprs } = extractExpressions('{{#each items}}{{name}}{{/each}}');
        assert.strictEqual(exprs.length, 3);
        assert.strictEqual(exprs[0].type, ExpressionType.BlockStatement);
        assert.strictEqual(exprs[0].name, 'each');
        assert.deepStrictEqual(exprs[0].params, ['items']);
    });

    it('handles inverse blocks (^)', () => {
        const { expressions: exprs } = extractExpressions('{{^if condition}}fallback{{/if}}');
        assert.strictEqual(exprs.length, 2);
        assert.strictEqual(exprs[0].type, ExpressionType.BlockStatement);
        assert.strictEqual(exprs[0].name, 'if');
    });

    it('handles else', () => {
        const { expressions: exprs } = extractExpressions('{{#if x}}a{{else}}b{{/if}}');
        assert.strictEqual(exprs.length, 3);
        assert.strictEqual(exprs[0].name, 'if');
        assert.strictEqual(exprs[1].name, 'else');
        assert.strictEqual(exprs[2].name, 'if');
        assert.strictEqual(exprs[2].type, ExpressionType.CloseBlock);
    });

    it('handles parent path (../)', () => {
        const { expressions: exprs } = extractExpressions('{{../parentField}}');
        assert.strictEqual(exprs.length, 1);
        assert.strictEqual(exprs[0].name, '../parentField');
    });

    it('handles this reference', () => {
        const { expressions: exprs } = extractExpressions('{{this}}');
        assert.strictEqual(exprs.length, 1);
        assert.strictEqual(exprs[0].name, 'this');
    });

    it('handles @index data variable', () => {
        const { expressions: exprs } = extractExpressions('{{@index}}');
        assert.strictEqual(exprs.length, 1);
        assert.strictEqual(exprs[0].name, '@index');
    });

    it('handles expression with whitespace', () => {
        const { expressions: exprs } = extractExpressions('{{ foo }}');
        assert.strictEqual(exprs.length, 1);
        assert.strictEqual(exprs[0].name, 'foo');
    });

    it('returns empty for text without expressions', () => {
        const { expressions: exprs } = extractExpressions('just plain text');
        assert.strictEqual(exprs.length, 0);
    });

    it('handles empty input', () => {
        const { expressions: exprs } = extractExpressions('');
        assert.strictEqual(exprs.length, 0);
    });

    it('detects unclosed expressions', () => {
        const { expressions: exprs, unclosedExpressions } = extractExpressions('hello {{ something');
        assert.strictEqual(exprs.length, 0);
        assert.strictEqual(unclosedExpressions.length, 1);
        assert.strictEqual(unclosedExpressions[0].start.line, 0);
        assert.strictEqual(unclosedExpressions[0].start.column, 6);
    });
});
