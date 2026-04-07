import * as assert from 'assert';
import { parse } from '../../parser/index.js';
import { docx002 } from '../../rules/docx002.js';
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

describe('DOCX002: <w:proofErr> near expression', () => {
    it('flags proofErr in same paragraph as expression', () => {
        const text = '<w:p><w:proofErr w:type="spellStart"/><w:r><w:t>{{siteId}}</w:t></w:r><w:proofErr w:type="spellEnd"/></w:p>';
        const msgs = docx002.check(makeContext(text));
        assert.ok(msgs.length >= 1);
        assert.strictEqual(msgs[0].ruleCode, 'DOCX002');
        assert.ok(msgs[0].fix);
        assert.strictEqual(msgs[0].fix!.safe, true);
    });

    it('does not flag when no proofErr elements', () => {
        const text = '<w:p><w:r><w:t>{{siteId}}</w:t></w:r></w:p>';
        const msgs = docx002.check(makeContext(text));
        assert.strictEqual(msgs.length, 0);
    });

    it('does not flag when docxMode is off', () => {
        const text = '<w:p><w:proofErr w:type="spellStart"/><w:r><w:t>{{siteId}}</w:t></w:r></w:p>';
        const ctx = makeContext(text);
        ctx.docxMode = false;
        const msgs = docx002.check(ctx);
        assert.strictEqual(msgs.length, 0);
    });
});
