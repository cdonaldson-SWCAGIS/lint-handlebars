import * as assert from 'assert';
import { parse } from '../../parser/index.js';
import { docx004 } from '../../rules/docx004.js';
import { RuleContext } from '../../rules/types.js';

function makeContext(text: string): RuleContext {
    return {
        text,
        parseResult: parse(text),
        helpers: [],
        ruleSeverities: {},
        docxMode: true,
    };
}

describe('DOCX004: Block helper spans table row boundaries', () => {
    it('flags block spanning two table rows', () => {
        const text = '<w:tbl><w:tr><w:tc><w:p><w:r><w:t>{{#each items}}</w:t></w:r></w:p></w:tc></w:tr><w:tr><w:tc><w:p><w:r><w:t>{{/each}}</w:t></w:r></w:p></w:tc></w:tr></w:tbl>';
        const msgs = docx004.check(makeContext(text));
        assert.strictEqual(msgs.length, 1);
        assert.strictEqual(msgs[0].ruleCode, 'DOCX004');
    });

    it('does not flag block within same row', () => {
        const text = '<w:tbl><w:tr><w:tc><w:p><w:r><w:t>{{#if x}}yes{{/if}}</w:t></w:r></w:p></w:tc></w:tr></w:tbl>';
        const msgs = docx004.check(makeContext(text));
        assert.strictEqual(msgs.length, 0);
    });

    it('does not flag when no table rows', () => {
        const text = '<w:p><w:r><w:t>{{#each items}}{{name}}{{/each}}</w:t></w:r></w:p>';
        const msgs = docx004.check(makeContext(text));
        assert.strictEqual(msgs.length, 0);
    });

    it('does not flag when docxMode is off', () => {
        const text = '<w:tbl><w:tr><w:tc><w:p><w:r><w:t>{{#each items}}</w:t></w:r></w:p></w:tc></w:tr><w:tr><w:tc><w:p><w:r><w:t>{{/each}}</w:t></w:r></w:p></w:tc></w:tr></w:tbl>';
        const ctx = makeContext(text);
        ctx.docxMode = false;
        const msgs = docx004.check(ctx);
        assert.strictEqual(msgs.length, 0);
    });
});
