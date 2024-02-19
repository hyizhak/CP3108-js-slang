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
exports.assemble = exports.setBreakpointAtLine = exports.createContext = exports.compileFiles = exports.compile = exports.interrupt = exports.resume = exports.runFilesInContext = exports.runInContext = exports.getTypeInformation = exports.getNames = exports.hasDeclaration = exports.getAllOccurrencesInScope = exports.getScope = exports.findDeclaration = exports.parseError = exports.SourceDocumentation = void 0;
const source_map_1 = require("source-map");
const createContext_1 = require("./createContext");
exports.createContext = createContext_1.default;
const errors_1 = require("./errors/errors");
const finder_1 = require("./finder");
const utils_1 = require("./parser/utils");
const scope_refactoring_1 = require("./scope-refactoring");
const inspector_1 = require("./stdlib/inspector");
Object.defineProperty(exports, "setBreakpointAtLine", { enumerable: true, get: function () { return inspector_1.setBreakpointAtLine; } });
const types_1 = require("./types");
const walkers_1 = require("./utils/walkers");
const svml_assembler_1 = require("./vm/svml-assembler");
Object.defineProperty(exports, "assemble", { enumerable: true, get: function () { return svml_assembler_1.assemble; } });
const svml_compiler_1 = require("./vm/svml-compiler");
var docTooltip_1 = require("./editors/ace/docTooltip");
Object.defineProperty(exports, "SourceDocumentation", { enumerable: true, get: function () { return docTooltip_1.SourceDocumentation; } });
const interpreter_1 = require("./ec-evaluator/interpreter");
const localImportErrors_1 = require("./errors/localImportErrors");
const filePaths_1 = require("./localImports/filePaths");
const preprocessor_1 = require("./localImports/preprocessor");
const name_extractor_1 = require("./name-extractor");
const parser_1 = require("./parser/parser");
const scheme_1 = require("./parser/scheme");
const utils_2 = require("./parser/utils");
const runner_1 = require("./runner");
const typeChecker_1 = require("./typeChecker/typeChecker");
const stringify_1 = require("./utils/stringify");
// needed to work on browsers
if (typeof window !== 'undefined') {
    // @ts-ignore
    source_map_1.SourceMapConsumer.initialize({
        'lib/mappings.wasm': 'https://unpkg.com/source-map@0.7.3/lib/mappings.wasm'
    });
}
let verboseErrors = false;
function parseError(errors, verbose = verboseErrors) {
    const errorMessagesArr = errors.map(error => {
        var _a;
        // FIXME: Either refactor the parser to output an ESTree-compliant AST, or modify the ESTree types.
        const filePath = ((_a = error.location) === null || _a === void 0 ? void 0 : _a.source) ? `[${error.location.source}] ` : '';
        const line = error.location ? error.location.start.line : '<unknown>';
        const column = error.location ? error.location.start.column : '<unknown>';
        const explanation = error.explain();
        if (verbose) {
            // TODO currently elaboration is just tagged on to a new line after the error message itself. find a better
            // way to display it.
            const elaboration = error.elaborate();
            return line < 1
                ? `${filePath}${explanation}\n${elaboration}\n`
                : `${filePath}Line ${line}, Column ${column}: ${explanation}\n${elaboration}\n`;
        }
        else {
            return line < 1 ? explanation : `${filePath}Line ${line}: ${explanation}`;
        }
    });
    return errorMessagesArr.join('\n');
}
exports.parseError = parseError;
function findDeclaration(code, context, loc) {
    const program = (0, utils_1.looseParse)(code, context);
    if (!program) {
        return null;
    }
    const identifierNode = (0, finder_1.findIdentifierNode)(program, context, loc);
    if (!identifierNode) {
        return null;
    }
    const declarationNode = (0, finder_1.findDeclarationNode)(program, identifierNode);
    if (!declarationNode || identifierNode === declarationNode) {
        return null;
    }
    return declarationNode.loc;
}
exports.findDeclaration = findDeclaration;
function getScope(code, context, loc) {
    const program = (0, utils_1.looseParse)(code, context);
    if (!program) {
        return [];
    }
    const identifierNode = (0, finder_1.findIdentifierNode)(program, context, loc);
    if (!identifierNode) {
        return [];
    }
    const declarationNode = (0, finder_1.findDeclarationNode)(program, identifierNode);
    if (!declarationNode || declarationNode.loc == null || identifierNode !== declarationNode) {
        return [];
    }
    return (0, scope_refactoring_1.getScopeHelper)(declarationNode.loc, program, identifierNode.name);
}
exports.getScope = getScope;
function getAllOccurrencesInScope(code, context, loc) {
    const program = (0, utils_1.looseParse)(code, context);
    if (!program) {
        return [];
    }
    const identifierNode = (0, finder_1.findIdentifierNode)(program, context, loc);
    if (!identifierNode) {
        return [];
    }
    const declarationNode = (0, finder_1.findDeclarationNode)(program, identifierNode);
    if (declarationNode == null || declarationNode.loc == null) {
        return [];
    }
    return (0, scope_refactoring_1.getAllOccurrencesInScopeHelper)(declarationNode.loc, program, identifierNode.name);
}
exports.getAllOccurrencesInScope = getAllOccurrencesInScope;
function hasDeclaration(code, context, loc) {
    const program = (0, utils_1.looseParse)(code, context);
    if (!program) {
        return false;
    }
    const identifierNode = (0, finder_1.findIdentifierNode)(program, context, loc);
    if (!identifierNode) {
        return false;
    }
    const declarationNode = (0, finder_1.findDeclarationNode)(program, identifierNode);
    if (declarationNode == null || declarationNode.loc == null) {
        return false;
    }
    return true;
}
exports.hasDeclaration = hasDeclaration;
/**
 * Gets names present within a string of code
 * @param code Code to parse
 * @param line Line position of the cursor
 * @param col Column position of the cursor
 * @param context Evaluation context
 * @returns `[NameDeclaration[], true]` if suggestions should be displayed, `[[], false]` otherwise
 */
