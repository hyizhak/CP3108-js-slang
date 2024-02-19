import * as es from 'estree';
import { Environment } from '../types';
export declare enum InstrType {
    RESET = "Reset",
    WHILE = "While",
    FOR = "For",
    ASSIGNMENT = "Assignment",
    UNARY_OP = "UnaryOperation",
    BINARY_OP = "BinaryOperation",
    POP = "Pop",
    APPLICATION = "Application",
    BRANCH = "Branch",
    ENVIRONMENT = "Environment",
    ARRAY_LITERAL = "ArrayLiteral",
    ARRAY_ACCESS = "ArrayAccess",
    ARRAY_ASSIGNMENT = "ArrayAssignment",
    ARRAY_LENGTH = "ArrayLength",
    MARKER = "Marker",
    CONTINUE = "Continue",
    CONTINUE_MARKER = "ContinueMarker",
    BREAK = "Break",
    BREAK_MARKER = "BreakMarker"
}
interface BaseInstr {
    instrType: InstrType;
    srcNode: es.Node;
}
export interface WhileInstr extends BaseInstr {
    test: es.Expression;
    body: es.Statement;
}
export interface ForInstr extends BaseInstr {
    init: es.VariableDeclaration | es.Expression;
    test: es.Expression;
    update: es.Expression;
    body: es.Statement;
}
export interface AssmtInstr extends BaseInstr {
    symbol: string;
    constant: boolean;
    declaration: boolean;
}
export interface UnOpInstr extends BaseInstr {
    symbol: es.UnaryOperator;
}
export interface BinOpInstr extends BaseInstr {
    symbol: es.BinaryOperator;
}
export interface AppInstr extends BaseInstr {
    numOfArgs: number;
    srcNode: es.CallExpression;
}
export interface BranchInstr extends BaseInstr {
    consequent: es.Expression | es.Statement;
    alternate: es.Expression | es.Statement | null | undefined;
}
export interface EnvInstr extends BaseInstr {
    env: Environment;
}
export interface ArrLitInstr extends BaseInstr {
    arity: number;
}
export declare type Instr = BaseInstr | WhileInstr | AssmtInstr | AppInstr | BranchInstr | EnvInstr | ArrLitInstr;
export declare type AgendaItem = es.Node | Instr;
export declare class ECEBreak {
}
export declare class ECError {
    readonly error: any;
    constructor(error: any);
}
export {};
