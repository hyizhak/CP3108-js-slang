import * as es from 'estree';
import { Context } from '..';
import { RuntimeSourceError } from '../errors/runtimeSourceError';
export declare enum StackOverflowMessages {
    firefox = "InternalError: too much recursion",
    webkit = "RangeError: Maximum call stack size exceeded",
    edge = "Error: Out of stack space"
}
/**
 * Checks if the error is a TimeoutError or Stack Overflow.
 *
 * @returns {true} if the error is a TimeoutError or Stack Overflow.
 * @returns {false} otherwise.
 */
export declare function isPotentialInfiniteLoop(error: any): boolean;
export declare enum InfiniteLoopErrorType {
    NoBaseCase = 0,
    Cycle = 1,
    FromSmt = 2
}
export declare class InfiniteLoopError extends RuntimeSourceError {
    infiniteLoopType: InfiniteLoopErrorType;
    message: string;
    functionName: string | undefined;
    streamMode: boolean;
    codeStack: string[];
    constructor(functionName: string | undefined, streamMode: boolean, message: string, infiniteLoopType: InfiniteLoopErrorType);
    explain(): string;
}
/**
 * Determines whether the error is an infinite loop, and returns a tuple of
 * [error type, is stream, error message, previous code].
 *  *
 * @param {Context} - The context being used.
 *
 * @returns [error type, is stream, error message, previous programs] if the error was an infinite loop
 * @returns {undefined} otherwise
 */
export declare function getInfiniteLoopData(context: Context): undefined | [InfiniteLoopErrorType, boolean, string, es.Program[]];
