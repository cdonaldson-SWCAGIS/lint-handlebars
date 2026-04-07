import * as fs from 'fs';
import { SchemaDefinition, SchemaNode, ObjectSchema, ArraySchema, ScalarArraySchema } from './types.js';

/**
 * Normalize a raw JSON schema value into a SchemaNode.
 */
function normalizeNode(value: unknown): SchemaNode | null {
    if (typeof value === 'string') {
        if (value === 'string' || value === 'number' || value === 'boolean') {
            return value;
        }
        return null;
    }

    if (Array.isArray(value)) {
        if (value.length === 0) return null;

        const first = value[0];
        if (typeof first === 'string') {
            // ["string"], ["number"], ["boolean"]
            if (first === 'string' || first === 'number' || first === 'boolean') {
                return { type: 'scalarArray', items: first } as ScalarArraySchema;
            }
            return null;
        }

        if (typeof first === 'object' && first !== null) {
            // [{...}] — array of objects
            const itemFields = normalizeObject(first as Record<string, unknown>);
            if (itemFields) {
                return {
                    type: 'array',
                    items: { type: 'object', fields: itemFields },
                } as ArraySchema;
            }
        }
        return null;
    }

    if (typeof value === 'object' && value !== null) {
        // {...} — nested object
        const fields = normalizeObject(value as Record<string, unknown>);
        if (fields) {
            return { type: 'object', fields } as ObjectSchema;
        }
    }

    return null;
}

function normalizeObject(obj: Record<string, unknown>): Record<string, SchemaNode> | null {
    const fields: Record<string, SchemaNode> = {};
    for (const [key, value] of Object.entries(obj)) {
        const node = normalizeNode(value);
        if (node) {
            fields[key] = node;
        }
    }
    return Object.keys(fields).length > 0 ? fields : null;
}

/**
 * Load and normalize a schema from a JSON file.
 */
export function loadSchema(schemaPath: string): SchemaDefinition | null {
    try {
        const content = fs.readFileSync(schemaPath, 'utf-8');
        const raw = JSON.parse(content);

        if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
            return null;
        }

        const fields = normalizeObject(raw as Record<string, unknown>);
        return fields ?? null;
    } catch {
        return null;
    }
}
