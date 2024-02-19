import * as es from 'estree';
import { Context, Environment, Frame, Value } from '../types';
import Closure from './closure';
declare class Thunk {
    exp: es.Node;
    env: Environment;
    value: Value;
    isMemoized: boolean;
    constructor(exp: es.Node, env: Environment);
}
export declare function actualValue(exp: es.Node, context: Context): Value;
export declare const createBlockEnvironment: (context: Context, name?: string, head?: Frame) => Environment;
export declare const pushEnvironment: (context: Context, environment: Environment) => void;
export declare type Evaluator<T extends es.Node> = (node: T, context: Context) => IterableIterator<Value>;
/**
 * WARNING: Do not use object literal shorthands, e.g.
 *   {
 *     *Literal(node: es.Literal, ...) {...},
 *     *ThisExpression(node: es.ThisExpression, ..._ {...},
 *     ...
 *   }
 * They do not minify well, raising uncaught syntax errors in production.
 * See: https://github.com/webpack/webpack/issues/7566
 */
export declare const evaluators: {
    [nodeType: string]: Evaluator<es.Node>;
};
export declare function evaluateProgram(program: es.Program, context: Context, checkImports: boolean, loadTabs: boolean): Generator<any, any, any>;
export declare function apply(context: Context, fun: Closure | Value, args: (Thunk | Value)[], node: es.CallExpression, thisContext?: Value): Generator<any, any, any>;
export {};
