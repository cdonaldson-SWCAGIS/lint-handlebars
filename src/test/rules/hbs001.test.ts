import * as assert from 'assert';
import { parse } from '../../parser/index.js';
import { hbs001 } from '../../rules/hbs001.js';
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

describe('HBS001: Mismatched block closer', () => {
    it('flags mismatched closer', () => {
        const msgs = hbs001.check(makeContext('{{#if x}}content{{/unless}}'));
        assert.strictEqual(msgs.length, 1);
        assert.strictEqual(msgs[0].ruleCode, 'HBS001');
        assert.ok(msgs[0].message.includes('if'));
        assert.ok(msgs[0].message.includes('unless'));
        assert.ok(msgs[0].fix);
        assert.strictEqual(msgs[0].fix!.safe, false);
    });

    it('does not flag matching closer', () => {
        const msgs = hbs001.check(makeContext('{{#if x}}content{{/if}}'));
        assert.strictEqual(msgs.length, 0);
    });

    it('does not flag unclosed blocks (that is HBS002)', () => {
        const msgs = hbs001.check(makeContext('{{#if x}}content'));
        assert.strictEqual(msgs.length, 0);
    });

    it('respects severity off', () => {
        const ctx = makeContext('{{#if x}}content{{/unless}}');
        ctx.ruleSeverities['HBS001'] = 'off';
        const msgs = hbs001.check(ctx);
        assert.strictEqual(msgs.length, 0);
    });
});
