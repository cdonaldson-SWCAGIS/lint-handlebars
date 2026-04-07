import { ParseResult } from './types.js';
import { extractExpressions } from './expressionExtractor.js';
import { matchBlocks } from './blockMatcher.js';

export { ExpressionType } from './types.js';
export type { Expression, SubExpression, Block, ParseResult, Range, Position, UnclosedExpression } from './types.js';

export function parse(text: string): ParseResult {
    const { expressions, unclosedExpressions } = extractExpressions(text);
    const blocks = matchBlocks(expressions);
    return { expressions, blocks, unclosedExpressions };
}
