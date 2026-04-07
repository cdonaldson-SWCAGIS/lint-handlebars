import { Expression, ExpressionType, Block } from './types.js';

/**
 * Match block openers ({{#...}}) with their closers ({{/...}}).
 * Uses a stack to handle nesting. Tracks mismatches and unclosed blocks.
 */
export function matchBlocks(expressions: Expression[]): Block[] {
    const blocks: Block[] = [];
    const stack: { open: Expression; children: Expression[] }[] = [];

    for (const expr of expressions) {
        if (expr.type === ExpressionType.BlockStatement) {
            // {{else}} is not a new block — it belongs to the current block's children
            if (expr.name === 'else') {
                if (stack.length > 0) {
                    stack[stack.length - 1].children.push(expr);
                }
                continue;
            }
            stack.push({ open: expr, children: [] });
        } else if (expr.type === ExpressionType.CloseBlock) {
            if (stack.length === 0) {
                // Close without open — orphaned closer, create a block with null open
                blocks.push({
                    open: expr,
                    close: expr,
                    children: [],
                    mismatch: true,
                });
                continue;
            }

            const top = stack.pop()!;
            const mismatch = top.open.name !== expr.name;
            blocks.push({
                open: top.open,
                close: expr,
                children: top.children,
                mismatch,
            });

            // Add this block's open to the parent's children if there is a parent
            if (stack.length > 0) {
                stack[stack.length - 1].children.push(top.open);
            }
        } else {
            // Regular expression — add to the current block's children if inside a block
            if (stack.length > 0) {
                stack[stack.length - 1].children.push(expr);
            }
        }
    }

    // Any remaining stack entries are unclosed blocks
    while (stack.length > 0) {
        const unclosed = stack.pop()!;
        blocks.push({
            open: unclosed.open,
            close: null,
            children: unclosed.children,
            mismatch: false,
        });
    }

    return blocks;
}
