import type { Context } from '../types';
/**
 * Returns a function that simulates the job of Node's `require`. The require
 * provider is then used by Source modules to access the context and js-slang standard
 * library
 */
export declare const getRequireProvider: (context: Context) => (x: string) => any;
export declare type RequireProvider = ReturnType<typeof getRequireProvider>;
