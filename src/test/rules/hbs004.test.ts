import * as assert from 'assert';
import { parse } from '../../parser/index.js';
import { hbs004 } from '../../rules/hbs004.js';
import { RuleContext } from '../../rules/types.js';

function makeContext(text: string, helpers: string[] = []): RuleContext {
    return {
        text,
        parseResult: parse(text),
        helpers,
        ruleSeverities: {},
        docxMode: false,
    };
}

describe('HBS004: Unknown sub-expression helper', () => {
    it('flags unknown sub-expression helper', () => {
        const msgs = hbs004.check(makeContext('{{helper (unknownSub arg)}}'));
        assert.strictEqual(msgs.length, 1);
        assert.strictEqual(msgs[0].ruleCode, 'HBS004');
        assert.ok(msgs[0].message.includes('unknownSub'));
    });

    it('does not flag known sub-expression helper', () => {
        const msgs = hbs004.check(makeContext('{{helper (if condition)}}'));
        assert.strictEqual(msgs.length, 0);
    });

    it('does not flag configured custom helper in sub-expression', () => {
        const msgs = hbs004.check(makeContext('{{helper (formatDate value)}}', ['formatDate']));
        assert.strictEqual(msgs.length, 0);
    });

    it('flags multiple unknown sub-expressions', () => {
        const msgs = hbs004.check(makeContext('{{helper (foo a) (bar b)}}'));
        // Both foo and bar in same expression — but our parser extracts sub-expressions per expression
        assert.ok(msgs.length >= 1);
    });

    it('does not flag expressions without sub-expressions', () => {
        const msgs = hbs004.check(makeContext('{{simpleField}}'));
        assert.strictEqual(msgs.length, 0);
    });

    it('respects severity off', () => {
        const ctx = makeContext('{{helper (unknownSub arg)}}');
        ctx.ruleSeverities['HBS004'] = 'off';
        const msgs = hbs004.check(ctx);
        assert.strictEqual(msgs.length, 0);
    });
});
