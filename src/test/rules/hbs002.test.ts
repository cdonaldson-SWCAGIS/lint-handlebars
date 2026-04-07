import * as assert from 'assert';
import { parse } from '../../parser/index.js';
import { hbs002 } from '../../rules/hbs002.js';
import { RuleContext } from '../../rules/types.js';

function makeContext(text: string): RuleContext {
    return {
        text,
        parseResult: parse(text),
        helpers: [],
        ruleSeverities: {},
        docxMode: false,
    };
}

describe('HBS002: Unclosed block helper', () => {
    it('flags unclosed block', () => {
        const msgs = hbs002.check(makeContext('{{#if x}}content'));
        assert.strictEqual(msgs.length, 1);
        assert.strictEqual(msgs[0].ruleCode, 'HBS002');
        assert.ok(msgs[0].message.includes('if'));
    });

    it('does not flag closed block', () => {
        const msgs = hbs002.check(makeContext('{{#if x}}content{{/if}}'));
        assert.strictEqual(msgs.length, 0);
    });

    it('flags multiple unclosed blocks', () => {
        const msgs = hbs002.check(makeContext('{{#if a}}{{#each b}}'));
        assert.strictEqual(msgs.length, 2);
    });

    it('respects severity off', () => {
        const ctx = makeContext('{{#if x}}content');
        ctx.ruleSeverities['HBS002'] = 'off';
        const msgs = hbs002.check(ctx);
        assert.strictEqual(msgs.length, 0);
    });
});
