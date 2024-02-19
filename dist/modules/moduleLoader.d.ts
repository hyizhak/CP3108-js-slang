/// <reference types="lodash" />
import es from 'estree';
import { XMLHttpRequest as NodeXMLHttpRequest } from 'xmlhttprequest-ts';
import { Context } from '../types';
import { ModuleDocumentation, ModuleFunctions, ModuleManifest } from './moduleTypes';
export declare const newHttpRequest: () => NodeXMLHttpRequest | XMLHttpRequest;
export declare let MODULES_STATIC_URL: string;
export declare function setModulesStaticURL(url: string): void;
/**
 * Send a HTTP Get request to the specified endpoint.
 * @return NodeXMLHttpRequest | XMLHttpRequest
 */
export declare function httpGet(url: string): string;
/**
 * Send a HTTP GET request to the modules endpoint to retrieve the manifest
 * @return Modules
 */
export declare const memoizedGetModuleManifest: typeof getModuleManifest & import("lodash").MemoizedFunction;
declare function getModuleManifest(): ModuleManifest;
export declare const memoizedGetModuleFile: (name: string, type: 'tab' | 'bundle' | 'json') => string;
/**
 * Loads the respective module package (functions from the module)
 * @param path imported module name
 * @param context
 * @param node import declaration node
 * @returns the module's functions object
 */
export declare function loadModuleBundle(path: string, context: Context, node?: es.Node): ModuleFunctions;
/**
 * Loads the module contents of a package
 *
 * @param path imported module name
 * @param node import declaration node
 * @returns an array of functions
 */
export declare function loadModuleTabs(path: string, node?: es.Node): any[];
export declare const memoizedloadModuleDocs: typeof loadModuleDocs & import("lodash").MemoizedFunction;
export declare function loadModuleDocs(path: string, node?: es.Node): ModuleDocumentation | null;
export declare function initModuleContext(moduleName: string, context: Context, loadTabs: boolean, node?: es.Node): void;
export {};
