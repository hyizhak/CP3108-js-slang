import * as es from 'estree';
import { Context, Environment } from '../types';
declare class Callable extends Function {
    constructor(f: any);
}
/**
 * Models function value in the interpreter environment.
 */
export default class Closure extends Callable {
    node: es.Function;
    environment: Environment;
    static makeFromArrowFunction(node: es.ArrowFunctionExpression, environment: Environment, context: Context, dummyReturn?: boolean, predefined?: boolean): Closure;
    /** Unique ID defined for closure */
    id: string;
    /** String representation of the closure */
    functionName: string;
    /** Fake closure function */
    fun: Function;
    /** Keeps track of whether the closure is a pre-defined function */
    preDefined?: boolean;
    /** The original node that created this Closure */
    originalNode: es.Function;
    constructor(node: es.Function, environment: Environment, context: Context, isPredefined?: boolean);
    toString(): string;
}
export {};
