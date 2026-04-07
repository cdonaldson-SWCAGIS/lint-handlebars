import * as assert from 'assert';
import { extractExpressions } from '../../parser/expressionExtractor.js';
import { matchBlocks } from '../../parser/blockMatcher.js';

describe('blockMatcher', () => {
    it('matches simple block', () => {
        const { expressions: exprs } = extractExpressions('{{#if x}}content{{/if}}');
        const blocks = matchBlocks(exprs);
        assert.strictEqual(blocks.length, 1);
        assert.strictEqual(blocks[0].open.name, 'if');
        assert.strictEqual(blocks[0].close?.name, 'if');
        assert.strictEqual(blocks[0].mismatch, false);
    });

    it('detects mismatched block closer', () => {
        const { expressions: exprs } = extractExpressions('{{#if x}}content{{/unless}}');
        const blocks = matchBlocks(exprs);
        assert.strictEqual(blocks.length, 1);
        assert.strictEqual(blocks[0].open.name, 'if');
        assert.strictEqual(blocks[0].close?.name, 'unless');
        assert.strictEqual(blocks[0].mismatch, true);
    });

    it('detects unclosed block', () => {
        const { expressions: exprs } = extractExpressions('{{#if x}}content');
        const blocks = matchBlocks(exprs);
        assert.strictEqual(blocks.length, 1);
        assert.strictEqual(blocks[0].open.name, 'if');
        assert.strictEqual(blocks[0].close, null);
    });

    it('matches nested blocks', () => {
        const { expressions: exprs } = extractExpressions('{{#if a}}{{#each items}}{{name}}{{/each}}{{/if}}');
        const blocks = matchBlocks(exprs);
        assert.strictEqual(blocks.length, 2);

        // Inner block (each) comes first since it closes first
        const eachBlock = blocks.find(b => b.open.name === 'each');
        const ifBlock = blocks.find(b => b.open.name === 'if');
        assert.ok(eachBlock);
        assert.ok(ifBlock);
        assert.strictEqual(eachBlock.close?.name, 'each');
        assert.strictEqual(ifBlock.close?.name, 'if');
        assert.strictEqual(eachBlock.mismatch, false);
        assert.strictEqual(ifBlock.mismatch, false);
    });

    it('matches sequential blocks', () => {
        const { expressions: exprs } = extractExpressions('{{#if a}}x{{/if}}{{#each b}}y{{/each}}');
        const blocks = matchBlocks(exprs);
        assert.strictEqual(blocks.length, 2);
        assert.strictEqual(blocks[0].open.name, 'if');
        assert.strictEqual(blocks[1].open.name, 'each');
    });

    it('tracks children inside blocks', () => {
        const { expressions: exprs } = extractExpressions('{{#if a}}{{foo}}{{bar}}{{/if}}');
        const blocks = matchBlocks(exprs);
        assert.strictEqual(blocks.length, 1);
        assert.ok(blocks[0].children.length >= 2);
        const childNames = blocks[0].children.map(c => c.name);
        assert.ok(childNames.includes('foo'));
        assert.ok(childNames.includes('bar'));
    });

    it('handles else as a child of the block', () => {
        const { expressions: exprs } = extractExpressions('{{#if a}}yes{{else}}no{{/if}}');
        const blocks = matchBlocks(exprs);
        assert.strictEqual(blocks.length, 1);
        // else + "yes" + "no" are children
        const elseChild = blocks[0].children.find(c => c.name === 'else');
        assert.ok(elseChild, 'else should be a child of the if block');
    });

    it('returns empty for no blocks', () => {
        const { expressions: exprs } = extractExpressions('{{foo}} {{bar}}');
        const blocks = matchBlocks(exprs);
        assert.strictEqual(blocks.length, 0);
    });
});