function getNames(code, line, col, context) {
    return __awaiter(this, void 0, void 0, function* () {
        const [program, comments] = (0, utils_2.parseWithComments)(code);
        if (!program) {
            return [[], false];
        }
        const cursorLoc = { line, column: col };
        const [progNames, displaySuggestions] = (0, name_extractor_1.getProgramNames)(program, comments, cursorLoc);
        const keywords = (0, name_extractor_1.getKeywords)(program, cursorLoc, context);
        return [progNames.concat(keywords), displaySuggestions];
    });
}
exports.getNames = getNames;
function getTypeInformation(code, context, loc, name) {
    try {
        // parse the program into typed nodes and parse error
        const program = (0, utils_1.typedParse)(code, context);
        if (program === null) {
            return '';
        }
        if (context.prelude !== null) {
            (0, typeChecker_1.typeCheck)((0, utils_1.typedParse)(context.prelude, context), context);
        }
        const [typedProgram, error] = (0, typeChecker_1.typeCheck)(program, context);
        const parsedError = parseError(error);
        if (context.prelude !== null) {
            // the env of the prelude was added, we now need to remove it
            context.typeEnvironment.pop();
        }
        // initialize the ans string
        let ans = '';
        if (parsedError) {
            ans += parsedError + '\n';
        }
        if (!typedProgram) {
            return ans;
        }
        // get name of the node
        const getName = (typedNode) => {
            let nodeId = '';
            if (typedNode.type) {
                if (typedNode.type === 'FunctionDeclaration') {
                    if (typedNode.id === null) {
                        throw new Error('Encountered a FunctionDeclaration node without an identifier. This should have been caught when parsing.');
                    }
                    nodeId = typedNode.id.name;
                }
                else if (typedNode.type === 'VariableDeclaration') {
                    nodeId = typedNode.declarations[0].id.name;
                }
                else if (typedNode.type === 'Identifier') {
                    nodeId = typedNode.name;
                }
            }
            return nodeId;
        };
        // callback function for findNodeAt function
        function findByLocationPredicate(t, nd) {
            if (!nd.inferredType) {
                return false;
            }
            const isInLoc = (nodeLoc) => {
                return !(nodeLoc.start.line > loc.line ||
                    nodeLoc.end.line < loc.line ||
                    (nodeLoc.start.line === loc.line && nodeLoc.start.column > loc.column) ||
                    (nodeLoc.end.line === loc.line && nodeLoc.end.column < loc.column));
            };
            const location = nd.loc;
            if (nd.type && location) {
                return getName(nd) === name && isInLoc(location);
            }
            return false;
        }
        // report both as the type inference
        const res = (0, walkers_1.findNodeAt)(typedProgram, undefined, undefined, findByLocationPredicate);
        if (res === undefined) {
            return ans;
        }
        const node = res.node;
        if (node === undefined) {
            return ans;
        }
        const actualNode = node.type === 'VariableDeclaration'
            ? node.declarations[0].init
            : node;
        const type = (0, stringify_1.typeToString)(actualNode.type === 'FunctionDeclaration'
            ? actualNode.functionInferredType
            : actualNode.inferredType);
        return ans + `At Line ${loc.line} => ${getName(node)}: ${type}`;
    }
    catch (error) {
        return '';
    }
}
exports.getTypeInformation = getTypeInformation;
function runInContext(code, context, options = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        const defaultFilePath = '/default.js';
        const files = {};
        files[defaultFilePath] = code;
        return runFilesInContext(files, defaultFilePath, context, options);
    });
}
exports.runInContext = runInContext;
function runFilesInContext(files, entrypointFilePath, context, options = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        for (const filePath in files) {
            const filePathError = (0, filePaths_1.validateFilePath)(filePath);
            if (filePathError !== null) {
                context.errors.push(filePathError);
                return runner_1.resolvedErrorPromise;
            }
        }
        const code = files[entrypointFilePath];
        if (code === undefined) {
            context.errors.push(new localImportErrors_1.CannotFindModuleError(entrypointFilePath));
            return runner_1.resolvedErrorPromise;
        }
        if (context.chapter === types_1.Chapter.FULL_JS ||
            context.chapter === types_1.Chapter.FULL_TS ||
            context.chapter === types_1.Chapter.PYTHON_1) {
            const program = (0, parser_1.parse)(code, context);
            if (program === null) {
                return runner_1.resolvedErrorPromise;
            }
            const fullImportOptions = Object.assign({ loadTabs: true, checkImports: false, wrapSourceModules: false }, options.importOptions);
            return (0, runner_1.fullJSRunner)(program, context, fullImportOptions);
        }
        if (context.chapter === types_1.Chapter.HTML) {
            return (0, runner_1.htmlRunner)(code, context, options);
        }
        if (context.chapter <= +types_1.Chapter.SCHEME_1 && context.chapter >= +types_1.Chapter.FULL_SCHEME) {
            // If the language is scheme, we need to format all errors and returned values first
            // Use the standard runner to get the result
            const evaluated = (0, runner_1.sourceFilesRunner)(files, entrypointFilePath, context, options).then(result => {
                // Format the returned value
                if (result.status === 'finished') {
                    return Object.assign(Object.assign({}, result), { value: (0, scheme_1.decodeValue)(result.value) });
                }
                return result;
            });
            // Format all errors in the context
            context.errors = context.errors.map(error => (0, scheme_1.decodeError)(error));
            return evaluated;
        }
        // FIXME: Clean up state management so that the `parseError` function is pure.
        //        This is not a huge priority, but it would be good not to make use of
        //        global state.
        verboseErrors = (0, runner_1.hasVerboseErrors)(code);
        return (0, runner_1.sourceFilesRunner)(files, entrypointFilePath, context, options);
    });
}
exports.runFilesInContext = runFilesInContext;
function resume(result) {
    if (result.status === 'finished' || result.status === 'error') {
        return result;
    }
    else if (result.status === 'suspended-ec-eval') {
        const value = (0, interpreter_1.resumeEvaluate)(result.context);
        return (0, interpreter_1.ECEResultPromise)(result.context, value);
    }
    else {
        return result.scheduler.run(result.it, result.context);
    }
}
exports.resume = resume;
function interrupt(context) {
    const globalEnvironment = context.runtime.environments[context.runtime.environments.length - 1];
    context.runtime.environments = [globalEnvironment];
    context.runtime.isRunning = false;
    context.errors.push(new errors_1.InterruptedError(context.runtime.nodes[0]));
}
exports.interrupt = interrupt;
function compile(code, context, vmInternalFunctions) {
    const defaultFilePath = '/default.js';
    const files = {};
    files[defaultFilePath] = code;
    return compileFiles(files, defaultFilePath, context, vmInternalFunctions);
}
exports.compile = compile;
function compileFiles(files, entrypointFilePath, context, vmInternalFunctions) {
    for (const filePath in files) {
        const filePathError = (0, filePaths_1.validateFilePath)(filePath);
        if (filePathError !== null) {
            context.errors.push(filePathError);
            return undefined;
        }
    }
    const entrypointCode = files[entrypointFilePath];
    if (entrypointCode === undefined) {
        context.errors.push(new localImportErrors_1.CannotFindModuleError(entrypointFilePath));
        return undefined;
    }
    const preprocessedProgram = (0, preprocessor_1.default)(files, entrypointFilePath, context);
    if (!preprocessedProgram) {
        return undefined;
    }
    try {
        return (0, svml_compiler_1.compileToIns)(preprocessedProgram, undefined, vmInternalFunctions);
    }
    catch (error) {
        context.errors.push(error);
        return undefined;
    }
}
exports.compileFiles = compileFiles;
//# sourceMappingURL=index.js.map