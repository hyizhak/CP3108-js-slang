import { RuntimeSourceError } from '../errors/runtimeSourceError';
export declare class PromiseTimeoutError extends RuntimeSourceError {
}
export declare const timeoutPromise: <T>(promise: Promise<T>, timeout: number) => Promise<T>;
