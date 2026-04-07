export enum ExpressionType {
    MustacheStatement = 'MustacheStatement',
    RawMustacheStatement = 'RawMustacheStatement',
    BlockStatement = 'BlockStatement',
    CloseBlock = 'CloseBlock',
    PartialStatement = 'PartialStatement',
    CommentStatement = 'CommentStatement',
}

export interface Position {
    line: number;   // 0-based
    column: number; // 0-based
}

export interface Range {
    start: Position;
    end: Position;
}

export interface SubExpression {
    name: string;
    params: string[];
}

export interface Expression {
    type: ExpressionType;
    raw: string;
    name: string;
    params: string[];
    hash: Record<string, string>;
    subExpressions: SubExpression[];
    blockParams?: string[];
    range: Range;
}

export interface Block {
    open: Expression;
    close: Expression | null;
    children: Expression[];
    mismatch: boolean;
}

export interface UnclosedExpression {
    start: Position;
    raw: string;
}

export interface ParseResult {
    expressions: Expression[];
    blocks: Block[];
    unclosedExpressions: UnclosedExpression[];
}
