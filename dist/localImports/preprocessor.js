"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getImportedLocalModulePaths = void 0;
const path_1 = require("path");
const localImportErrors_1 = require("../errors/localImportErrors");
const parser_1 = require("../parser/parser");
const assert_1 = require("../utils/assert");
const typeGuards_1 = require("../utils/ast/typeGuards");
const rttc_1 = require("../utils/rttc");
const contextSpecificConstructors_1 = require("./constructors/contextSpecificConstructors");
const directedGraph_1 = require("./directedGraph");
const filePaths_1 = require("./filePaths");
const hoistAndMergeImports_1 = require("./transformers/hoistAndMergeImports");
const removeExports_1 = require("./transformers/removeExports");
const removeNonSourceModuleImports_1 = require("./transformers/removeNonSourceModuleImports");
const transformProgramToFunctionDeclaration_1 = require("./transformers/transformProgramToFunctionDeclaration");
/**
 * Returns all absolute local module paths which should be imported.
 * This function makes use of the file path of the current file to
 * determine the absolute local module paths.
 *
 * Note that the current file path must be absolute.
 *
 * @param program         The program to be operated on.
 * @param currentFilePath The file path of the current file.
 */
const getImportedLocalModulePaths = (program, currentFilePath) => {
    if (!path_1.posix.isAbsolute(currentFilePath)) {
        throw new Error(`Current file path '${currentFilePath}' is not absolute.`);
    }
    const baseFilePath = path_1.posix.resolve(currentFilePath, '..');
    const importedLocalModuleNames = new Set();
    const importDeclarations = program.body.filter(typeGuards_1.isImportDeclaration);
    importDeclarations.forEach((importDeclaration) => {
        const modulePath = importDeclaration.source.value;
        if (typeof modulePath !== 'string') {
            throw new Error('Module names must be strings.');
        }
        if (!(0, removeNonSourceModuleImports_1.isSourceModule)(modulePath)) {
            const absoluteModulePath = path_1.posix.resolve(baseFilePath, modulePath);
            importedLocalModuleNames.add(absoluteModulePath);
        }
    });
    return importedLocalModuleNames;
};
exports.getImportedLocalModulePaths = getImportedLocalModulePaths;
const parseProgramsAndConstructImportGraph = (files, entrypointFilePath, context) => {
    const programs = {};
    const importGraph = new directedGraph_1.DirectedGraph();
    // If there is more than one file, tag AST nodes with the source file path.
    const numOfFiles = Object.keys(files).length;
    const shouldAddSourceFileToAST = numOfFiles > 1;
    const parseFile = (currentFilePath) => {
        const code = files[currentFilePath];
        if (code === undefined) {
            context.errors.push(new localImportErrors_1.CannotFindModuleError(currentFilePath));
            return;
        }
        // Tag AST nodes with the source file path for use in error messages.
        const parserOptions = shouldAddSourceFileToAST
            ? {
                sourceFile: currentFilePath
            }
            : {};
        const program = (0, parser_1.parse)(code, context, parserOptions);
        if (program === null) {
            return;
        }
        programs[currentFilePath] = program;
        const importedLocalModulePaths = (0, exports.getImportedLocalModulePaths)(program, currentFilePath);
        for (const importedLocalModulePath of importedLocalModulePaths) {
            // If the source & destination nodes in the import graph are the
            // same, then the file is trying to import from itself. This is a
            // special case of circular imports.
            if (importedLocalModulePath === currentFilePath) {
                context.errors.push(new localImportErrors_1.CircularImportError([importedLocalModulePath, currentFilePath]));
                return;
            }
            // If we traverse the same edge in the import graph twice, it means
            // that there is a cycle in the graph. We terminate early so as not
            // to get into an infinite loop (and also because there is no point
            // in traversing cycles when our goal is to build up the import
            // graph).
            if (importGraph.hasEdge(importedLocalModulePath, currentFilePath)) {
                continue;
            }
            // Since the file at 'currentFilePath' contains the import statement
            // from the file at 'importedLocalModulePath', we treat the former
            // as the destination node and the latter as the source node in our
            // import graph. This is because when we insert the transformed
            // function declarations into the resulting program, we need to start
            // with the function declarations that do not depend on other
            // function declarations.
            importGraph.addEdge(importedLocalModulePath, currentFilePath);
            // Recursively parse imported files.
            parseFile(importedLocalModulePath);
        }
    };
    parseFile(entrypointFilePath);
    return {
        programs,
        importGraph
    };
};
const getSourceModuleImports = (programs) => {
    const sourceModuleImports = [];
    Object.values(programs).forEach((program) => {
        const importDeclarations = program.body.filter(typeGuards_1.isImportDeclaration);
        importDeclarations.forEach((importDeclaration) => {
            const importSource = importDeclaration.source.value;
            if (typeof importSource !== 'string') {
                throw new Error('Module names must be strings.');
            }
            if ((0, removeNonSourceModuleImports_1.isSourceModule)(importSource)) {
                sourceModuleImports.push(importDeclaration);
            }
        });
    });
    return sourceModuleImports;
};
/**
 * Preprocesses file imports and returns a transformed Abstract Syntax Tree (AST).
 * If an error is encountered at any point, returns `undefined` to signify that an
 * error occurred. Details of the error can be found inside `context.errors`.
 *
 * The preprocessing works by transforming each imported file into a function whose
 * parameters are other files (results of transformed functions) and return value
 * is a pair where the head is the default export or null, and the tail is a list
 * of pairs that map from exported names to identifiers.
 *
 * See https://github.com/source-academy/js-slang/wiki/Local-Module-Import-&-Export
 * for more information.
 *
 * @param files              An object mapping absolute file paths to file content.
 * @param entrypointFilePath The absolute path of the entrypoint file.
 * @param context            The information associated with the program evaluation.
 */
