import * as assert from 'assert';
import { parse } from '../../parser/index.js';
import { hbs006 } from '../../rules/hbs006.js';
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
            },
        },
    },
    coordinates: {
        type: 'object',
        fields: {
            latitude: 'number',
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

describe('HBS006: {{#each}} on non-array', () => {
    it('flags #each on an object field', () => {
        const msgs = hbs006.check(makeContext('{{#each coordinates}}{{latitude}}{{/each}}', testSchema));
        assert.strictEqual(msgs.length, 1);
        assert.ok(msgs[0].message.includes('coordinates'));
    });

    it('flags #each on a scalar field', () => {
        const msgs = hbs006.check(makeContext('{{#each siteId}}{{this}}{{/each}}', testSchema));
        assert.strictEqual(msgs.length, 1);
    });

    it('does not flag #each on an array field', () => {
        const msgs = hbs006.check(makeContext('{{#each samples}}{{depth}}{{/each}}', testSchema));
        assert.strictEqual(msgs.length, 0);
    });

    it('does not flag when no schema provided', () => {
        const msgs = hbs006.check(makeContext('{{#each anything}}{{/each}}'));
        assert.strictEqual(msgs.length, 0);
    });
});
