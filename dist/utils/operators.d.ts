import { BinaryOperator, UnaryOperator } from 'estree';
import { LazyBuiltIn } from '../createContext';
import { ModuleBundle, ModuleFunctions } from '../modules/moduleTypes';
import { RequireProvider } from '../modules/requireProvider';
import { Chapter, NativeStorage, Thunk } from '../types';
export declare function throwIfTimeout(nativeStorage: NativeStorage, start: number, current: number, line: number, column: number, source: string | null): void;
export declare function forceIt(val: Thunk | any): any;
export declare function delayIt(f: () => any): Thunk;
export declare function wrapLazyCallee(candidate: any): any;
export declare function makeLazyFunction(candidate: any): LazyBuiltIn;
export declare function callIfFuncAndRightArgs(candidate: any, line: number, column: number, source: string | null, ...args: any[]): any;
export declare function boolOrErr(candidate: any, line: number, column: number, source: string | null): any;
export declare function unaryOp(operator: UnaryOperator, argument: any, line: number, column: number, source: string | null): number | boolean | "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function";
export declare function evaluateUnaryExpression(operator: UnaryOperator, value: any): number | boolean | "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function";
export declare function binaryOp(operator: BinaryOperator, chapter: Chapter, left: any, right: any, line: number, column: number, source: string | null): any;
export declare function evaluateBinaryExpression(operator: BinaryOperator, left: any, right: any): any;
/**
 * Limitations for current properTailCalls implementation:
 * Obviously, if objects ({}) are reintroduced,
 * we have to change this for a more stringent check,
 * as isTail and transformedFunctions are properties
 * and may be added by Source code.
 */
export declare const callIteratively: (f: any, nativeStorage: NativeStorage, ...args: any[]) => any;
export declare const wrap: (f: (...args: any[]) => any, stringified: string, hasVarArgs: boolean, nativeStorage: NativeStorage) => {
    (...args: any[]): any;
    transformedFunction: (...args: any[]) => any;
    toString(): string;
};
export declare const wrapSourceModule: (moduleName: string, moduleFunc: ModuleBundle, requireProvider: RequireProvider) => ModuleFunctions;
export declare const setProp: (obj: any, prop: any, value: any, line: number, column: number, source: string | null) => any;
export declare const getProp: (obj: any, prop: any, line: number, column: number, source: string | null) => any;
