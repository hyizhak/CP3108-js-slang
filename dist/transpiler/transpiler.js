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
exports.transpile = exports.checkForUndefinedVariables = exports.evallerReplacer = exports.getBuiltins = exports.getGloballyDeclaredIdentifiers = exports.transformImportDeclarations = void 0;
/* eslint-disable @typescript-eslint/no-unused-vars */
const astring_1 = require("astring");
const lodash_1 = require("lodash");
const source_map_1 = require("source-map");
const constants_1 = require("../constants");
const errors_1 = require("../errors/errors");
const moduleErrors_1 = require("../errors/moduleErrors");
const errors_2 = require("../modules/errors");
const moduleLoaderAsync_1 = require("../modules/moduleLoaderAsync");
const types_1 = require("../types");
const assert_1 = require("../utils/assert");
const typeGuards_1 = require("../utils/ast/typeGuards");
const create = require("../utils/astCreator");
const uniqueIds_1 = require("../utils/uniqueIds");
const walkers_1 = require("../utils/walkers");
/**
 * This whole transpiler includes many many many many hacks to get stuff working.
 * Order in which certain functions are called matter as well.
 * There should be an explanation on it coming up soon.
 */
const globalIdNames = [
    'native',
    'callIfFuncAndRightArgs',
    'boolOrErr',
    'wrap',
    'wrapSourceModule',
    'unaryOp',
    'binaryOp',
    'throwIfTimeout',
    'setProp',
    'getProp',
    'builtins'
];
function transformImportDeclarations(program, usedIdentifiers, { wrapSourceModules, checkImports, loadTabs }, context, nativeId, useThis = false) {
    return __awaiter(this, void 0, void 0, function* () {
        const [importNodes, otherNodes] = (0, lodash_1.partition)(program.body, typeGuards_1.isImportDeclaration);
        if (importNodes.length === 0)
            return ['', [], otherNodes];
        const importNodeMap = importNodes.reduce((res, node) => {
            const moduleName = node.source.value;
            (0, assert_1.default)(typeof moduleName === 'string', `Expected ImportDeclaration to have a source of type string, got ${moduleName}`);
            if (!(moduleName in res)) {
                res[moduleName] = [];
            }
            res[moduleName].push(node);
            node.specifiers.forEach(({ local: { name } }) => usedIdentifiers.add(name));
            return res;
        }, {});
        const manifest = yield (0, moduleLoaderAsync_1.memoizedGetModuleManifestAsync)();
        const loadedModules = yield Promise.all(Object.entries(importNodeMap).map(([moduleName, nodes]) => __awaiter(this, void 0, void 0, function* () {
            if (!(moduleName in manifest)) {
                throw new moduleErrors_1.ModuleNotFoundError(moduleName, nodes[0]);
            }
            const [text, docs] = yield Promise.all([
                (0, moduleLoaderAsync_1.memoizedGetModuleBundleAsync)(moduleName),
                (0, moduleLoaderAsync_1.memoizedGetModuleDocsAsync)(moduleName),
                context ? (0, moduleLoaderAsync_1.initModuleContextAsync)(moduleName, context, loadTabs) : Promise.resolve()
            ]);
            const namespaced = (0, uniqueIds_1.getUniqueId)(usedIdentifiers, '__MODULE__');
            if (checkImports && !docs) {
                throw new errors_2.ModuleInternalError(moduleName, new Error('checkImports was true, but failed to load docs'), nodes[0]);
            }
            const declNodes = nodes.flatMap(({ specifiers }) => specifiers.map(spec => {
                (0, assert_1.default)(spec.type === 'ImportSpecifier', `Expected ImportSpecifier, got ${spec.type}`);
                if (checkImports && !(spec.imported.name in docs)) {
                    throw new errors_2.UndefinedImportError(spec.imported.name, moduleName, spec);
                }
                // Convert each import specifier to its corresponding local variable declaration
                return create.constantDeclaration(spec.local.name, create.memberExpression(create.identifier(`${useThis ? 'this.' : ''}${namespaced}`), spec.imported.name));
            }));
            return [moduleName, { text, nodes: declNodes, namespaced }];
        })));
        const [prefixes, declNodes] = loadedModules.reduce(([prefix, decls], [moduleName, { text, nodes, namespaced }]) => {
            const modifiedText = wrapSourceModules
                ? `${constants_1.NATIVE_STORAGE_ID}.operators.get("wrapSourceModule")("${moduleName}", ${text}, ${constants_1.REQUIRE_PROVIDER_ID})`
                : `(${text})(${constants_1.REQUIRE_PROVIDER_ID})`;
            return [
                [...prefix, `const ${namespaced} = ${modifiedText}\n`],
                [...decls, ...nodes]
            ];
        }, [[], []]);
        return [prefixes.join('\n'), declNodes, otherNodes];
    });
}
exports.transformImportDeclarations = transformImportDeclarations;
function getGloballyDeclaredIdentifiers(program) {
    return program.body
        .filter(statement => statement.type === 'VariableDeclaration')
        .map(({ declarations: { 0: { id } }, kind }) => id.name);
}
exports.getGloballyDeclaredIdentifiers = getGloballyDeclaredIdentifiers;
function getBuiltins(nativeStorage) {
    const builtinsStatements = [];
    nativeStorage.builtins.forEach((_unused, name) => {
        builtinsStatements.push(create.declaration(name, 'const', create.callExpression(create.memberExpression(create.memberExpression(create.identifier(constants_1.NATIVE_STORAGE_ID), 'builtins'), 'get'), [create.literal(name)])));
    });
    return builtinsStatements;
}
exports.getBuiltins = getBuiltins;
function evallerReplacer(nativeStorageId, usedIdentifiers) {
    const arg = create.identifier((0, uniqueIds_1.getUniqueId)(usedIdentifiers, 'program'));
    return create.expressionStatement(create.assignmentExpression(create.memberExpression(nativeStorageId, 'evaller'), create.arrowFunctionExpression([arg], create.callExpression(create.identifier('eval'), [arg]))));
}
exports.evallerReplacer = evallerReplacer;
function generateFunctionsToStringMap(program) {
    const map = new Map();
    (0, walkers_1.simple)(program, {
        ArrowFunctionExpression(node) {
            map.set(node, (0, astring_1.generate)(node));
        },
        FunctionDeclaration(node) {
            map.set(node, (0, astring_1.generate)(node));
        }
    });
    return map;
}
function transformFunctionDeclarationsToArrowFunctions(program, functionsToStringMap) {
    (0, walkers_1.simple)(program, {
        FunctionDeclaration(node) {
            const { id, params, body } = node;
            node.type = 'VariableDeclaration';
            node = node;
            const asArrowFunction = create.blockArrowFunction(params, body);
            functionsToStringMap.set(asArrowFunction, functionsToStringMap.get(node));
            node.declarations = [
                {
                    type: 'VariableDeclarator',
                    id: id,
                    init: asArrowFunction
                }
            ];
            node.kind = 'const';
        }
    });
}
/**
 * Transforms all arrow functions
 * (arg1, arg2, ...) => { statement1; statement2; return statement3; }
 *
 * to
 *
 * <NATIVE STORAGE>.operators.wrap((arg1, arg2, ...) => {
 *   statement1;statement2;return statement3;
 * })
 *
 * to allow for iterative processes to take place
 */
