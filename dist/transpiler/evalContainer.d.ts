import { RequireProvider } from '../modules/requireProvider';
import { NativeStorage } from '../types';
declare type Evaler = (code: string, req: RequireProvider, nativeStorage: NativeStorage) => any;
export declare const sandboxedEval: Evaler;
export {};
