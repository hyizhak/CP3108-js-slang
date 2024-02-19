import * as es from 'estree';
import { AcornOptions } from './parser/types';
import { Language } from './types';
export declare const DEFAULT_ECMA_VERSION = 6;
export declare const ACORN_PARSE_OPTIONS: AcornOptions;
export declare const REQUIRE_PROVIDER_ID = "requireProvider";
export declare const CUT = "cut";
export declare const TRY_AGAIN = "retry";
export declare const GLOBAL: typeof globalThis;
export declare const NATIVE_STORAGE_ID = "nativeStorage";
export declare const MAX_LIST_DISPLAY_LENGTH = 100;
export declare const UNKNOWN_LOCATION: es.SourceLocation;
export declare const JSSLANG_PROPERTIES: {
    maxExecTime: number;
    factorToIncreaseBy: number;
};
export declare const sourceLanguages: Language[];
export declare const scmLanguages: Language[];
export declare const pyLanguages: Language[];
