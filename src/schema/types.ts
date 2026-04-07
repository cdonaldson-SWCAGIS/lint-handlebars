export type ScalarType = 'string' | 'number' | 'boolean';

export type SchemaNode =
    | ScalarType
    | ObjectSchema
    | ArraySchema
    | ScalarArraySchema;

export interface ObjectSchema {
    type: 'object';
    fields: Record<string, SchemaNode>;
}

export interface ArraySchema {
    type: 'array';
    items: ObjectSchema;
}

export interface ScalarArraySchema {
    type: 'scalarArray';
    items: ScalarType;
}

export type SchemaDefinition = Record<string, SchemaNode>;

export interface ScopeEntry {
    schema: SchemaNode | SchemaDefinition;
    helperName: string;
}
