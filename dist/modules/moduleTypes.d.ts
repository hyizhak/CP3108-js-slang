import type { RequireProvider } from './requireProvider';
export declare type ModuleManifest = {
    [module: string]: {
        tabs: string[];
    };
};
export declare type ModuleBundle = (require: RequireProvider) => ModuleFunctions;
export declare type ModuleFunctions = {
    [functionName: string]: Function;
};
export declare type ModuleDocumentation = Record<string, string>;
export declare type ImportTransformOptions = {
    wrapSourceModules: boolean;
    loadTabs: boolean;
    checkImports: boolean;
};