const preprocessFileImports = (files, entrypointFilePath, context) => {
    var _a;
    // Parse all files into ASTs and build the import graph.
    const { programs, importGraph } = parseProgramsAndConstructImportGraph(files, entrypointFilePath, context);
    // Return 'undefined' if there are errors while parsing.
    if (context.errors.length !== 0) {
        return undefined;
    }
    // Check for circular imports.
    const topologicalOrderResult = importGraph.getTopologicalOrder();
    if (!topologicalOrderResult.isValidTopologicalOrderFound) {
        context.errors.push(new localImportErrors_1.CircularImportError(topologicalOrderResult.firstCycleFound));
        return undefined;
    }
    // We want to operate on the entrypoint program to get the eventual
    // preprocessed program.
    const entrypointProgram = programs[entrypointFilePath];
    const entrypointDirPath = path_1.posix.resolve(entrypointFilePath, '..');
    // Create variables to hold the imported statements.
    const entrypointProgramModuleDeclarations = entrypointProgram.body.filter(typeGuards_1.isModuleDeclaration);
    const entrypointProgramInvokedFunctionResultVariableNameToImportSpecifiersMap = (0, transformProgramToFunctionDeclaration_1.getInvokedFunctionResultVariableNameToImportSpecifiersMap)(entrypointProgramModuleDeclarations, entrypointDirPath);
    const entrypointProgramAccessImportStatements = (0, transformProgramToFunctionDeclaration_1.createAccessImportStatements)(entrypointProgramInvokedFunctionResultVariableNameToImportSpecifiersMap);
    // Transform all programs into their equivalent function declaration
    // except for the entrypoint program.
    const functionDeclarations = {};
    for (const [filePath, program] of Object.entries(programs)) {
        // The entrypoint program does not need to be transformed into its
        // function declaration equivalent as its enclosing environment is
        // simply the overall program's (constructed program's) environment.
        if (filePath === entrypointFilePath) {
            continue;
        }
        const functionDeclaration = (0, transformProgramToFunctionDeclaration_1.transformProgramToFunctionDeclaration)(program, filePath);
        const functionName = (_a = functionDeclaration.id) === null || _a === void 0 ? void 0 : _a.name;
        (0, assert_1.default)(functionName !== undefined, 'A transformed function declaration is missing its name. This should never happen.');
        functionDeclarations[functionName] = functionDeclaration;
    }
    // Invoke each of the transformed functions and store the result in a variable.
    const invokedFunctionResultVariableDeclarations = [];
    topologicalOrderResult.topologicalOrder.forEach((filePath) => {
        // As mentioned above, the entrypoint program does not have a function
        // declaration equivalent, so there is no need to process it.
        if (filePath === entrypointFilePath) {
            return;
        }
        const functionName = (0, filePaths_1.transformFilePathToValidFunctionName)(filePath);
        const invokedFunctionResultVariableName = (0, filePaths_1.transformFunctionNameToInvokedFunctionResultVariableName)(functionName);
        const functionDeclaration = functionDeclarations[functionName];
        const functionParams = functionDeclaration.params.filter(rttc_1.isIdentifier);
        (0, assert_1.default)(functionParams.length === functionDeclaration.params.length, 'Function declaration contains non-Identifier AST nodes as params. This should never happen.');
        const invokedFunctionResultVariableDeclaration = (0, contextSpecificConstructors_1.createInvokedFunctionResultVariableDeclaration)(functionName, invokedFunctionResultVariableName, functionParams);
        invokedFunctionResultVariableDeclarations.push(invokedFunctionResultVariableDeclaration);
    });
    // Get all Source module imports across the entrypoint program & all imported programs.
    const sourceModuleImports = getSourceModuleImports(programs);
    // Re-assemble the program.
    const preprocessedProgram = Object.assign(Object.assign({}, entrypointProgram), { body: [
            ...sourceModuleImports,
            ...Object.values(functionDeclarations),
            ...invokedFunctionResultVariableDeclarations,
            ...entrypointProgramAccessImportStatements,
            ...entrypointProgram.body
        ] });
    // After this pre-processing step, all export-related nodes in the AST
    // are no longer needed and are thus removed.
    (0, removeExports_1.removeExports)(preprocessedProgram);
    // Likewise, all import-related nodes in the AST which are not Source
    // module imports are no longer needed and are also removed.
    (0, removeNonSourceModuleImports_1.removeNonSourceModuleImports)(preprocessedProgram);
    // Finally, we need to hoist all remaining imports to the top of the
    // program. These imports should be source module imports since
    // non-Source module imports would have already been removed. As part
    // of this step, we also merge imports from the same module so as to
    // import each unique name per module only once.
    (0, hoistAndMergeImports_1.hoistAndMergeImports)(preprocessedProgram);
    return preprocessedProgram;
};
exports.default = preprocessFileImports;
//# sourceMappingURL=preprocessor.js.map