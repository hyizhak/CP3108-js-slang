import * as es from 'estree';
import Closure from '../interpreter/closure';
import { Chapter, Context, Environment, Frame, Variant } from '../types';
export declare function mockContext(chapter?: Chapter, variant?: Variant): Context;
export declare function mockImportDeclaration(): es.ImportDeclaration;
export declare function mockRuntimeContext(): Context;
export declare function mockClosure(): Closure;
export declare function mockEnvironment(context: Context, name?: string, head?: Frame): Environment;
