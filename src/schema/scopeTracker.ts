import { SchemaDefinition, SchemaNode, ObjectSchema, ArraySchema, ScopeEntry } from './types.js';

/**
 * Tracks the current scope while walking through Handlebars expressions.
 * Handles {{#each}}, {{#with}}, ../ references, this, and @data variables.
 */
export class ScopeTracker {
    private scopeStack: ScopeEntry[];

    constructor(rootSchema: SchemaDefinition) {
        this.scopeStack = [{ schema: rootSchema, helperName: 'root' }];
    }

    /**
     * Push a new scope when entering a block helper.
     */
    pushScope(helperName: string, argument: string): void {
        const resolved = this.resolveField(argument);
        if (!resolved) {
            // Can't resolve — push unknown scope
            this.scopeStack.push({ schema: 'string', helperName });
            return;
        }

        if (helperName === 'each') {
            // For #each, the scope becomes the array items
            if (typeof resolved === 'object' && 'type' in resolved) {
                if (resolved.type === 'array') {
                    this.scopeStack.push({ schema: resolved.items, helperName });
                    return;
                }
                if (resolved.type === 'scalarArray') {
                    this.scopeStack.push({ schema: resolved.items, helperName });
                    return;
                }
            }
            // #each on non-array — push the node as-is
            this.scopeStack.push({ schema: resolved, helperName });
        } else if (helperName === 'with') {
            // For #with, the scope becomes the object
            this.scopeStack.push({ schema: resolved, helperName });
        } else {
            // Other block helpers (if, unless) don't change scope
            this.scopeStack.push({
                schema: this.getCurrentFields() ?? 'string',
                helperName,
            });
        }
    }

    /**
     * Pop the current scope when leaving a block.
     */
    popScope(): void {
        if (this.scopeStack.length > 1) {
            this.scopeStack.pop();
        }
    }

    /**
     * Resolve a field path in the current scope.
     * Returns the SchemaNode if found, null if not.
     */
    resolve(fieldPath: string): { node: SchemaNode | null; found: boolean } {
        // Handle @data variables — always valid inside #each
        if (fieldPath.startsWith('@')) {
            const dataVars = ['@index', '@first', '@last', '@key'];
            return { node: 'string', found: dataVars.includes(fieldPath) };
        }

        // Handle "this"
        if (fieldPath === 'this' || fieldPath === '.') {
            const current = this.scopeStack[this.scopeStack.length - 1].schema;
            if (typeof current === 'string') {
                return { node: current, found: true };
            }
            return { node: current as SchemaNode, found: true };
        }

        // Handle ../ references
        let scopeIndex = this.scopeStack.length - 1;
        let path = fieldPath;
        while (path.startsWith('../') && scopeIndex > 0) {
            path = path.slice(3);
            scopeIndex--;
        }

        const scope = this.scopeStack[scopeIndex].schema;
        if (!path) {
            return { node: scope as SchemaNode, found: true };
        }

        return this.resolveInScope(path, scope);
    }

    /**
     * Get the fields available in the current scope.
     */
    getCurrentFields(): Record<string, SchemaNode> | null {
        const current = this.scopeStack[this.scopeStack.length - 1].schema;
        return this.getFields(current);
    }

    /**
     * Check if a field is an array type in the current scope.
     */
    isArray(fieldPath: string): boolean | null {
        const resolved = this.resolveField(fieldPath);
        if (!resolved) return null;
        if (typeof resolved === 'object' && 'type' in resolved) {
            return resolved.type === 'array' || resolved.type === 'scalarArray';
        }
        return false;
    }

    private resolveField(fieldPath: string): SchemaNode | null {
        const result = this.resolve(fieldPath);
        return result.found ? result.node : null;
    }

    private resolveInScope(path: string, scope: SchemaNode | SchemaDefinition): { node: SchemaNode | null; found: boolean } {
        const parts = path.split('.');
        let current: SchemaNode | SchemaDefinition | null = scope;

        for (const part of parts) {
            const fields = this.getFields(current);
            if (!fields || !(part in fields)) {
                return { node: null, found: false };
            }
            current = fields[part];
        }

        return { node: current as SchemaNode, found: true };
    }

    private getFields(node: SchemaNode | SchemaDefinition | null): Record<string, SchemaNode> | null {
        if (!node) return null;

        // SchemaDefinition (top-level) is Record<string, SchemaNode>
        if (typeof node === 'object' && !('type' in node)) {
            return node as Record<string, SchemaNode>;
        }

        // ObjectSchema
        if (typeof node === 'object' && 'type' in node && node.type === 'object') {
            return (node as ObjectSchema).fields;
        }

        return null;
    }
}
