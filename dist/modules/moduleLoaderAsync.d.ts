/// <reference types="lodash" />
import type { Node } from 'estree';
import type { Context } from '..';
import type { ModuleDocumentation, ModuleManifest } from './moduleTypes';
export declare function httpGetAsync(path: string, type: 'json'): Promise<object>;
export declare function httpGetAsync(path: string, type: 'text'): Promise<string>;
/**
 * Send a HTTP GET request to the modules endpoint to retrieve the manifest
 * @return Modules
 */
export declare const memoizedGetModuleManifestAsync: typeof getModuleManifestAsync & import("lodash").MemoizedFunction;
declare function getModuleManifestAsync(): Promise<ModuleManifest>;
export declare const memoizedGetModuleBundleAsync: typeof getModuleBundleAsync & import("lodash").MemoizedFunction;
declare function getModuleBundleAsync(moduleName: string): Promise<string>;
export declare const memoizedGetModuleTabAsync: typeof getModuleTabAsync & import("lodash").MemoizedFunction;
declare function getModuleTabAsync(tabName: string): Promise<string>;
export declare const memoizedGetModuleDocsAsync: typeof getModuleDocsAsync & import("lodash").MemoizedFunction;
declare function getModuleDocsAsync(moduleName: string): Promise<ModuleDocumentation | null>;
export declare function loadModuleTabsAsync(moduleName: string, node?: Node): Promise<any[]>;
export declare function loadModuleBundleAsync(moduleName: string, context: Context, wrapModule: boolean, node?: Node): Promise<import("./moduleTypes").ModuleFunctions>;
/**
 * Initialize module contexts and add UI tabs needed for modules to program context
 */
export declare function initModuleContextAsync(moduleName: string, context: Context, loadTabs: boolean): Promise<void>;
export {};
