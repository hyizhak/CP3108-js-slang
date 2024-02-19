import * as es from 'estree';
import { Context } from '..';
import { RuntimeSourceError } from '../errors/runtimeSourceError';
import { Environment, Value } from '../types';
import { BlockExpression, substituterNodes } from '../types';
export declare function isBuiltinFunction(node: substituterNodes): boolean;
export declare function isImportedFunction(node: substituterNodes, context: Context): boolean;
export declare function isInfinity(node: substituterNodes): boolean;
export declare function isPositiveNumber(node: substituterNodes): boolean;
export declare function isNegNumber(node: substituterNodes): boolean;
export declare function isNumber(node: substituterNodes): boolean;
export declare function isAllowedLiterals(node: substituterNodes): boolean;
export declare function getDeclaredNames(node: es.BlockStatement | BlockExpression | es.Program): Set<string>;
export declare const handleRuntimeError: (context: Context, error: RuntimeSourceError) => never;
export declare function declareIdentifier(context: Context, name: string, node: es.Node, environment: Environment): Environment;
export declare const currentEnvironment: (context: Context) => Environment;
export declare function defineVariable(context: Context, name: string, value: Value, constant: boolean | undefined, node: es.VariableDeclaration | es.ImportDeclaration): Environment;