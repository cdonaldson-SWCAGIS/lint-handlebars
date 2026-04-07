import * as assert from 'assert';
import { inferSchema, schemaToJson } from '../../schema/generator.js';

describe('Schema Generator', () => {
    it('infers scalars from sample data', () => {
        const schema = inferSchema({
            name: 'John',
            age: 30,
            active: true,
        });
        assert.ok(schema);
        assert.strictEqual(schema!['name'], 'string');
        assert.strictEqual(schema!['age'], 'number');
        assert.strictEqual(schema!['active'], 'boolean');
    });

    it('infers nested objects', () => {
        const schema = inferSchema({
            coordinates: { latitude: 40.7, longitude: -74.0 },
        });
        assert.ok(schema);
        const coords = schema!['coordinates'];
        assert.strictEqual(typeof coords, 'object');
        if (typeof coords === 'object' && 'type' in coords) {
            assert.strictEqual(coords.type, 'object');
        }
    });

    it('infers arrays of objects', () => {
        const schema = inferSchema({
            items: [{ name: 'A', value: 1 }],
        });
        assert.ok(schema);
        const items = schema!['items'];
        assert.strictEqual(typeof items, 'object');
        if (typeof items === 'object' && 'type' in items) {
            assert.strictEqual(items.type, 'array');
        }
    });

    it('infers arrays of scalars', () => {
        const schema = inferSchema({
            tags: ['foo', 'bar'],
        });
        assert.ok(schema);
        const tags = schema!['tags'];
        assert.strictEqual(typeof tags, 'object');
        if (typeof tags === 'object' && 'type' in tags) {
            assert.strictEqual(tags.type, 'scalarArray');
        }
    });

    it('handles empty arrays as string arrays', () => {
        const schema = inferSchema({ items: [] });
        assert.ok(schema);
        const items = schema!['items'];
        if (typeof items === 'object' && 'type' in items) {
            assert.strictEqual(items.type, 'scalarArray');
            assert.strictEqual(items.items, 'string');
        }
    });

    it('handles null values as string', () => {
        const schema = inferSchema({ field: null });
        assert.ok(schema);
        assert.strictEqual(schema!['field'], 'string');
    });

    it('returns null for non-object input', () => {
        assert.strictEqual(inferSchema('hello'), null);
        assert.strictEqual(inferSchema(42), null);
        assert.strictEqual(inferSchema([1, 2]), null);
    });

    it('round-trips through schemaToJson', () => {
        const data = {
            siteId: 'abc',
            count: 5,
            samples: [{ depth: 1.5, name: 'A' }],
            coords: { lat: 40.7, lng: -74 },
            tags: ['a', 'b'],
        };
        const schema = inferSchema(data)!;
        const json = schemaToJson(schema);

        assert.strictEqual(json['siteId'], 'string');
        assert.strictEqual(json['count'], 'number');
        assert.ok(Array.isArray(json['samples']));
        assert.strictEqual(typeof json['coords'], 'object');
        assert.ok(Array.isArray(json['tags']));
    });
});
