import { Node } from 'estree';
import { Context, Result } from '..';
import { Scheduler, Value } from '../types';
export declare const saveState: (context: Context, it: IterableIterator<Value>, scheduler: Scheduler) => void;
export declare const setBreakpointAtLine: (lines: string[]) => void;
export declare const manualToggleDebugger: (context: Context) => Result;
export declare const checkEditorBreakpoints: (context: Context, node: Node) => void;
export declare const areBreakpointsSet: () => boolean;
