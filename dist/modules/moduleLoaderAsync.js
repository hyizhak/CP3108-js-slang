"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initModuleContextAsync = exports.loadModuleBundleAsync = exports.loadModuleTabsAsync = exports.memoizedGetModuleDocsAsync = exports.memoizedGetModuleTabAsync = exports.memoizedGetModuleBundleAsync = exports.memoizedGetModuleManifestAsync = exports.httpGetAsync = void 0;
const lodash_1 = require("lodash");
const misc_1 = require("../utils/misc");
const operators_1 = require("../utils/operators");
const errors_1 = require("./errors");
const moduleLoader_1 = require("./moduleLoader");
const requireProvider_1 = require("./requireProvider");
const utils_1 = require("./utils");
function httpGetAsync(path, type) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const resp = yield (0, misc_1.timeoutPromise)(fetch(path, {
                method: 'GET'
            }), 10000);
            if (resp.status !== 200 && resp.status !== 304) {
                throw new errors_1.ModuleConnectionError();
            }
            const promise = type === 'text' ? resp.text() : resp.json();
            return (0, misc_1.timeoutPromise)(promise, 10000);
        }
        catch (error) {
            if (error instanceof TypeError || error instanceof misc_1.PromiseTimeoutError) {
                throw new errors_1.ModuleConnectionError();
            }
            if (!(error instanceof errors_1.ModuleConnectionError))
                throw new errors_1.ModuleInternalError(path, error);
            throw error;
        }
    });
}
exports.httpGetAsync = httpGetAsync;
/**
 * Send a HTTP GET request to the modules endpoint to retrieve the manifest
 * @return Modules
 */
exports.memoizedGetModuleManifestAsync = (0, lodash_1.memoize)(getModuleManifestAsync);
function getModuleManifestAsync() {
    return httpGetAsync(`${moduleLoader_1.MODULES_STATIC_URL}/modules.json`, 'json');
}
function checkModuleExists(moduleName, node) {
    return __awaiter(this, void 0, void 0, function* () {
        const modules = yield (0, exports.memoizedGetModuleManifestAsync)();
        // Check if the module exists
        if (!(moduleName in modules))
            throw new errors_1.ModuleNotFoundError(moduleName, node);
        return modules[moduleName];
    });
}
exports.memoizedGetModuleBundleAsync = (0, lodash_1.memoize)(getModuleBundleAsync);
function getModuleBundleAsync(moduleName) {
    return __awaiter(this, void 0, void 0, function* () {
        return httpGetAsync(`${moduleLoader_1.MODULES_STATIC_URL}/bundles/${moduleName}.js`, 'text');
    });
}
exports.memoizedGetModuleTabAsync = (0, lodash_1.memoize)(getModuleTabAsync);
function getModuleTabAsync(tabName) {
    return httpGetAsync(`${moduleLoader_1.MODULES_STATIC_URL}/tabs/${tabName}.js`, 'text');
}
exports.memoizedGetModuleDocsAsync = (0, lodash_1.memoize)(getModuleDocsAsync);
function getModuleDocsAsync(moduleName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield httpGetAsync(`${moduleLoader_1.MODULES_STATIC_URL}/jsons/${moduleName}.json`, 'json');
            return result;
        }
        catch (error) {
            console.warn(`Failed to load documentation for ${moduleName}:`, error);
            return null;
        }
    });
}
function loadModuleTabsAsync(moduleName, node) {
    return __awaiter(this, void 0, void 0, function* () {
        const moduleInfo = yield checkModuleExists(moduleName, node);
        // Load the tabs for the current module
        return Promise.all(moduleInfo.tabs.map((path) => __awaiter(this, void 0, void 0, function* () {
            const rawTabFile = yield (0, exports.memoizedGetModuleTabAsync)(path);
            try {
                return (0, utils_1.evalRawTab)(rawTabFile);
            }
            catch (error) {
                // console.error('tab error:', error);
                throw new errors_1.ModuleInternalError(path, error, node);
            }
        })));
    });
}
exports.loadModuleTabsAsync = loadModuleTabsAsync;
function loadModuleBundleAsync(moduleName, context, wrapModule, node) {
    return __awaiter(this, void 0, void 0, function* () {
        // await checkModuleExists(moduleName, node)
        const moduleText = yield (0, exports.memoizedGetModuleBundleAsync)(moduleName);
        try {
            const moduleBundle = eval(moduleText);
            if (wrapModule)
                return (0, operators_1.wrapSourceModule)(moduleName, moduleBundle, (0, requireProvider_1.getRequireProvider)(context));
            return moduleBundle((0, requireProvider_1.getRequireProvider)(context));
        }
        catch (error) {
            // console.error("bundle error: ", error)
            throw new errors_1.ModuleInternalError(moduleName, error, node);
        }
    });
}
exports.loadModuleBundleAsync = loadModuleBundleAsync;
/**
 * Initialize module contexts and add UI tabs needed for modules to program context
 */
function initModuleContextAsync(moduleName, context, loadTabs) {
    return __awaiter(this, void 0, void 0, function* () {
        // Load the module's tabs
        if (!(moduleName in context.moduleContexts)) {
            context.moduleContexts[moduleName] = {
                state: null,
                tabs: loadTabs ? yield loadModuleTabsAsync(moduleName) : null
            };
        }
        else if (context.moduleContexts[moduleName].tabs === null && loadTabs) {
            context.moduleContexts[moduleName].tabs = yield loadModuleTabsAsync(moduleName);
        }
    });
}
exports.initModuleContextAsync = initModuleContextAsync;
//# sourceMappingURL=moduleLoaderAsync.js.map