function wrapArrowFunctionsToAllowNormalCallsAndNiceToString(program, functionsToStringMap, globalIds) {
    (0, walkers_1.simple)(program, {
        ArrowFunctionExpression(node) {
            var _a;
            // If it's undefined then we're dealing with a thunk
            if (functionsToStringMap.get(node) !== undefined) {
                create.mutateToCallExpression(node, globalIds.wrap, [
                    Object.assign({}, node),
                    create.literal(functionsToStringMap.get(node)),
                    create.literal(((_a = node.params[node.params.length - 1]) === null || _a === void 0 ? void 0 : _a.type) === 'RestElement'),
                    globalIds.native
                ]);
            }
        }
    });
}
/**
 * Transforms all return statements (including expression arrow functions) to return an intermediate value
 * return nonFnCall + 1;
 *  =>
 * return {isTail: false, value: nonFnCall + 1};
 *
 * return fnCall(arg1, arg2);
 * => return {isTail: true, function: fnCall, arguments: [arg1, arg2]}
 *
 * conditional and logical expressions will be recursively looped through as well
 */
function transformReturnStatementsToAllowProperTailCalls(program) {
    function transformLogicalExpression(expression) {
        var _a, _b, _c;
        switch (expression.type) {
            case 'LogicalExpression':
                return create.logicalExpression(expression.operator, expression.left, transformLogicalExpression(expression.right), expression.loc);
            case 'ConditionalExpression':
                return create.conditionalExpression(expression.test, transformLogicalExpression(expression.consequent), transformLogicalExpression(expression.alternate), expression.loc);
            case 'CallExpression':
                expression = expression;
                const { line, column } = ((_a = expression.loc) !== null && _a !== void 0 ? _a : constants_1.UNKNOWN_LOCATION).start;
                const source = (_c = (_b = expression.loc) === null || _b === void 0 ? void 0 : _b.source) !== null && _c !== void 0 ? _c : null;
                const functionName = expression.callee.type === 'Identifier' ? expression.callee.name : '<anonymous>';
                const args = expression.arguments;
                return create.objectExpression([
                    create.property('isTail', create.literal(true)),
                    create.property('function', expression.callee),
                    create.property('functionName', create.literal(functionName)),
                    create.property('arguments', create.arrayExpression(args)),
                    create.property('line', create.literal(line)),
                    create.property('column', create.literal(column)),
                    create.property('source', create.literal(source))
                ]);
            default:
                return create.objectExpression([
                    create.property('isTail', create.literal(false)),
                    create.property('value', expression)
                ]);
        }
    }
    (0, walkers_1.simple)(program, {
        ReturnStatement(node) {
            node.argument = transformLogicalExpression(node.argument);
        },
        ArrowFunctionExpression(node) {
            if (node.expression) {
                node.body = transformLogicalExpression(node.body);
            }
        }
    });
}
function transformCallExpressionsToCheckIfFunction(program, globalIds) {
    (0, walkers_1.simple)(program, {
        CallExpression(node) {
            var _a, _b, _c;
            const { line, column } = ((_a = node.loc) !== null && _a !== void 0 ? _a : constants_1.UNKNOWN_LOCATION).start;
            const source = (_c = (_b = node.loc) === null || _b === void 0 ? void 0 : _b.source) !== null && _c !== void 0 ? _c : null;
            const args = node.arguments;
            node.arguments = [
                node.callee,
                create.literal(line),
                create.literal(column),
                create.literal(source),
                ...args
            ];
            node.callee = globalIds.callIfFuncAndRightArgs;
        }
    });
}
function checkForUndefinedVariables(program, nativeStorage, globalIds, skipUndefined) {
    const builtins = nativeStorage.builtins;
    const identifiersIntroducedByNode = new Map();
    function processBlock(node) {
        const identifiers = new Set();
        for (const statement of node.body) {
            if (statement.type === 'VariableDeclaration') {
                identifiers.add(statement.declarations[0].id.name);
            }
            else if (statement.type === 'FunctionDeclaration') {
                if (statement.id === null) {
                    throw new Error('Encountered a FunctionDeclaration node without an identifier. This should have been caught when parsing.');
                }
                identifiers.add(statement.id.name);
            }
            else if (statement.type === 'ImportDeclaration') {
                for (const specifier of statement.specifiers) {
                    identifiers.add(specifier.local.name);
                }
            }
        }
        identifiersIntroducedByNode.set(node, identifiers);
    }
    function processFunction(node, _ancestors) {
        identifiersIntroducedByNode.set(node, new Set(node.params.map(id => id.type === 'Identifier'
            ? id.name
            : id.argument.name)));
    }
    const identifiersToAncestors = new Map();
    (0, walkers_1.ancestor)(program, {
        Program: processBlock,
        BlockStatement: processBlock,
        FunctionDeclaration: processFunction,
        ArrowFunctionExpression: processFunction,
        ForStatement(forStatement, ancestors) {
            const init = forStatement.init;
            if (init.type === 'VariableDeclaration') {
                identifiersIntroducedByNode.set(forStatement, new Set([init.declarations[0].id.name]));
            }
        },
        Identifier(identifier, ancestors) {
            identifiersToAncestors.set(identifier, [...ancestors]);
        },
        Pattern(node, ancestors) {
            if (node.type === 'Identifier') {
                identifiersToAncestors.set(node, [...ancestors]);
            }
            else if (node.type === 'MemberExpression') {
                if (node.object.type === 'Identifier') {
                    identifiersToAncestors.set(node.object, [...ancestors]);
                }
            }
        }
    });
    const nativeInternalNames = new Set(Object.values(globalIds).map(({ name }) => name));
    for (const [identifier, ancestors] of identifiersToAncestors) {
        const name = identifier.name;
        const isCurrentlyDeclared = ancestors.some(a => { var _a; return (_a = identifiersIntroducedByNode.get(a)) === null || _a === void 0 ? void 0 : _a.has(name); });
        if (isCurrentlyDeclared) {
            continue;
        }
        const isPreviouslyDeclared = nativeStorage.previousProgramsIdentifiers.has(name);
        if (isPreviouslyDeclared) {
            continue;
        }
        const isBuiltin = builtins.has(name);
        if (isBuiltin) {
            continue;
        }
        const isNativeId = nativeInternalNames.has(name);
        if (!isNativeId && !skipUndefined) {
            throw new errors_1.UndefinedVariable(name, identifier);
        }
    }
}
exports.checkForUndefinedVariables = checkForUndefinedVariables;
function transformSomeExpressionsToCheckIfBoolean(program, globalIds) {
    function transform(node) {
        var _a, _b, _c;
        const { line, column } = ((_a = node.loc) !== null && _a !== void 0 ? _a : constants_1.UNKNOWN_LOCATION).start;
        const source = (_c = (_b = node.loc) === null || _b === void 0 ? void 0 : _b.source) !== null && _c !== void 0 ? _c : null;
        const test = node.type === 'LogicalExpression' ? 'left' : 'test';
        node[test] = create.callExpression(globalIds.boolOrErr, [
            node[test],
            create.literal(line),
            create.literal(column),
            create.literal(source)
        ]);
    }
    (0, walkers_1.simple)(program, {
        IfStatement: transform,
        ConditionalExpression: transform,
        LogicalExpression: transform,
        ForStatement: transform,
        WhileStatement: transform
    });
}
function getNativeIds(program, usedIdentifiers) {
    const globalIds = {};
    for (const identifier of globalIdNames) {
        globalIds[identifier] = create.identifier((0, uniqueIds_1.getUniqueId)(usedIdentifiers, identifier));
    }
    return globalIds;
}
function transformUnaryAndBinaryOperationsToFunctionCalls(program, globalIds, chapter) {
    (0, walkers_1.simple)(program, {
        BinaryExpression(node) {
            var _a, _b, _c;
            const { line, column } = ((_a = node.loc) !== null && _a !== void 0 ? _a : constants_1.UNKNOWN_LOCATION).start;
            const source = (_c = (_b = node.loc) === null || _b === void 0 ? void 0 : _b.source) !== null && _c !== void 0 ? _c : null;
            const { operator, left, right } = node;
            create.mutateToCallExpression(node, globalIds.binaryOp, [
                create.literal(operator),
                create.literal(chapter),
                left,
                right,
                create.literal(line),
                create.literal(column),
                create.literal(source)
            ]);
        },
        UnaryExpression(node) {
            var _a, _b, _c;
            const { line, column } = ((_a = node.loc) !== null && _a !== void 0 ? _a : constants_1.UNKNOWN_LOCATION).start;
            const source = (_c = (_b = node.loc) === null || _b === void 0 ? void 0 : _b.source) !== null && _c !== void 0 ? _c : null;
            const { operator, argument } = node;
            create.mutateToCallExpression(node, globalIds.unaryOp, [
                create.literal(operator),
                argument,
                create.literal(line),
                create.literal(column),
                create.literal(source)
            ]);
        }
    });
}
function getComputedProperty(computed, property) {
    return computed ? property : create.literal(property.name);
}
function transformPropertyAssignment(program, globalIds) {
    (0, walkers_1.simple)(program, {
        AssignmentExpression(node) {
            var _a;
            if (node.left.type === 'MemberExpression') {
                const { object, property, computed, loc } = node.left;
                const { line, column } = (loc !== null && loc !== void 0 ? loc : constants_1.UNKNOWN_LOCATION).start;
                const source = (_a = loc === null || loc === void 0 ? void 0 : loc.source) !== null && _a !== void 0 ? _a : null;
                create.mutateToCallExpression(node, globalIds.setProp, [
                    object,
                    getComputedProperty(computed, property),
                    node.right,
                    create.literal(line),
                    create.literal(column),
                    create.literal(source)
                ]);
            }
        }
    });
}
function transformPropertyAccess(program, globalIds) {
    (0, walkers_1.simple)(program, {
        MemberExpression(node) {
            var _a;
            const { object, property, computed, loc } = node;
            const { line, column } = (loc !== null && loc !== void 0 ? loc : constants_1.UNKNOWN_LOCATION).start;
            const source = (_a = loc === null || loc === void 0 ? void 0 : loc.source) !== null && _a !== void 0 ? _a : null;
            create.mutateToCallExpression(node, globalIds.getProp, [
                object,
                getComputedProperty(computed, property),
                create.literal(line),
                create.literal(column),
                create.literal(source)
            ]);
        }
    });
}
function addInfiniteLoopProtection(program, globalIds, usedIdentifiers) {
    const getTimeAst = () => create.callExpression(create.identifier('get_time'), []);
    function instrumentLoops(node) {
        var _a, _b, _c;
        const newStatements = [];
        for (const statement of node.body) {
            if (statement.type === 'ForStatement' || statement.type === 'WhileStatement') {
                const startTimeConst = (0, uniqueIds_1.getUniqueId)(usedIdentifiers, 'startTime');
                newStatements.push(create.constantDeclaration(startTimeConst, getTimeAst()));
                if (statement.body.type === 'BlockStatement') {
                    const { line, column } = ((_a = statement.loc) !== null && _a !== void 0 ? _a : constants_1.UNKNOWN_LOCATION).start;
                    const source = (_c = (_b = statement.loc) === null || _b === void 0 ? void 0 : _b.source) !== null && _c !== void 0 ? _c : null;
                    statement.body.body.unshift(create.expressionStatement(create.callExpression(globalIds.throwIfTimeout, [
                        globalIds.native,
                        create.identifier(startTimeConst),
                        getTimeAst(),
                        create.literal(line),
                        create.literal(column),
                        create.literal(source)
                    ])));
                }
            }
            newStatements.push(statement);
        }
        node.body = newStatements;
    }
    (0, walkers_1.simple)(program, {
        Program: instrumentLoops,
        BlockStatement: instrumentLoops
    });
}
function wrapWithBuiltins(statements, nativeStorage) {
    return create.blockStatement([...getBuiltins(nativeStorage), create.blockStatement(statements)]);
}
function getDeclarationsToAccessTranspilerInternals(globalIds) {
    return Object.entries(globalIds).map(([key, { name }]) => {
        let value;
        const kind = 'const';
        if (key === 'native') {
            value = create.identifier(constants_1.NATIVE_STORAGE_ID);
        }
        else if (key === 'globals') {
            value = create.memberExpression(globalIds.native, 'globals');
        }
        else {
            value = create.callExpression(create.memberExpression(create.memberExpression(globalIds.native, 'operators'), 'get'), [create.literal(key)]);
        }
        return create.declaration(name, kind, value);
    });
}
function transpileToSource(program, context, skipUndefined, importOptions) {
    return __awaiter(this, void 0, void 0, function* () {
        const usedIdentifiers = new Set([
            ...(0, uniqueIds_1.getIdentifiersInProgram)(program),
            ...(0, uniqueIds_1.getIdentifiersInNativeStorage)(context.nativeStorage)
        ]);
        const globalIds = getNativeIds(program, usedIdentifiers);
        if (program.body.length === 0) {
            return { transpiled: '' };
        }
        const functionsToStringMap = generateFunctionsToStringMap(program);
        transformReturnStatementsToAllowProperTailCalls(program);
        transformCallExpressionsToCheckIfFunction(program, globalIds);
        transformUnaryAndBinaryOperationsToFunctionCalls(program, globalIds, context.chapter);
        transformSomeExpressionsToCheckIfBoolean(program, globalIds);
        transformPropertyAssignment(program, globalIds);
        transformPropertyAccess(program, globalIds);
        checkForUndefinedVariables(program, context.nativeStorage, globalIds, skipUndefined);
        transformFunctionDeclarationsToArrowFunctions(program, functionsToStringMap);
        wrapArrowFunctionsToAllowNormalCallsAndNiceToString(program, functionsToStringMap, globalIds);
        addInfiniteLoopProtection(program, globalIds, usedIdentifiers);
        const [modulePrefix, importNodes, otherNodes] = yield transformImportDeclarations(program, usedIdentifiers, importOptions, context, globalIds.native);
        program.body = importNodes.concat(otherNodes);
        getGloballyDeclaredIdentifiers(program).forEach(id => context.nativeStorage.previousProgramsIdentifiers.add(id));
        const statements = program.body;
        const newStatements = [
            ...getDeclarationsToAccessTranspilerInternals(globalIds),
            evallerReplacer(globalIds.native, usedIdentifiers),
            create.expressionStatement(create.identifier('undefined')),
            ...statements
        ];
        program.body =
            context.nativeStorage.evaller === null
                ? [wrapWithBuiltins(newStatements, context.nativeStorage)]
                : [create.blockStatement(newStatements)];
        const map = new source_map_1.SourceMapGenerator({ file: 'source' });
        const transpiled = modulePrefix + (0, astring_1.generate)(program, { sourceMap: map });
        const sourceMapJson = map.toJSON();
        return { transpiled, sourceMapJson };
    });
}
function transpileToFullJS(program, context, importOptions, skipUndefined) {
    return __awaiter(this, void 0, void 0, function* () {
        const usedIdentifiers = new Set([
            ...(0, uniqueIds_1.getIdentifiersInProgram)(program),
            ...(0, uniqueIds_1.getIdentifiersInNativeStorage)(context.nativeStorage)
        ]);
        const globalIds = getNativeIds(program, usedIdentifiers);
        checkForUndefinedVariables(program, context.nativeStorage, globalIds, skipUndefined);
        const [modulePrefix, importNodes, otherNodes] = yield transformImportDeclarations(program, usedIdentifiers, importOptions, context, globalIds.native);
        (0, uniqueIds_1.getFunctionDeclarationNamesInProgram)(program).forEach(id => context.nativeStorage.previousProgramsIdentifiers.add(id));
        getGloballyDeclaredIdentifiers(program).forEach(id => context.nativeStorage.previousProgramsIdentifiers.add(id));
        const transpiledProgram = create.program([
            evallerReplacer(create.identifier(constants_1.NATIVE_STORAGE_ID), new Set()),
            create.expressionStatement(create.identifier('undefined')),
            ...importNodes,
            ...otherNodes
        ]);
        const sourceMap = new source_map_1.SourceMapGenerator({ file: 'source' });
        const transpiled = modulePrefix + (0, astring_1.generate)(transpiledProgram, { sourceMap });
        const sourceMapJson = sourceMap.toJSON();
        return { transpiled, sourceMapJson };
    });
}
function transpile(program, context, importOptions = {}, skipUndefined = false) {
    if (context.chapter === types_1.Chapter.FULL_JS || context.chapter === types_1.Chapter.PYTHON_1) {
        const fullImportOptions = Object.assign({ checkImports: false, loadTabs: true, wrapSourceModules: false }, importOptions);
        return transpileToFullJS(program, context, fullImportOptions, true);
    }
    else if (context.variant == types_1.Variant.NATIVE) {
        const fullImportOptions = Object.assign({ checkImports: true, loadTabs: true, wrapSourceModules: true }, importOptions);
        return transpileToFullJS(program, context, fullImportOptions, false);
    }
    else {
        const fullImportOptions = Object.assign({ checkImports: true, loadTabs: true, wrapSourceModules: true }, importOptions);
        return transpileToSource(program, context, skipUndefined, fullImportOptions);
    }
}
exports.transpile = transpile;
//# sourceMappingURL=transpiler.js.map