import { Context } from '../types';
import { Program } from './svml-compiler';
export declare function show_registers(s: string, isShowExecuting?: boolean): string;
export declare function NEW_FUNCTION(): void;
export declare function show_heap(s: string): string;
export declare function show_heap_value(address: number): string;
export declare function runWithProgram(p: Program, context: Context): any;
