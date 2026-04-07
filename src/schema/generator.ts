import { SchemaDefinition, SchemaNode } from './types.js';

/**
 * Infer a SchemaDefinition from a sample JSON data payload.
 */
export function inferSchema(data: unknown): SchemaDefinition | null {
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        return null;
    }

    return inferObject(data as Record<string, unknown>);
}

function inferObject(obj: Record<string, unknown>): Record<string, SchemaNode> {
    const fields: Record<string, SchemaNode> = {};

    for (const [key, value] of Object.entries(obj)) {
        fields[key] = inferNode(value);
    }

    return fields;
}

function inferNode(value: unknown): SchemaNode {
    if (value === null || value === undefined) {
        return 'string'; // default for null/undefined
    }

    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';

    if (Array.isArray(value)) {
        if (value.length === 0) {
            return { type: 'scalarArray', items: 'string' }; // default for empty arrays
        }

        const first = value[0];

        if (typeof first === 'string') {
            return { type: 'scalarArray', items: 'string' };
        }
        if (typeof first === 'number') {
            return { type: 'scalarArray', items: 'number' };
        }
        if (typeof first === 'boolean') {
            return { type: 'scalarArray', items: 'boolean' };
        }

        if (typeof first === 'object' && first !== null && !Array.isArray(first)) {
            return {
                type: 'array',
                items: {
                    type: 'object',
                    fields: inferObject(first as Record<string, unknown>),
                },
            };
        }

        return { type: 'scalarArray', items: 'string' }; // fallback
    }

    if (typeof value === 'object') {
        return {
            type: 'object',
            fields: inferObject(value as Record<string, unknown>),
        };
    }

    return 'string'; // fallback
}

/**
 * Convert a SchemaDefinition back to the simple JSON schema format
 * used by the project (for writing to file).
 */
export function schemaToJson(schema: SchemaDefinition): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [key, node] of Object.entries(schema)) {
        result[key] = nodeToJson(node);
    }

    return result;
}

function nodeToJson(node: SchemaNode): unknown {
    if (typeof node === 'string') return node;

    if (node.type === 'object') {
        const obj: Record<string, unknown> = {};
        for (const [key, child] of Object.entries(node.fields)) {
            obj[key] = nodeToJson(child);
        }
        return obj;
    }

    if (node.type === 'array') {
        const item: Record<string, unknown> = {};
        for (const [key, child] of Object.entries(node.items.fields)) {
            item[key] = nodeToJson(child);
        }
        return [item];
    }

    if (node.type === 'scalarArray') {
        return [node.items];
    }

    return 'string';
}
