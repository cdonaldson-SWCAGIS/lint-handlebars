import * as assert from 'assert';
import { parse } from '../../parser/index.js';
import { docx003 } from '../../rules/docx003.js';
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

describe('DOCX003: Revision tracking near expression', () => {
    it('flags rsid attributes on run containing expression', () => {
        const text = '<w:p><w:r w:rsidR="00AB1234"><w:t>{{siteId}}</w:t></w:r></w:p>';
        const msgs = docx003.check(makeContext(text));
        assert.ok(msgs.length >= 1);
        assert.strictEqual(msgs[0].ruleCode, 'DOCX003');
        assert.ok(msgs[0].fix);
        assert.strictEqual(msgs[0].fix!.safe, true);
    });

    it('does not flag when no rsid attributes', () => {
        const text = '<w:p><w:r><w:t>{{siteId}}</w:t></w:r></w:p>';
        const msgs = docx003.check(makeContext(text));
        assert.strictEqual(msgs.length, 0);
    });

    it('does not flag when docxMode is off', () => {
        const text = '<w:p><w:r w:rsidR="00AB1234"><w:t>{{siteId}}</w:t></w:r></w:p>';
        const ctx = makeContext(text);
        ctx.docxMode = false;
        const msgs = docx003.check(ctx);
        assert.strictEqual(msgs.length, 0);
    });
});
