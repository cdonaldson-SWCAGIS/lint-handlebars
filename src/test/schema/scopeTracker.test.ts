import * as assert from 'assert';
import { ScopeTracker } from '../../schema/scopeTracker.js';
import { SchemaDefinition } from '../../schema/types.js';

const testSchema: SchemaDefinition = {
    siteId: 'string',
    inspectionDate: 'string',
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
    coordinates: {
        type: 'object',
        fields: {
            latitude: 'number',
            longitude: 'number',
        },
    },
    tags: {
        type: 'scalarArray',
        items: 'string',
    },
};

describe('ScopeTracker', () => {
    it('resolves top-level fields', () => {
        const tracker = new ScopeTracker(testSchema);
        assert.strictEqual(tracker.resolve('siteId').found, true);
        assert.strictEqual(tracker.resolve('inspectionDate').found, true);
        assert.strictEqual(tracker.resolve('nonexistent').found, false);
    });

    it('resolves fields inside #each scope', () => {
        const tracker = new ScopeTracker(testSchema);
        tracker.pushScope('each', 'samples');
        assert.strictEqual(tracker.resolve('depth').found, true);
        assert.strictEqual(tracker.resolve('colorCode').found, true);
        assert.strictEqual(tracker.resolve('siteId').found, false);
    });

    it('resolves fields inside #with scope', () => {
        const tracker = new ScopeTracker(testSchema);
        tracker.pushScope('with', 'coordinates');
        assert.strictEqual(tracker.resolve('latitude').found, true);
        assert.strictEqual(tracker.resolve('longitude').found, true);
        assert.strictEqual(tracker.resolve('siteId').found, false);
    });

    it('resolves ../ references', () => {
        const tracker = new ScopeTracker(testSchema);
        tracker.pushScope('each', 'samples');
        assert.strictEqual(tracker.resolve('../siteId').found, true);
        assert.strictEqual(tracker.resolve('../inspectionDate').found, true);
    });

    it('resolves @data variables inside #each', () => {
        const tracker = new ScopeTracker(testSchema);
        tracker.pushScope('each', 'samples');
        assert.strictEqual(tracker.resolve('@index').found, true);
        assert.strictEqual(tracker.resolve('@first').found, true);
        assert.strictEqual(tracker.resolve('@last').found, true);
        assert.strictEqual(tracker.resolve('@key').found, true);
        assert.strictEqual(tracker.resolve('@unknown').found, false);
    });

    it('resolves "this" reference', () => {
        const tracker = new ScopeTracker(testSchema);
        assert.strictEqual(tracker.resolve('this').found, true);
    });

    it('pops scope correctly', () => {
        const tracker = new ScopeTracker(testSchema);
        tracker.pushScope('each', 'samples');
        assert.strictEqual(tracker.resolve('depth').found, true);
        tracker.popScope();
        assert.strictEqual(tracker.resolve('siteId').found, true);
        assert.strictEqual(tracker.resolve('depth').found, false);
    });

    it('handles nested scopes', () => {
        const tracker = new ScopeTracker(testSchema);
        tracker.pushScope('with', 'coordinates');
        assert.strictEqual(tracker.resolve('latitude').found, true);
        tracker.popScope();
        tracker.pushScope('each', 'samples');
        assert.strictEqual(tracker.resolve('depth').found, true);
    });

    it('identifies array fields', () => {
        const tracker = new ScopeTracker(testSchema);
        assert.strictEqual(tracker.isArray('samples'), true);
        assert.strictEqual(tracker.isArray('tags'), true);
        assert.strictEqual(tracker.isArray('coordinates'), false);
        assert.strictEqual(tracker.isArray('siteId'), false);
    });

    it('if/unless blocks do not change scope', () => {
        const tracker = new ScopeTracker(testSchema);
        tracker.pushScope('if', 'siteId');
        assert.strictEqual(tracker.resolve('siteId').found, true);
        assert.strictEqual(tracker.resolve('samples').found, true);
    });
});
