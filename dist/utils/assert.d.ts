import { RuntimeSourceError } from '../errors/runtimeSourceError';
export declare class AssertionError extends RuntimeSourceError {
    readonly message: string;
    constructor(message: string);
    explain(): string;
    elaborate(): string;
}
export default function assert(condition: boolean, message: string): asserts condition;
