import * as assert from 'assert';
import { parse } from '../../parser/index.js';
import { docx001 } from '../../rules/docx001.js';
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

describe('DOCX001: Expression split across <w:r> runs', () => {
    it('flags expression split across two runs', () => {
        const text = '<w:p><w:r><w:t>{{site</w:t></w:r><w:r><w:t>Id}}</w:t></w:r></w:p>';
        const msgs = docx001.check(makeContext(text));
        assert.strictEqual(msgs.length, 1);
        assert.strictEqual(msgs[0].ruleCode, 'DOCX001');
        assert.ok(msgs[0].fix);
        assert.strictEqual(msgs[0].fix!.safe, false);
    });

    it('does not flag expression in a single run', () => {
        const text = '<w:p><w:r><w:t>{{siteId}}</w:t></w:r></w:p>';
        const msgs = docx001.check(makeContext(text));
        assert.strictEqual(msgs.length, 0);
    });

    it('does not flag when docxMode is off', () => {
        const text = '<w:p><w:r><w:t>{{site</w:t></w:r><w:r><w:t>Id}}</w:t></w:r></w:p>';
        const ctx = makeContext(text);
        ctx.docxMode = false;
        const msgs = docx001.check(ctx);
        assert.strictEqual(msgs.length, 0);
    });

    it('does not flag text without w:r elements', () => {
        const text = '{{siteId}}';
        const msgs = docx001.check(makeContext(text));
        assert.strictEqual(msgs.length, 0);
    });
});
