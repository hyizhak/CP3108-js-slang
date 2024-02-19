import * as es from 'estree';
import { NativeStorage } from '../types';
export declare function getUniqueId(usedIdentifiers: Set<string>, uniqueId?: string): string;
export declare function getIdentifiersInNativeStorage(nativeStorage: NativeStorage): Set<string>;
export declare function getIdentifiersInProgram(program: es.Program): Set<string>;
export declare function getFunctionDeclarationNamesInProgram(program: es.Program): Set<string>;
