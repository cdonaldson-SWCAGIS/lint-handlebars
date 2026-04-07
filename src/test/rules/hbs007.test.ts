import * as assert from 'assert';
import { parse } from '../../parser/index.js';
import { hbs007 } from '../../rules/hbs007.js';
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

describe('HBS007: Child field not on parent type', () => {
    it('flags non-existent child field inside #each', () => {
        const msgs = hbs007.check(makeContext('{{#each samples}}{{badChild}}{{/each}}', testSchema));
        assert.ok(msgs.length >= 1);
        assert.ok(msgs.some(m => m.message.includes('badChild')));
    });

    it('does not flag valid child field inside #each', () => {
        const msgs = hbs007.check(makeContext('{{#each samples}}{{depth}}{{/each}}', testSchema));
        assert.strictEqual(msgs.length, 0);
    });

    it('does not flag when no schema provided', () => {
        const msgs = hbs007.check(makeContext('{{#each samples}}{{badChild}}{{/each}}'));
        assert.strictEqual(msgs.length, 0);
    });

    it('does not flag fields at root level', () => {
        const msgs = hbs007.check(makeContext('{{unknownAtRoot}}', testSchema));
        assert.strictEqual(msgs.length, 0);
    });
});
