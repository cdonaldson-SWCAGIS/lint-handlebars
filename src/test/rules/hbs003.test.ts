import * as assert from 'assert';
import { parse } from '../../parser/index.js';
import { hbs003 } from '../../rules/hbs003.js';
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

describe('HBS003: Unknown helper', () => {
    it('flags unknown block helper', () => {
        const msgs = hbs003.check(makeContext('{{#customHelper items}}{{/customHelper}}'));
        assert.strictEqual(msgs.length, 1);
        assert.strictEqual(msgs[0].ruleCode, 'HBS003');
        assert.ok(msgs[0].message.includes('customHelper'));
    });

    it('does not flag built-in helpers', () => {
        const msgs = hbs003.check(makeContext('{{#if x}}{{/if}}{{#each items}}{{/each}}{{#with obj}}{{/with}}'));
        assert.strictEqual(msgs.length, 0);
    });

    it('does not flag configured custom helpers', () => {
        const msgs = hbs003.check(makeContext('{{#customHelper items}}{{/customHelper}}', ['customHelper']));
        assert.strictEqual(msgs.length, 0);
    });

    it('flags unknown mustache with params (helper call)', () => {
        const msgs = hbs003.check(makeContext('{{formatDate value}}'));
        assert.strictEqual(msgs.length, 1);
        assert.ok(msgs[0].message.includes('formatDate'));
    });

    it('does not flag simple field references (no params)', () => {
        const msgs = hbs003.check(makeContext('{{fieldName}}'));
        assert.strictEqual(msgs.length, 0);
    });

    it('does not flag dotted paths', () => {
        const msgs = hbs003.check(makeContext('{{foo.bar.baz}}'));
        assert.strictEqual(msgs.length, 0);
    });

    it('flags mustache with hash args as helper', () => {
        const msgs = hbs003.check(makeContext('{{myHelper key="val"}}'));
        assert.strictEqual(msgs.length, 1);
    });

    it('respects severity off', () => {
        const ctx = makeContext('{{#unknownHelper}}{{/unknownHelper}}');
        ctx.ruleSeverities['HBS003'] = 'off';
        const msgs = hbs003.check(ctx);
        assert.strictEqual(msgs.length, 0);
    });
});
