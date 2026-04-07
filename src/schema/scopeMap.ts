import { ParseResult, Expression, ExpressionType } from '../parser/index.js';
import { SchemaDefinition, SchemaNode } from './types.js';
import { ScopeTracker } from './scopeTracker.js';

export interface ScopeInfo {
    tracker: ScopeTracker;
    isArrayField: boolean | null; // for the first param of block helpers
}

/**
 * Build a scope map that associates each expression with its scope context.
 * Processes expressions in document order, pushing/popping scope at block boundaries.
 *
 * Returns a new ScopeTracker instance positioned at each expression's scope.
 * Since ScopeTracker is mutable, we capture snapshots via cloning at each point.
 *
 * For simplicity, we return a function that rules can call to get a tracker
 * positioned at any block's scope.
 */
export function createScopeAnalyzer(parseResult: ParseResult, schema: SchemaDefinition) {
    return {
        /**
         * Analyze the document and call the visitor for each expression with its scope tracker.
         */
        walk(visitor: (expr: Expression, tracker: ScopeTracker) => void): void {
            const tracker = new ScopeTracker(schema);
            const blockStack: string[] = [];

            for (const expr of parseResult.expressions) {
                if (expr.type === ExpressionType.BlockStatement && expr.name !== 'else') {
                    visitor(expr, tracker);
                    // Push scope for each/with
                    const arg = expr.params[0] || '';
                    tracker.pushScope(expr.name, arg);
                    blockStack.push(expr.name);
                } else if (expr.type === ExpressionType.CloseBlock) {
                    tracker.popScope();
                    blockStack.pop();
                } else {
                    visitor(expr, tracker);
                }
            }
        },
    };
}
