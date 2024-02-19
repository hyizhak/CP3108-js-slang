/**
 * Utility functions for creating the various agenda instructions.
 */
import * as es from 'estree';
import { Environment } from '../types';
import { AppInstr, ArrLitInstr, AssmtInstr, BinOpInstr, BranchInstr, EnvInstr, ForInstr, Instr, UnOpInstr, WhileInstr } from './types';
export declare const resetInstr: (srcNode: es.Node) => Instr;
export declare const whileInstr: (test: es.Expression, body: es.Statement, srcNode: es.Node) => WhileInstr;
export declare const forInstr: (init: es.VariableDeclaration | es.Expression, test: es.Expression, update: es.Expression, body: es.Statement, srcNode: es.Node) => ForInstr;
export declare const assmtInstr: (symbol: string, constant: boolean, declaration: boolean, srcNode: es.Node) => AssmtInstr;
export declare const unOpInstr: (symbol: es.UnaryOperator, srcNode: es.Node) => UnOpInstr;
export declare const binOpInstr: (symbol: es.BinaryOperator, srcNode: es.Node) => BinOpInstr;
export declare const popInstr: (srcNode: es.Node) => Instr;
export declare const appInstr: (numOfArgs: number, srcNode: es.CallExpression) => AppInstr;
export declare const branchInstr: (consequent: es.Expression | es.Statement, alternate: es.Expression | es.Statement | null | undefined, srcNode: es.Node) => BranchInstr;
export declare const envInstr: (env: Environment, srcNode: es.Node) => EnvInstr;
export declare const arrLitInstr: (arity: number, srcNode: es.Node) => ArrLitInstr;
export declare const arrAccInstr: (srcNode: es.Node) => Instr;
export declare const arrAssmtInstr: (srcNode: es.Node) => Instr;
export declare const markerInstr: (srcNode: es.Node) => Instr;
export declare const contInstr: (srcNode: es.Node) => Instr;
export declare const contMarkerInstr: (srcNode: es.Node) => Instr;
export declare const breakInstr: (srcNode: es.Node) => Instr;
export declare const breakMarkerInstr: (srcNode: es.Node) => Instr;
