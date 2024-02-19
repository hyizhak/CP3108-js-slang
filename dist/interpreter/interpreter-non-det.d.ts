import * as es from 'estree';
import { Context, Value } from '../types';
import Closure from './closure';
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
export declare function evaluate(node: es.Node, context: Context): Generator<any, any, undefined>;
export declare function apply(context: Context, fun: Closure | Value, args: Value[], node: es.CallExpression, thisContext?: Value): Generator<any, undefined, unknown>;
export { evaluate as nonDetEvaluate };
