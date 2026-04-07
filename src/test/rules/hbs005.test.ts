import * as assert from 'assert';
import { parse } from '../../parser/index.js';
import { hbs005 } from '../../rules/hbs005.js';
import { RuleContext } from '../../rules/types.js';
import { SchemaDefinition } from '../../schema/types.js';

const testSchema: SchemaDefinition = {
    siteId: 'string',
    samples: {
        type: 'array',
        items: {
            type: 'object',
            fields: {
                depth: 'number',
                colorCode: 'string',
            },
        },
    },
};

function makeContext(text: string, schema?: SchemaDefinition): RuleContext {
    return {
        text,
        parseResult: parse(text),
        helpers: [],
        ruleSeverities: {},
        docxMode: false,
        schema,
    };
}

describe('HBS005: Field not found in data schema', () => {
    it('flags unknown field at root', () => {
        const msgs = hbs005.check(makeContext('{{unknownField}}', testSchema));
        assert.strictEqual(msgs.length, 1);
        assert.ok(msgs[0].message.includes('unknownField'));
    });

    it('does not flag known field at root', () => {
        const msgs = hbs005.check(makeContext('{{siteId}}', testSchema));
        assert.strictEqual(msgs.length, 0);
    });

    it('does not flag when no schema provided', () => {
        const msgs = hbs005.check(makeContext('{{unknownField}}'));
        assert.strictEqual(msgs.length, 0);
    });

    it('flags unknown field inside #each scope', () => {
        const msgs = hbs005.check(makeContext('{{#each samples}}{{badField}}{{/each}}', testSchema));
        assert.ok(msgs.length >= 1);
        assert.ok(msgs.some(m => m.message.includes('badField')));
    });

    it('does not flag known child field inside #each', () => {
        const msgs = hbs005.check(makeContext('{{#each samples}}{{depth}}{{/each}}', testSchema));
        assert.strictEqual(msgs.length, 0);
    });

    it('does not flag @index inside #each', () => {
        const msgs = hbs005.check(makeContext('{{#each samples}}{{@index}}{{/each}}', testSchema));
        assert.strictEqual(msgs.length, 0);
    });

    it('does not flag this reference', () => {
        const msgs = hbs005.check(makeContext('{{this}}', testSchema));
        assert.strictEqual(msgs.length, 0);
    });
});
