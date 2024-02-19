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
exports.callee = exports.isStepperOutput = exports.getEvaluationSteps = exports.getRedex = exports.redexify = exports.javascriptify = exports.codify = void 0;
const astring_1 = require("astring");
const errors = require("../errors/errors");
const errors_1 = require("../modules/errors");
const moduleLoaderAsync_1 = require("../modules/moduleLoaderAsync");
const parser_1 = require("../parser/parser");
const assert_1 = require("../utils/assert");
const helpers_1 = require("../utils/ast/helpers");
const ast = require("../utils/astCreator");
const dummyAstCreator_1 = require("../utils/dummyAstCreator");
const operators_1 = require("../utils/operators");
const rttc = require("../utils/rttc");
const uniqueIds_1 = require("../utils/uniqueIds");
const walkers_1 = require("../utils/walkers");
const converter_1 = require("./converter");
const builtin = require("./lib");
const util_1 = require("./util");
const irreducibleTypes = new Set([
    'Literal',
    'FunctionExpression',
    'ArrowFunctionExpression',
    'ArrayExpression'
]);
function isIrreducible(node, context) {
    return ((0, util_1.isBuiltinFunction)(node) ||
        (0, util_1.isImportedFunction)(node, context) ||
        (0, util_1.isAllowedLiterals)(node) ||
        (0, util_1.isNegNumber)(node) ||
        irreducibleTypes.has(node.type));
}
function scanOutBoundNames(node) {
    const declaredIds = [];
    if (node.type == 'ArrowFunctionExpression') {
        for (const param of node.params) {
            declaredIds.push(param);
        }
    }
    else if (node.type == 'BlockExpression' || node.type == 'BlockStatement') {
        for (const stmt of node.body) {
            // if stmt is assignment or functionDeclaration
            // add stmt into a set of identifiers
            // return that set
            if (stmt.type === 'VariableDeclaration') {
                stmt.declarations
                    .map(decn => decn.id)
                    .forEach(name => declaredIds.push(name));
                for (const decn of stmt.declarations) {
                    if (decn.init !== null &&
                        decn.init !== undefined &&
                        decn.init.type == 'ArrowFunctionExpression') {
                        for (const param of decn.init.params) {
                            declaredIds.push(param);
                        }
                    }
                }
            }
            else if (stmt.type === 'FunctionDeclaration' && stmt.id) {
                declaredIds.push(stmt.id);
                stmt.params.forEach(param => declaredIds.push(param));
            }
        }
    }
    return declaredIds;
}
function scanOutDeclarations(node) {
    const declaredIds = [];
    if (node.type === 'BlockExpression' ||
        node.type === 'BlockStatement' ||
        node.type === 'Program') {
        for (const stmt of node.body) {
            // if stmt is assignment or functionDeclaration
            // add stmt into a set of identifiers
            // return that set
            if (stmt.type === 'VariableDeclaration') {
                stmt.declarations
                    .map(decn => decn.id)
                    .forEach(name => declaredIds.push(name));
            }
            else if (stmt.type === 'FunctionDeclaration' && stmt.id) {
                declaredIds.push(stmt.id);
            }
        }
    }
    return declaredIds;
}
function getFreshName(paramName, counter, freeTarget, freeReplacement, boundTarget, boundUpperScope, boundReplacement) {
    let added = true;
    while (added) {
        added = false;
        for (const f of freeTarget) {
            if (paramName + '_' + counter === f) {
                counter++;
                added = true;
            }
        }
        for (const free of freeReplacement) {
            if (paramName + '_' + counter === free) {
                counter++;
                added = true;
            }
        }
        for (const notFree of boundTarget) {
            if (paramName + '_' + counter === notFree.name) {
                counter++;
                added = true;
            }
        }
        for (const boundName of boundUpperScope) {
            if (paramName + '_' + counter === boundName) {
                counter++;
                added = true;
            }
        }
        for (const identifier of boundReplacement) {
            if (paramName + '_' + counter === identifier.name) {
                counter++;
                added = true;
            }
        }
    }
    return paramName + '_' + counter;
}
function findMain(target, seenBefore) {
    const params = [];
    if (target.type == 'FunctionExpression' ||
        target.type == 'ArrowFunctionExpression' ||
        target.type === 'FunctionDeclaration') {
        if (target.type == 'FunctionExpression' || target.type === 'FunctionDeclaration') {
            params.push(target.id.name);
        }
        for (let i = 0; i < target.params.length; i++) {
            params.push(target.params[i].name);
        }
    }
    const freeNames = [];
    const finders = {
        Identifier(target) {
            seenBefore.set(target, target);
            let bound = false;
            for (let i = 0; i < params.length; i++) {
                if (target.name == params[i]) {
                    bound = true;
                    break;
                }
            }
            if (!bound) {
                freeNames.push(target.name);
            }
        },
        ExpressionStatement(target) {
            seenBefore.set(target, target);
            find(target.expression);
        },
        BinaryExpression(target) {
            seenBefore.set(target, target);
            find(target.left);
            find(target.right);
        },
        UnaryExpression(target) {
            seenBefore.set(target, target);
            find(target.argument);
        },
        ConditionalExpression(target) {
            seenBefore.set(target, target);
            find(target.test);
            find(target.consequent);
            find(target.alternate);
        },
        LogicalExpression(target) {
            seenBefore.set(target, target);
            find(target.left);
            find(target.right);
        },
        CallExpression(target) {
            seenBefore.set(target, target);
            for (let i = 0; i < target.arguments.length; i++) {
                find(target.arguments[i]);
            }
            find(target.callee);
        },
        FunctionDeclaration(target) {
            seenBefore.set(target, target);
            const freeInNested = findMain(target, seenBefore);
            for (const free of freeInNested) {
                let bound = false;
                for (const param of params) {
                    if (free === param) {
                        bound = true;
                    }
                }
                if (!bound) {
                    freeNames.push(free);
                }
            }
        },
        ArrowFunctionExpression(target) {
            seenBefore.set(target, target);
            const freeInNested = findMain(target, seenBefore);
            for (const free of freeInNested) {
                let bound = false;
                for (const param of params) {
                    if (free === param) {
                        bound = true;
                    }
                }
                if (!bound) {
                    freeNames.push(free);
                }
            }
        },
        Program(target) {
            seenBefore.set(target, target);
            target.body.forEach(stmt => {
                find(stmt);
            });
        },
        BlockStatement(target) {
            seenBefore.set(target, target);
            const declaredNames = (0, util_1.getDeclaredNames)(target);
            for (const item of declaredNames.values()) {
                params.push(item);
            }
            target.body.forEach(stmt => {
                find(stmt);
            });
        },
        BlockExpression(target) {
            seenBefore.set(target, target);
            const declaredNames = (0, util_1.getDeclaredNames)(target);
            for (const item of declaredNames.values()) {
                params.push(item);
            }
            target.body.forEach(stmt => {
                find(stmt);
            });
        },
        ReturnStatement(target) {
            seenBefore.set(target, target);
            find(target.argument);
        },
        VariableDeclaration(target) {
            seenBefore.set(target, target);
            target.declarations.forEach(dec => {
                find(dec);
            });
        },
        VariableDeclarator(target) {
            seenBefore.set(target, target);
            find(target.init);
        },
        IfStatement(target) {
            seenBefore.set(target, target);
            find(target.test);
            find(target.consequent);
            find(target.alternate);
        },
        ArrayExpression(target) {
            seenBefore.set(target, target);
            target.elements.forEach(ele => {
                find(ele);
            });
        }
    };
    function find(target) {
        const result = seenBefore.get(target);
        if (!result) {
            const finder = finders[target.type];
            if (finder === undefined) {
                seenBefore.set(target, target);
            }
            else {
                return finder(target);
            }
        }
    }
    find(target.body);
    return freeNames;
}
/* tslint:disable:no-shadowed-variable */
// wrapper function, calls substitute immediately.
function substituteMain(name, replacement, target, paths) {
    const seenBefore = new Map();
    // initialises array to keep track of all paths visited
    // without modifying input path array
    const allPaths = [];
    let allPathsIndex = 0;
    const endMarker = '$';
    if (paths[0] === undefined) {
        allPaths.push([]);
    }
    else {
        allPaths.push([...paths[0]]);
    }
    // substituters will stop expanding the path if index === -1
    const pathNotEnded = (index) => index > -1;
    // branches out path into two different paths,
    // returns array index of branched path
    function branch(index) {
        allPathsIndex++;
        allPaths[allPathsIndex] = [...allPaths[index]];
        return allPathsIndex;
    }
    // keeps track of names in upper scope so that it doesnt rename to these names
    const boundUpperScope = [];
    /**
     * Substituters are invoked only when the target is not seen before,
     *  therefore each function has the responsbility of registering the
     *  [target, replacement] pair in seenBefore.
     * How substituters work:
     * 1. Create dummy replacement and push [target, dummyReplacement]
     *    into the seenBefore array.
     * 2. [Recursive step] substitute the children;
     *    for each child, branch out the current path
     *    and push the appropriate access string into the path
     * 3. Return the dummyReplacement
     */
    const substituters = {
        // if name to be replaced is found,
        // push endMarker into path
        Identifier(target, index) {
            const re = / rename$/;
            if (replacement.type === 'Literal') {
                // only accept string, boolean and numbers for arguments
                if (target.name === name.name) {
                    if (pathNotEnded(index)) {
                        allPaths[index].push(endMarker);
                    }
                    return ast.primitive(replacement.value);
                }
                else {
                    return target;
                }
            }
            else if (replacement.type === 'Identifier' && re.test(replacement.name)) {
                if (target.name === name.name) {
                    if (pathNotEnded(index)) {
                        allPaths[index].push(endMarker);
                    }
                    return ast.identifier(replacement.name.split(' ')[0], replacement.loc);
                }
                else {
                    return target;
                }
            }
            else {
                if (target.name === name.name) {
                    if (pathNotEnded(index)) {
                        allPaths[index].push(endMarker);
                    }
                    return substitute(replacement, -1);
                }
                else {
                    return target;
                }
            }
        },
        ExpressionStatement(target, index) {
            const substedExpressionStatement = ast.expressionStatement((0, dummyAstCreator_1.dummyExpression)());
            seenBefore.set(target, substedExpressionStatement);
            if (pathNotEnded(index)) {
                allPaths[index].push('expression');
            }
            substedExpressionStatement.expression = substitute(target.expression, index);
            return substedExpressionStatement;
        },
        BinaryExpression(target, index) {
            const substedBinaryExpression = ast.binaryExpression(target.operator, (0, dummyAstCreator_1.dummyExpression)(), (0, dummyAstCreator_1.dummyExpression)(), target.loc);
            seenBefore.set(target, substedBinaryExpression);
            let nextIndex = index;
            if (pathNotEnded(index)) {
                nextIndex = branch(index);
                allPaths[index].push('left');
                allPaths[nextIndex].push('right');
            }
            substedBinaryExpression.left = substitute(target.left, index);
            substedBinaryExpression.right = substitute(target.right, nextIndex);
            return substedBinaryExpression;
        },
        UnaryExpression(target, index) {
            const substedUnaryExpression = ast.unaryExpression(target.operator, (0, dummyAstCreator_1.dummyExpression)(), target.loc);
            seenBefore.set(target, substedUnaryExpression);
            if (pathNotEnded(index)) {
                allPaths[index].push('argument');
            }
            substedUnaryExpression.argument = substitute(target.argument, index);
            return substedUnaryExpression;
        },
        ConditionalExpression(target, index) {
            const substedConditionalExpression = ast.conditionalExpression((0, dummyAstCreator_1.dummyExpression)(), (0, dummyAstCreator_1.dummyExpression)(), (0, dummyAstCreator_1.dummyExpression)(), target.loc);
            seenBefore.set(target, substedConditionalExpression);
            let nextIndex = index;
            let thirdIndex = index;
            if (pathNotEnded(index)) {
                nextIndex = branch(index);
                thirdIndex = branch(index);
                allPaths[index].push('test');
                allPaths[nextIndex].push('consequent');
                allPaths[thirdIndex].push('alternate');
            }
            substedConditionalExpression.test = substitute(target.test, index);
            substedConditionalExpression.consequent = substitute(target.consequent, nextIndex);
            substedConditionalExpression.alternate = substitute(target.alternate, thirdIndex);
            return substedConditionalExpression;
        },
        LogicalExpression(target, index) {
            const substedLocialExpression = ast.logicalExpression(target.operator, target.left, target.right);
            seenBefore.set(target, substedLocialExpression);
            let nextIndex = index;
            if (pathNotEnded(index)) {
                nextIndex = branch(index);
                allPaths[index].push('left');
                allPaths[nextIndex].push('right');
            }
            substedLocialExpression.left = substitute(target.left, index);
            substedLocialExpression.right = substitute(target.right, nextIndex);
            return substedLocialExpression;
        },
        CallExpression(target, index) {
            const dummyArgs = target.arguments.map(() => (0, dummyAstCreator_1.dummyExpression)());
            const substedCallExpression = ast.callExpression((0, dummyAstCreator_1.dummyExpression)(), dummyArgs, target.loc);
            seenBefore.set(target, substedCallExpression);
            const arr = [];
            let nextIndex = index;
            for (let i = 0; i < target.arguments.length; i++) {
                if (pathNotEnded(index)) {
                    nextIndex = branch(index);
                    allPaths[nextIndex].push('arguments[' + i + ']');
                }
                arr[i] = nextIndex;
                dummyArgs[i] = substitute(target.arguments[i], nextIndex);
            }
            if (pathNotEnded(index)) {
                allPaths[index].push('callee');
            }
            substedCallExpression.callee = substitute(target.callee, index);
            return substedCallExpression;
        },
        FunctionDeclaration(target, index) {
            const substedParams = [];
            // creates a copy of the params so that the renaming only happens during substitution.
            for (let i = 0; i < target.params.length; i++) {
                const param = target.params[i];
                substedParams.push(ast.identifier(param.name, param.loc));
            }
            const re = / rename$/;
            let newID;
            let newBody = target.body;
            if (replacement.type === 'Identifier' && re.test(replacement.name)) {
                // renaming function name
                newID = ast.identifier(replacement.name.split(' ')[0], replacement.loc);
            }
            else {
                newID = ast.identifier(target.id.name, target.loc);
            }
            const substedFunctionDeclaration = ast.functionDeclaration(newID, substedParams, (0, dummyAstCreator_1.dummyBlockStatement)());
            seenBefore.set(target, substedFunctionDeclaration);
            let freeReplacement = [];
            let boundReplacement = [];
            if (replacement.type == 'FunctionExpression' ||
                replacement.type == 'ArrowFunctionExpression') {
                freeReplacement = findMain(replacement, new Map());
                boundReplacement = scanOutBoundNames(replacement.body);
            }
            const freeTarget = findMain(target, new Map());
            const boundTarget = scanOutBoundNames(target.body);
            for (let i = 0; i < target.params.length; i++) {
                const param = target.params[i];
                if (param.type === 'Identifier' && param.name === name.name) {
                    substedFunctionDeclaration.body = target.body;
                    return substedFunctionDeclaration;
                }
                if (param.type == 'Identifier') {
                    if (freeReplacement.includes(param.name)) {
                        // change param name
                        const re = /_\d+$/;
                        let newNum;
                        if (re.test(param.name)) {
                            const num = param.name.split('_');
                            newNum = Number(num[1]) + 1;
                            const changedName = getFreshName(num[0], newNum, freeTarget, freeReplacement, boundTarget, boundUpperScope, boundReplacement);
                            const changed = ast.identifier(changedName, param.loc);
                            newBody = substituteMain(param, changed, target.body, [[]])[0];
                            substedFunctionDeclaration.params[i].name = changedName;
                        }
                        else {
                            newNum = 1;
                            const changedName = getFreshName(param.name, newNum, freeTarget, freeReplacement, boundTarget, boundUpperScope, boundReplacement);
                            const changed = ast.identifier(changedName, param.loc);
                            newBody = substituteMain(param, changed, target.body, [[]])[0];
                            substedFunctionDeclaration.params[i].name = changedName;
                        }
                    }
                }
            }
            for (const param of substedParams) {
                boundUpperScope.push(param.name);
            }
            if (pathNotEnded(index)) {
                allPaths[index].push('body');
            }
            substedFunctionDeclaration.body = substitute(newBody, index);
            return substedFunctionDeclaration;
        },
        FunctionExpression(target, index) {
            const substedParams = [];
            // creates a copy of the params so that the renaming only happens during substitution.
            for (let i = 0; i < target.params.length; i++) {
                const param = target.params[i];
                substedParams.push(ast.identifier(param.name, param.loc));
            }
            const substedFunctionExpression = target.id
                ? ast.functionDeclarationExpression(target.id, substedParams, (0, dummyAstCreator_1.dummyBlockStatement)())
                : ast.functionExpression(substedParams, (0, dummyAstCreator_1.dummyBlockStatement)());
            seenBefore.set(target, substedFunctionExpression);
            // check for free/bounded variable in replacement
            let freeReplacement = [];
            let boundReplacement = [];
            if (replacement.type == 'FunctionExpression' ||
                replacement.type == 'ArrowFunctionExpression') {
                freeReplacement = findMain(replacement, new Map());
                boundReplacement = scanOutBoundNames(replacement.body);
            }
            const freeTarget = findMain(target, new Map());
            const boundTarget = scanOutBoundNames(target.body);
            for (let i = 0; i < target.params.length; i++) {
                const param = target.params[i];
                if (param.type === 'Identifier' && param.name === name.name) {
                    substedFunctionExpression.body = target.body;
                    return substedFunctionExpression;
                }
                if (param.type == 'Identifier') {
                    if (freeReplacement.includes(param.name)) {
                        // change param name
                        const re = /_\d+$/;
                        let newNum;
                        if (re.test(param.name)) {
                            const num = param.name.split('_');
                            newNum = Number(num[1]) + 1;
                            const changedName = getFreshName(num[0], newNum, freeTarget, freeReplacement, boundTarget, boundUpperScope, boundReplacement);
                            const changed = ast.identifier(changedName, param.loc);
                            target.body = substituteMain(param, changed, target.body, [
                                []
                            ])[0];
                            substedFunctionExpression.params[i].name = changedName;
                        }
                        else {
                            newNum = 1;
                            const changedName = getFreshName(param.name, newNum, freeTarget, freeReplacement, boundTarget, boundUpperScope, boundReplacement);
                            const changed = ast.identifier(changedName, param.loc);
                            target.body = substituteMain(param, changed, target.body, [
                                []
                            ])[0];
                            substedFunctionExpression.params[i].name = changedName;
                        }
                    }
                }
            }
            for (const param of substedParams) {
                boundUpperScope.push(param.name);
            }
            if (pathNotEnded(index)) {
                allPaths[index].push('body');
            }
            substedFunctionExpression.body = substitute(target.body, index);
            return substedFunctionExpression;
        },
        Program(target, index) {
            const substedBody = target.body.map(() => (0, dummyAstCreator_1.dummyStatement)());
            const substedProgram = ast.program(substedBody);
            seenBefore.set(target, substedProgram);
            const declaredNames = (0, util_1.getDeclaredNames)(target);
            const re = / same/;
            // checks if the replacement is a functionExpression or arrowFunctionExpression and not from within the same block
            if ((replacement.type == 'FunctionExpression' ||
                replacement.type == 'ArrowFunctionExpression') &&
                !re.test(name.name)) {
                const freeTarget = findMain(target, new Map());
                const declaredIds = scanOutDeclarations(target);
                const freeReplacement = findMain(replacement, new Map());
                const boundReplacement = scanOutDeclarations(replacement.body);
                for (const declaredId of declaredIds) {
                    if (freeReplacement.includes(declaredId.name)) {
                        const re = /_\d+$/;
                        let newNum;
                        if (re.test(declaredId.name)) {
                            const num = declaredId.name.split('_');
                            newNum = Number(num[1]) + 1;
                            const changedName = getFreshName(num[0], newNum, freeTarget, freeReplacement, declaredIds, boundUpperScope, boundReplacement);
                            const changed = ast.identifier(changedName + ' rename', declaredId.loc);
                            const newName = ast.identifier(declaredId.name + ' rename', declaredId.loc);
                            target = substituteMain(newName, changed, target, [[]])[0];
                        }
                        else {
                            newNum = 1;
                            const changedName = getFreshName(declaredId.name, newNum, freeTarget, freeReplacement, declaredIds, boundUpperScope, boundReplacement);
                            const changed = ast.identifier(changedName + ' rename', declaredId.loc);
                            const newName = ast.identifier(declaredId.name + ' rename', declaredId.loc);
                            target = substituteMain(newName, changed, target, [[]])[0];
                        }
                    }
                }
            }
            const re2 = / rename/;
            if (declaredNames.has(name.name) && !re2.test(name.name)) {
                substedProgram.body = target.body;
                return substedProgram;
            }
            // if it is from the same block then the name would be name + " same", hence need to remove " same"
            // if not this statement does nothing as variable names should not have spaces
            name.name = name.name.split(' ')[0];
            const arr = [];
            let nextIndex = index;
            for (let i = 1; i < target.body.length; i++) {
                if (pathNotEnded(index)) {
                    nextIndex = branch(index);
                    allPaths[nextIndex].push('body[' + i + ']');
                }
                arr[i] = nextIndex;
            }
            if (pathNotEnded(index)) {
                allPaths[index].push('body[0]');
            }
            arr[0] = index;
            let arrIndex = -1;
            substedProgram.body = target.body.map(stmt => {
                arrIndex++;
                return substitute(stmt, arr[arrIndex]);
            });
            return substedProgram;
        },
        BlockStatement(target, index) {
            const substedBody = target.body.map(() => (0, dummyAstCreator_1.dummyStatement)());
            const substedBlockStatement = ast.blockStatement(substedBody);
            seenBefore.set(target, substedBlockStatement);
            const declaredNames = (0, util_1.getDeclaredNames)(target);
            const re = / same/;
            // checks if the replacement is a functionExpression or arrowFunctionExpression and not from within the same block
            if ((replacement.type == 'FunctionExpression' ||
                replacement.type == 'ArrowFunctionExpression') &&
                !re.test(name.name)) {
                const freeTarget = findMain(target, new Map());
                const declaredIds = scanOutDeclarations(target);
                const freeReplacement = findMain(replacement, new Map());
                const boundReplacement = scanOutDeclarations(replacement.body);
                for (const declaredId of declaredIds) {
                    if (freeReplacement.includes(declaredId.name)) {
                        const re = /_\d+$/;
                        let newNum;
                        if (re.test(declaredId.name)) {
                            const num = declaredId.name.split('_');
                            newNum = Number(num[1]) + 1;
                            const changedName = getFreshName(num[0], newNum, freeTarget, freeReplacement, declaredIds, boundUpperScope, boundReplacement);
                            const changed = ast.identifier(changedName + ' rename', declaredId.loc);
                            const newName = ast.identifier(declaredId.name + ' rename', declaredId.loc);
                            target = substituteMain(newName, changed, target, [[]])[0];
                        }
                        else {
                            newNum = 1;
                            const changedName = getFreshName(declaredId.name, newNum, freeTarget, freeReplacement, declaredIds, boundUpperScope, boundReplacement);
                            const changed = ast.identifier(changedName + ' rename', declaredId.loc);
                            const newName = ast.identifier(declaredId.name + ' rename', declaredId.loc);
                            target = substituteMain(newName, changed, target, [[]])[0];
                        }
                    }
                }
            }
            const re2 = / rename/;
            if (declaredNames.has(name.name) && !re2.test(name.name)) {
                substedBlockStatement.body = target.body;
                return substedBlockStatement;
            }
            // if it is from the same block then the name would be name + " same", hence need to remove " same"
            // if not this statement does nothing as variable names should not have spaces
            name.name = name.name.split(' ')[0];
            const arr = [];
            let nextIndex = index;
            for (let i = 1; i < target.body.length; i++) {
                if (pathNotEnded(index)) {
                    nextIndex = branch(index);
                    allPaths[nextIndex].push('body[' + i + ']');
                }
                arr[i] = nextIndex;
            }
            if (pathNotEnded(index)) {
                allPaths[index].push('body[0]');
            }
            arr[0] = index;
            let arrIndex = -1;
            substedBlockStatement.body = target.body.map(stmt => {
                arrIndex++;
                return substitute(stmt, arr[arrIndex]);
            });
            return substedBlockStatement;
        },
        BlockExpression(target, index) {
            const substedBody = target.body.map(() => (0, dummyAstCreator_1.dummyStatement)());
            const substedBlockExpression = ast.blockExpression(substedBody);
            seenBefore.set(target, substedBlockExpression);
            const declaredNames = (0, util_1.getDeclaredNames)(target);
            const re = / same/;
            // checks if the replacement is a functionExpression or arrowFunctionExpression and not from within the same block
            if ((replacement.type == 'FunctionExpression' ||
                replacement.type == 'ArrowFunctionExpression') &&
                !re.test(name.name)) {
                const freeTarget = findMain(target, new Map());
                const declaredIds = scanOutDeclarations(target);
                const freeReplacement = findMain(replacement, new Map());
                const boundReplacement = scanOutDeclarations(replacement.body);
                for (const declaredId of declaredIds) {
                    if (freeReplacement.includes(declaredId.name)) {
                        const re = /_\d+$/;
                        let newNum;
                        if (re.test(declaredId.name)) {
                            const num = declaredId.name.split('_');
                            newNum = Number(num[1]) + 1;
                            const changedName = getFreshName(num[0], newNum, freeTarget, freeReplacement, declaredIds, boundUpperScope, boundReplacement);
                            const changed = ast.identifier(changedName + ' rename', declaredId.loc);
                            const newName = ast.identifier(declaredId.name + ' rename', declaredId.loc);
                            target = substituteMain(newName, changed, target, [[]])[0];
                        }
                        else {
                            newNum = 1;
                            const changedName = getFreshName(declaredId.name, newNum, freeTarget, freeReplacement, declaredIds, boundUpperScope, boundReplacement);
                            const changed = ast.identifier(changedName + ' rename', declaredId.loc);
                            const newName = ast.identifier(declaredId.name + ' rename', declaredId.loc);
                            target = substituteMain(newName, changed, target, [[]])[0];
                        }
                    }
                }
            }
            const re2 = / rename/;
            if (declaredNames.has(name.name) && !re2.test(name.name)) {
                substedBlockExpression.body = target.body;
                return substedBlockExpression;
            }
            // if it is from the same block then the name would be name + " same", hence need to remove " same"
            // if not this statement does nothing as variable names should not have spaces
            name.name = name.name.split(' ')[0];
            const arr = [];
            let nextIndex = index;
            for (let i = 1; i < target.body.length; i++) {
                if (pathNotEnded(index)) {
                    nextIndex = branch(index);
                    allPaths[nextIndex].push('body[' + i + ']');
                }
                arr[i] = nextIndex;
            }
            if (pathNotEnded(index)) {
                allPaths[index].push('body[0]');
            }
            arr[0] = index;
            let arrIndex = -1;
            substedBlockExpression.body = target.body.map(stmt => {
                arrIndex++;
                return substitute(stmt, arr[arrIndex]);
            });
            return substedBlockExpression;
        },
        ReturnStatement(target, index) {
            const substedReturnStatement = ast.returnStatement((0, dummyAstCreator_1.dummyExpression)(), target.loc);
            seenBefore.set(target, substedReturnStatement);
            if (pathNotEnded(index)) {
                allPaths[index].push('argument');
            }
            substedReturnStatement.argument = substitute(target.argument, index);
            return substedReturnStatement;
        },
        // source 1
        ArrowFunctionExpression(target, index) {
            // creates a copy of the parameters so that renaming only happens during substitution
            const substedParams = [];
            for (let i = 0; i < target.params.length; i++) {
                const param = target.params[i];
                substedParams.push(ast.identifier(param.name, param.loc));
            }
            let newBody = target.body;
            const substedArrow = ast.arrowFunctionExpression(substedParams, (0, dummyAstCreator_1.dummyBlockStatement)());
            seenBefore.set(target, substedArrow);
            // check for free/bounded variable
            let freeReplacement = [];
            let boundReplacement = [];
            if (replacement.type == 'FunctionExpression' ||
                replacement.type == 'ArrowFunctionExpression') {
                freeReplacement = findMain(replacement, new Map());
                boundReplacement = scanOutBoundNames(replacement.body);
            }
            for (let i = 0; i < target.params.length; i++) {
                const param = target.params[i];
                if (param.type === 'Identifier' && param.name === name.name) {
                    substedArrow.body = target.body;
                    substedArrow.expression = target.body.type !== 'BlockStatement';
                    return substedArrow;
                }
                const freeTarget = findMain(target, new Map());
                const boundTarget = scanOutBoundNames(target.body);
                if (param.type == 'Identifier') {
                    if (freeReplacement.includes(param.name)) {
                        // change param name
                        const re = /_\d+$/;
                        let newNum;
                        if (re.test(param.name)) {
                            const num = param.name.split('_');
                            newNum = Number(num[1]) + 1;
                            const changedName = getFreshName(num[0], newNum, freeTarget, freeReplacement, boundTarget, boundUpperScope, boundReplacement);
                            const changed = ast.identifier(changedName, param.loc);
                            newBody = substituteMain(param, changed, target.body, [[]])[0];
                            substedArrow.params[i].name = changedName; // num[0] + '_' + newNum
                        }
                        else {
                            newNum = 1;
                            const changedName = getFreshName(param.name, newNum, freeTarget, freeReplacement, boundTarget, boundUpperScope, boundReplacement);
                            const changed = ast.identifier(changedName, param.loc);
                            newBody = substituteMain(param, changed, target.body, [[]])[0];
                            substedArrow.params[i].name = changedName;
                        }
                    }
                }
            }
            for (const param of substedParams) {
                boundUpperScope.push(param.name);
            }
            for (const param of target.params) {
                if (param.type === 'Identifier' && param.name === name.name) {
                    substedArrow.body = target.body;
                    substedArrow.expression = target.body.type !== 'BlockStatement';
                    return substedArrow;
                }
            }
            if (pathNotEnded(index)) {
                allPaths[index].push('body');
            }
            substedArrow.body = substitute(newBody, index);
            substedArrow.expression = target.body.type !== 'BlockStatement';
            return substedArrow;
        },
        VariableDeclaration(target, index) {
            const substedVariableDeclaration = ast.variableDeclaration([(0, dummyAstCreator_1.dummyVariableDeclarator)()]);
            seenBefore.set(target, substedVariableDeclaration);
            const arr = [];
            let nextIndex = index;
            for (let i = 1; i < target.declarations.length; i++) {
                if (pathNotEnded(index)) {
                    nextIndex = branch(index);
                    allPaths[nextIndex].push('declarations[' + i + ']');
                }
                arr[i] = nextIndex;
            }
            if (pathNotEnded(index)) {
                allPaths[index].push('declarations[0]');
            }
            arr[0] = index;
            let arrIndex = -1;
            substedVariableDeclaration.declarations = target.declarations.map(dec => {
                arrIndex++;
                return substitute(dec, arr[arrIndex]);
            });
            return substedVariableDeclaration;
        },
        VariableDeclarator(target, index) {
            const subbed = ast.identifier(target.id.name);
            let substedVariableDeclarator = ast.variableDeclarator(subbed, (0, dummyAstCreator_1.dummyExpression)());
            seenBefore.set(target, substedVariableDeclarator);
            const re = / rename$/;
            if (target.id.type === 'Identifier' && name.name === target.id.name) {
                if (replacement.type == 'Identifier' && re.test(replacement.name)) {
                    const newName = ast.identifier(replacement.name.split(' ')[0], replacement.loc);
                    substedVariableDeclarator = ast.variableDeclarator(newName, (0, dummyAstCreator_1.dummyExpression)());
                }
                substedVariableDeclarator.init = target.init;
            }
            else {
                if (pathNotEnded(index)) {
                    allPaths[index].push('init');
                }
                substedVariableDeclarator.init = substitute(target.init, index);
            }
            return substedVariableDeclarator;
        },
        IfStatement(target, index) {
            const substedIfStatement = ast.ifStatement((0, dummyAstCreator_1.dummyExpression)(), (0, dummyAstCreator_1.dummyBlockStatement)(), (0, dummyAstCreator_1.dummyBlockStatement)(), target.loc);
            seenBefore.set(target, substedIfStatement);
            let nextIndex = index;
            let thirdIndex = index;
            if (pathNotEnded(index)) {
                nextIndex = branch(index);
                thirdIndex = branch(index);
                allPaths[index].push('test');
                allPaths[nextIndex].push('consequent');
                allPaths[thirdIndex].push('alternate');
            }
            substedIfStatement.test = substitute(target.test, index);
            substedIfStatement.consequent = substitute(target.consequent, nextIndex);
            substedIfStatement.alternate = target.alternate
                ? substitute(target.alternate, thirdIndex)
                : null;
            return substedIfStatement;
        },
        ArrayExpression(target, index) {
            const substedArray = ast.arrayExpression([(0, dummyAstCreator_1.dummyExpression)()]);
            seenBefore.set(target, substedArray);
            const arr = [];
            let nextIndex = index;
            for (let i = 1; i < target.elements.length; i++) {
                if (pathNotEnded(index)) {
                    nextIndex = branch(index);
                    allPaths[nextIndex].push('elements[' + i + ']');
                }
                arr[i] = nextIndex;
            }
            if (pathNotEnded(index)) {
                allPaths[index].push('elements[0]');
            }
            arr[0] = index;
            let arrIndex = -1;
            substedArray.elements = target.elements.map(ele => {
                arrIndex++;
                return substitute(ele, arr[arrIndex]);
            });
            return substedArray;
        }
    };
    /**
     * For mapper use, maps a [symbol, value] pair to the node supplied.
     * @param name the name to be replaced
     * @param replacement the expression to replace the name with
     * @param node a node holding the target symbols
     * @param seenBefore a list of nodes that are seen before in substitution
     */
    function substitute(target, index) {
        const result = seenBefore.get(target);
        if (result) {
            return result;
        }
        const substituter = substituters[target.type];
        if (substituter === undefined) {
            seenBefore.set(target, target);
            return target; // no need to subst, such as literals
        }
        else {
            // substituters are responsible of registering seenBefore
            return substituter(target, index);
        }
    }
    // after running substitute,
    // find paths that contain endMarker
    // and return only those paths
    const substituted = substitute(target, 0);
    const validPaths = [];
    for (const path of allPaths) {
        if (path[path.length - 1] === endMarker) {
            validPaths.push(path.slice(0, path.length - 1));
        }
    }
    return [substituted, validPaths];
}
/**
 * Substitutes a call expression with the body of the callee (funExp)
 * and the body will have all ocurrences of parameters substituted
 * with the arguments.
 * @param callee call expression with callee as functionExpression
 * @param args arguments supplied to the call expression
 */
function apply(callee, args) {
    let substedBody = callee.body;
    let substedParams = callee.params;
    for (let i = 0; i < args.length; i++) {
        // source discipline requires parameters to be identifiers.
        const arg = args[i];
        if (arg.type === 'ArrowFunctionExpression' || arg.type === 'FunctionExpression') {
            const freeTarget = findMain(ast.arrowFunctionExpression(substedParams, substedBody), new Map());
            const declaredIds = substedParams;
            const freeReplacement = findMain(arg, new Map());
            const boundReplacement = scanOutDeclarations(arg.body);
            for (const declaredId of declaredIds) {
                if (freeReplacement.includes(declaredId.name)) {
                    const re = /_\d+$/;
                    let newNum;
                    if (re.test(declaredId.name)) {
                        const num = declaredId.name.split('_');
                        newNum = Number(num[1]) + 1;
                        const changedName = getFreshName(num[0], newNum, freeTarget, freeReplacement, declaredIds, [], boundReplacement);
                        const changed = ast.identifier(changedName + ' rename', declaredId.loc);
                        const newName = ast.identifier(declaredId.name + ' rename', declaredId.loc);
                        substedBody = substituteMain(newName, changed, substedBody, [
                            []
                        ])[0];
                        substedParams = substedParams.map(param => param.name === declaredId.name ? changed : param);
                    }
                    else {
                        newNum = 1;
                        const changedName = getFreshName(declaredId.name, newNum, freeTarget, freeReplacement, declaredIds, [], boundReplacement);
                        const changed = ast.identifier(changedName + ' rename', declaredId.loc);
                        const newName = ast.identifier(declaredId.name + ' rename', declaredId.loc);
                        substedBody = substituteMain(newName, changed, substedBody, [
                            []
                        ])[0];
                        substedParams = substedParams.map(param => param.name === declaredId.name ? changed : param);
                    }
                }
            }
        }
        // source discipline requires parameters to be identifiers.
        const param = substedParams[i];
        substedBody = substituteMain(param, arg, substedBody, [[]])[0];
    }
    if (callee.type === 'ArrowFunctionExpression' && callee.expression) {
        return substedBody;
    }
    const firstStatement = substedBody.body[0];
    return firstStatement && firstStatement.type === 'ReturnStatement'
        ? firstStatement.argument
        : ast.blockExpression(substedBody.body);
}
// Wrapper function to house reduce, explain and bodify
function reduceMain(node, context) {
    // variable to control verbosity of bodify
    let verbose = true;
    // converts body of code to string
    function bodify(target) {
        const bodifiers = {
            Literal: (target) => target.raw !== undefined ? target.raw : String(target.value),
            Identifier: (target) => target.name.startsWith('anonymous_') ? 'anonymous function' : target.name,
            ExpressionStatement: (target) => bodify(target.expression) + ' finished evaluating',
            BinaryExpression: (target) => bodify(target.left) + ' ' + target.operator + ' ' + bodify(target.right),
            UnaryExpression: (target) => target.operator + bodify(target.argument),
            ConditionalExpression: (target) => bodify(target.test) + ' ? ' + bodify(target.consequent) + ' : ' + bodify(target.alternate),
            LogicalExpression: (target) => bodify(target.left) + ' ' + target.operator + ' ' + bodify(target.right),
            CallExpression: (target) => {
                if (target.callee.type === 'ArrowFunctionExpression') {
                    return '(' + bodify(target.callee) + ')(' + target.arguments.map(bodify) + ')';
                }
                else {
                    return bodify(target.callee) + '(' + target.arguments.map(bodify) + ')';
                }
            },
            FunctionDeclaration: (target) => {
                const funcName = target.id !== null ? target.id.name : 'error';
                return ('Function ' +
                    funcName +
                    ' declared' +
                    (target.params.length > 0
                        ? ', parameter(s) ' + target.params.map(bodify) + ' required'
                        : ''));
            },
            FunctionExpression: (target) => {
                const id = target.id;
                return id === null || id === undefined ? '...' : id.name;
            },
            ReturnStatement: (target) => bodify(target.argument) + ' returned',
            // guards against infinite text generation
            ArrowFunctionExpression: (target) => {
                if (verbose) {
                    verbose = false;
                    const redacted = (target.params.length > 0 ? target.params.map(bodify) : '()') +
                        ' => ' +
                        bodify(target.body);
                    verbose = true;
                    return redacted;
                }
                else {
                    return (target.params.length > 0 ? target.params.map(bodify) : '()') + ' => ...';
                }
            },
            VariableDeclaration: (target) => 'Constant ' +
                bodify(target.declarations[0].id) +
                ' declared and substituted into rest of block',
            ArrayExpression: (target) => '[' +
                bodify(target.elements[0]) +
                ', ' +
                bodify(target.elements[1]) +
                ']'
        };
        const bodifier = bodifiers[target.type];
        return bodifier === undefined ? '...' : bodifier(target);
    }
    // generates string to explain current step
    function explain(target) {
        const explainers = {
            BinaryExpression: (target) => 'Binary expression ' + bodify(target) + ' evaluated',
            UnaryExpression: (target) => {
                return ('Unary expression evaluated, ' +
                    (target.operator === '!' ? 'boolean ' : 'value ') +
                    bodify(target.argument) +
                    ' negated');
            },
            ConditionalExpression: (target) => {
                return ('Conditional expression evaluated, condition is ' +
                    (bodify(target.test) === 'true'
                        ? 'true, consequent evaluated'
                        : 'false, alternate evaluated'));
            },
            LogicalExpression: (target) => {
                return target.operator === '&&'
                    ? 'AND operation evaluated, left of operator is ' +
                        (bodify(target.left) === 'true'
                            ? 'true, continue evaluating right of operator'
                            : 'false, stop evaluation')
                    : 'OR operation evaluated, left of operator is ' +
                        (bodify(target.left) === 'true'
                            ? 'true, stop evaluation'
                            : 'false, continue evaluating right of operator');
            },
            CallExpression: (target) => {
                if (target.callee.type === 'ArrowFunctionExpression') {
                    if (target.callee.params.length === 0) {
                        return bodify(target.callee) + ' runs';
                    }
                    else {
                        return (target.arguments.map(bodify) +
                            ' substituted into ' +
                            target.callee.params.map(bodify) +
                            ' of ' +
                            bodify(target.callee));
                    }
                }
                else if (target.callee.type === 'FunctionExpression') {
                    if (target.callee.params.length === 0) {
                        return 'Function ' + bodify(target.callee) + ' runs';
                    }
                    else {
                        return ('Function ' +
                            bodify(target.callee) +
                            ' takes in ' +
                            target.arguments.map(bodify) +
                            ' as input ' +
                            target.callee.params.map(bodify));
                    }
                }
                else {
                    return bodify(target.callee) + ' runs';
                }
            },
            Program: (target) => bodify(target.body[0]),
            BlockExpression: (target) => target.body.length === 0 ? 'Empty block statement evaluated' : bodify(target.body[0]),
            BlockStatement: (target) => target.body.length === 0 ? 'Empty block statement evaluated' : bodify(target.body[0]),
            IfStatement: (target) => {
                return ('If statement evaluated, ' +
                    (bodify(target.test) === 'true'
                        ? 'condition true, proceed to if block'
                        : 'condition false, proceed to else block'));
            }
        };
        const explainer = explainers[target.type];
        return explainer === undefined ? '...' : explainer(target);
    }
    const reducers = {
        // source 0
        Identifier(node, context, paths) {
            // can only be built ins. the rest should have been declared
            if (!((0, util_1.isAllowedLiterals)(node) || (0, util_1.isBuiltinFunction)(node) || (0, util_1.isImportedFunction)(node, context))) {
                throw new errors.UndefinedVariable(node.name, node);
            }
            else {
                return [node, context, paths, 'identifier'];
            }
        },
        ExpressionStatement(node, context, paths) {
            paths[0].push('expression');
            const [reduced, cont, path, str] = reduce(node.expression, context, paths);
            return [ast.expressionStatement(reduced), cont, path, str];
        },
        BinaryExpression(node, context, paths) {
            const { operator, left, right } = node;
            if (isIrreducible(left, context)) {
                if (isIrreducible(right, context)) {
                    // if the ast are the same, then the values are the same
                    if (builtin.is_function(left).value &&
                        builtin.is_function(right).value &&
                        operator === '===') {
                        return [(0, converter_1.valueToExpression)(left === right), context, paths, explain(node)];
                    }
                    const [leftValue, rightValue] = [left, right].map(converter_1.nodeToValue);
                    const error = rttc.checkBinaryExpression(node, operator, context.chapter, leftValue, rightValue);
                    if (error === undefined) {
                        const lit = (0, operators_1.evaluateBinaryExpression)(operator, leftValue, rightValue);
                        return [(0, converter_1.valueToExpression)(lit, context), context, paths, explain(node)];
                    }
                    else {
                        throw error;
                    }
                }
                else {
                    paths[0].push('right');
                    const [reducedRight, cont, path, str] = reduce(right, context, paths);
                    const reducedExpression = ast.binaryExpression(operator, left, reducedRight, node.loc);
                    return [reducedExpression, cont, path, str];
                }
            }
            else {
                paths[0].push('left');
                const [reducedLeft, cont, path, str] = reduce(left, context, paths);
                const reducedExpression = ast.binaryExpression(operator, reducedLeft, right, node.loc);
                return [reducedExpression, cont, path, str];
            }
        },
        UnaryExpression(node, context, paths) {
            const { operator, argument } = node;
            if (isIrreducible(argument, context)) {
                // tslint:disable-next-line
                const argumentValue = (0, converter_1.nodeToValue)(argument);
                const error = rttc.checkUnaryExpression(node, operator, argumentValue, context.chapter);
                if (error === undefined) {
                    const result = (0, operators_1.evaluateUnaryExpression)(operator, argumentValue);
                    return [(0, converter_1.valueToExpression)(result, context), context, paths, explain(node)];
                }
                else {
                    throw error;
                }
            }
            else {
                paths[0].push('argument');
                const [reducedArgument, cont, path, str] = reduce(argument, context, paths);
                const reducedExpression = ast.unaryExpression(operator, reducedArgument, node.loc);
                return [reducedExpression, cont, path, str];
            }
        },
        ConditionalExpression(node, context, paths) {
            const { test, consequent, alternate } = node;
            if (test.type === 'Literal') {
                const error = rttc.checkIfStatement(node, test.value, context.chapter);
                if (error === undefined) {
                    return [
                        (test.value ? consequent : alternate),
                        context,
                        paths,
                        explain(node)
                    ];
                }
                else {
                    throw error;
                }
            }
            else {
                paths[0].push('test');
                const [reducedTest, cont, path, str] = reduce(test, context, paths);
                const reducedExpression = ast.conditionalExpression(reducedTest, consequent, alternate, node.loc);
                return [reducedExpression, cont, path, str];
            }
        },
        LogicalExpression(node, context, paths) {
            const { left, right } = node;
            if (isIrreducible(left, context)) {
                if (!(left.type === 'Literal' && typeof left.value === 'boolean')) {
                    throw new rttc.TypeError(left, ' on left hand side of operation', 'boolean', left.type);
                }
                else {
                    const result = node.operator === '&&'
                        ? left.value
                            ? right
                            : ast.literal(false, node.loc)
                        : left.value
                            ? ast.literal(true, node.loc)
                            : right;
                    return [result, context, paths, explain(node)];
                }
            }
            else {
                paths[0].push('left');
                const [reducedLeft, cont, path, str] = reduce(left, context, paths);
                return [
                    ast.logicalExpression(node.operator, reducedLeft, right, node.loc),
                    cont,
                    path,
                    str
                ];
            }
        },
        // core of the subst model
        CallExpression(node, context, paths) {
            const [callee, args] = [node.callee, node.arguments];
            // source 0: discipline: any expression can be transformed into either literal, ident(builtin) or funexp
            // if functor can reduce, reduce functor
            if (!isIrreducible(callee, context)) {
                paths[0].push('callee');
                const [reducedCallee, cont, path, str] = reduce(callee, context, paths);
                return [
                    ast.callExpression(reducedCallee, args, node.loc),
                    cont,
                    path,
                    str
                ];
            }
            else if (callee.type === 'Literal') {
                throw new errors.CallingNonFunctionValue(callee, node);
            }
            else if (callee.type === 'Identifier' &&
                !(callee.name in context.runtime.environments[0].head)) {
                throw new errors.UndefinedVariable(callee.name, callee);
            }
            else {
                // callee is builtin or funexp
                if ((callee.type === 'FunctionExpression' || callee.type === 'ArrowFunctionExpression') &&
                    args.length !== callee.params.length) {
                    throw new errors.InvalidNumberOfArguments(node, args.length, callee.params.length);
                }
                else {
                    for (let i = 0; i < args.length; i++) {
                        const currentArg = args[i];
                        if (!isIrreducible(currentArg, context)) {
                            paths[0].push('arguments[' + i + ']');
                            const [reducedCurrentArg, cont, path, str] = reduce(currentArg, context, paths);
                            const reducedArgs = [...args.slice(0, i), reducedCurrentArg, ...args.slice(i + 1)];
                            return [
                                ast.callExpression(callee, reducedArgs, node.loc),
                                cont,
                                path,
                                str
                            ];
                        }
                        if (currentArg.type === 'Identifier' &&
                            !(currentArg.name in context.runtime.environments[0].head)) {
                            throw new errors.UndefinedVariable(currentArg.name, currentArg);
                        }
                    }
                }
                // if it reaches here, means all the arguments are legal.
                if (['FunctionExpression', 'ArrowFunctionExpression'].includes(callee.type)) {
                    return [
                        apply(callee, args),
                        context,
                        paths,
                        explain(node)
                    ];
                }
                else {
                    if (callee.name.includes('math')) {
                        return [
                            builtin.evaluateMath(callee.name, ...args),
                            context,
                            paths,
                            explain(node)
                        ];
                    }
                    else if (typeof builtin[callee.name] === 'function') {
                        return [builtin[callee.name](...args), context, paths, explain(node)];
                    }
                    return [
                        builtin.evaluateModuleFunction(callee.name, context, ...args),
                        context,
                        paths,
                        explain(node)
                    ];
                }
            }
        },
        Program(node, context, paths) {
            if (node.body.length === 0) {
                return [ast.expressionStatement(ast.identifier('undefined')), context, paths, explain(node)];
            }
            else {
                const [firstStatement, ...otherStatements] = node.body;
                if (firstStatement.type === 'ReturnStatement') {
                    return [firstStatement, context, paths, explain(node)];
                }
                else if (firstStatement.type === 'IfStatement') {
                    paths[0].push('body[0]');
                    const [reduced, cont, path, str] = reduce(firstStatement, context, paths);
                    if (reduced.type === 'BlockStatement') {
                        const body = reduced.body;
                        if (body.length > 1) {
                            path[1] = [...path[0].slice(0, path[0].length - 1)];
                        }
                        const wholeBlock = body.concat(...otherStatements);
                        return [ast.program(wholeBlock), cont, path, str];
                    }
                    else {
                        return [
                            ast.program([reduced, ...otherStatements]),
                            cont,
                            path,
                            str
                        ];
                    }
                }
                else if (firstStatement.type === 'ExpressionStatement' &&
                    isIrreducible(firstStatement.expression, context)) {
                    // let stmt
                    // if (otherStatements.length > 0) {
                    paths[0].push('body[0]');
                    paths.push([]);
                    const stmt = ast.program(otherStatements);
                    // } else {
                    //   stmt = ast.expressionStatement(firstStatement.expression)
                    // }
                    return [stmt, context, paths, explain(node)];
                }
                else if (firstStatement.type === 'FunctionDeclaration') {
                    if (firstStatement.id === null) {
                        throw new Error('Encountered a FunctionDeclaration node without an identifier. This should have been caught when parsing.');
                    }
                    let funDecExp = ast.functionDeclarationExpression(firstStatement.id, firstStatement.params, firstStatement.body);
                    // substitute body
                    funDecExp = substituteMain(funDecExp.id, funDecExp, funDecExp, [
                        []
                    ])[0];
                    // substitute the rest of the program
                    const remainingProgram = ast.program(otherStatements);
                    // substitution within the same program, add " same" so that substituter can differentiate between
                    // substitution within the program and substitution from outside the program
                    const newId = ast.identifier(funDecExp.id.name + ' same', funDecExp.id.loc);
                    const subst = substituteMain(newId, funDecExp, remainingProgram, paths);
                    // concats paths such that:
                    // paths[0] -> path to the program to be substituted, pre-redex
                    // paths[1...] -> path(s) to the parts of the remaining program
                    // that were substituted, post-redex
                    paths[0].push('body[0]');
                    const allPaths = paths.concat(subst[1]);
                    if (subst[1].length === 0) {
                        allPaths.push([]);
                    }
                    return [subst[0], context, allPaths, explain(node)];
                }
                else if (firstStatement.type === 'VariableDeclaration') {
                    const { kind, declarations } = firstStatement;
                    if (kind !== 'const') {
                        // TODO: cannot use let or var
                        return [(0, dummyAstCreator_1.dummyProgram)(), context, paths, 'cannot use let or var'];
                    }
                    else if (declarations.length <= 0 ||
                        declarations.length > 1 ||
                        declarations[0].type !== 'VariableDeclarator' ||
                        !declarations[0].init) {
                        // TODO: syntax error
                        return [(0, dummyAstCreator_1.dummyProgram)(), context, paths, 'syntax error'];
                    }
                    else {
                        const declarator = declarations[0];
                        const rhs = declarator.init;
                        if (declarator.id.type !== 'Identifier') {
                            // TODO: source does not allow destructuring
                            return [(0, dummyAstCreator_1.dummyProgram)(), context, paths, 'source does not allow destructuring'];
                        }
                        else if (isIrreducible(rhs, context)) {
                            const remainingProgram = ast.program(otherStatements);
                            // force casting for weird errors
                            // substitution within the same program, add " same" so that substituter can differentiate between
                            // substitution within the program and substitution from outside the program
                            const newId = ast.identifier(declarator.id.name + ' same', declarator.id.loc);
                            const subst = substituteMain(newId, rhs, remainingProgram, paths);
                            // concats paths such that:
                            // paths[0] -> path to the program to be substituted, pre-redex
                            // paths[1...] -> path(s) to the parts of the remaining program
                            // that were substituted, post-redex
                            paths[0].push('body[0]');
                            const allPaths = paths.concat(subst[1]);
                            if (subst[1].length === 0) {
                                allPaths.push([]);
                            }
                            return [subst[0], context, allPaths, explain(node)];
                        }
                        else if (rhs.type === 'ArrowFunctionExpression' ||
                            rhs.type === 'FunctionExpression') {
                            let funDecExp = ast.functionDeclarationExpression(declarator.id, rhs.params, rhs.body.type === 'BlockStatement'
                                ? rhs.body
                                : ast.blockStatement([ast.returnStatement(rhs.body)]));
                            // substitute body
                            funDecExp = substituteMain(funDecExp.id, funDecExp, funDecExp, [
                                []
                            ])[0];
                            // substitute the rest of the program
                            const remainingProgram = ast.program(otherStatements);
                            // substitution within the same block, add " same" so that substituter can differentiate between
                            // substitution within the block and substitution from outside the block
                            const newId = ast.identifier(funDecExp.id.name + ' same', funDecExp.id.loc);
                            const subst = substituteMain(newId, funDecExp, remainingProgram, paths);
                            // concats paths such that:
                            // paths[0] -> path to the program to be substituted, pre-redex
                            // paths[1...] -> path(s) to the parts of the remaining program
                            // that were substituted, post-redex
                            paths[0].push('body[0]');
                            const allPaths = paths.concat(subst[1]);
                            if (subst[1].length === 0) {
                                allPaths.push([]);
                            }
                            return [subst[0], context, allPaths, explain(node)];
                        }
                        else {
                            paths[0].push('body[0]');
                            paths[0].push('declarations[0]');
                            paths[0].push('init');
                            const [reducedRhs, cont, path, str] = reduce(rhs, context, paths);
                            return [
                                ast.program([
                                    ast.declaration(declarator.id.name, 'const', reducedRhs),
                                    ...otherStatements
                                ]),
                                cont,
                                path,
                                str
                            ];
                        }
                    }
                }
                paths[0].push('body[0]');
                const [reduced, cont, path, str] = reduce(firstStatement, context, paths);
                return [
                    ast.program([reduced, ...otherStatements]),
                    cont,
                    path,
                    str
                ];
            }
        },
        BlockStatement(node, context, paths) {
            if (node.body.length === 0) {
                return [ast.expressionStatement(ast.identifier('undefined')), context, paths, explain(node)];
            }
            else {
                const [firstStatement, ...otherStatements] = node.body;
                if (firstStatement.type === 'ReturnStatement') {
                    return [firstStatement, context, paths, explain(node)];
                }
                else if (firstStatement.type === 'IfStatement') {
                    paths[0].push('body[0]');
                    const [reduced, cont, path, str] = reduce(firstStatement, context, paths);
                    if (reduced.type === 'BlockStatement') {
                        const body = reduced.body;
                        if (body.length > 1) {
                            path[1] = [...path[0].slice(0, path[0].length - 1)];
                        }
                        const wholeBlock = body.concat(...otherStatements);
                        return [ast.blockStatement(wholeBlock), cont, path, str];
                    }
                    else {
                        return [
                            ast.blockStatement([reduced, ...otherStatements]),
                            cont,
                            path,
                            str
                        ];
                    }
                }
                else if (firstStatement.type === 'ExpressionStatement' &&
                    isIrreducible(firstStatement.expression, context)) {
                    let stmt;
                    if (otherStatements.length > 0) {
                        paths[0].push('body[0]');
                        paths.push([]);
                        stmt = ast.blockStatement(otherStatements);
                    }
                    else {
                        stmt = ast.expressionStatement(firstStatement.expression);
                    }
                    return [stmt, context, paths, explain(node)];
                }
                else if (firstStatement.type === 'FunctionDeclaration') {
                    let funDecExp = ast.functionDeclarationExpression(firstStatement.id, firstStatement.params, firstStatement.body);
                    // substitute body
                    funDecExp = substituteMain(funDecExp.id, funDecExp, funDecExp, [
                        []
                    ])[0];
                    // substitute the rest of the blockStatement
                    const remainingBlockStatement = ast.blockStatement(otherStatements);
                    // substitution within the same block, add " same" so that substituter can differentiate between
                    // substitution within the block and substitution from outside the block
                    const newId = ast.identifier(funDecExp.id.name + ' same', funDecExp.id.loc);
                    const subst = substituteMain(newId, funDecExp, remainingBlockStatement, paths);
                    // concats paths such that:
                    // paths[0] -> path to the program to be substituted, pre-redex
                    // paths[1...] -> path(s) to the parts of the remaining program
                    // that were substituted, post-redex
                    paths[0].push('body[0]');
                    const allPaths = paths.concat(subst[1]);
                    if (subst[1].length === 0) {
                        allPaths.push([]);
                    }
                    return [subst[0], context, allPaths, explain(node)];
                }
                else if (firstStatement.type === 'VariableDeclaration') {
                    const { kind, declarations } = firstStatement;
                    if (kind !== 'const') {
                        // TODO: cannot use let or var
                        return [(0, dummyAstCreator_1.dummyBlockStatement)(), context, paths, 'cannot use let or var'];
                    }
                    else if (declarations.length <= 0 ||
                        declarations.length > 1 ||
                        declarations[0].type !== 'VariableDeclarator' ||
                        !declarations[0].init) {
                        // TODO: syntax error
                        return [(0, dummyAstCreator_1.dummyBlockStatement)(), context, paths, 'syntax error'];
                    }
                    else {
                        const declarator = declarations[0];
                        const rhs = declarator.init;
                        if (declarator.id.type !== 'Identifier') {
                            // TODO: source does not allow destructuring
                            return [(0, dummyAstCreator_1.dummyBlockStatement)(), context, paths, 'source does not allow destructuring'];
                        }
                        else if (isIrreducible(rhs, context)) {
                            const remainingBlockStatement = ast.blockStatement(otherStatements);
                            // force casting for weird errors
                            // substitution within the same block, add " same" so that substituter can differentiate between
                            // substitution within the block and substitution from outside the block
                            const newId = ast.identifier(declarator.id.name + ' same', declarator.id.loc);
                            const subst = substituteMain(newId, rhs, remainingBlockStatement, paths);
                            // concats paths such that:
                            // paths[0] -> path to the program to be substituted, pre-redex
                            // paths[1...] -> path(s) to the parts of the remaining program
                            // that were substituted, post-redex
                            paths[0].push('body[0]');
                            const allPaths = paths.concat(subst[1]);
                            if (subst[1].length === 0) {
                                allPaths.push([]);
                            }
                            return [subst[0], context, allPaths, explain(node)];
                        }
                        else if (rhs.type === 'ArrowFunctionExpression' ||
                            rhs.type === 'FunctionExpression') {
                            let funDecExp = ast.functionDeclarationExpression(declarator.id, rhs.params, rhs.body.type === 'BlockStatement'
                                ? rhs.body
                                : ast.blockStatement([ast.returnStatement(rhs.body)]));
                            // substitute body
                            funDecExp = substituteMain(funDecExp.id, funDecExp, funDecExp, [
                                []
                            ])[0];
                            // substitute the rest of the blockStatement
                            const remainingBlockStatement = ast.blockStatement(otherStatements);
                            // substitution within the same block, add " same" so that substituter can differentiate between
                            // substitution within the block and substitution from outside the block
                            const newId = ast.identifier(funDecExp.id.name + ' same', funDecExp.id.loc);
                            const subst = substituteMain(newId, funDecExp, remainingBlockStatement, paths);
                            // concats paths such that:
                            // paths[0] -> path to the program to be substituted, pre-redex
                            // paths[1...] -> path(s) to the parts of the remaining program
                            // that were substituted, post-redex
                            paths[0].push('body[0]');
                            const allPaths = paths.concat(subst[1]);
                            if (subst[1].length === 0) {
                                allPaths.push([]);
                            }
                            return [subst[0], context, allPaths, explain(node)];
                        }
                        else {
                            paths[0].push('body[0]');
                            paths[0].push('declarations[0]');
                            paths[0].push('init');
                            const [reducedRhs, cont, path, str] = reduce(rhs, context, paths);
                            return [
                                ast.blockStatement([
                                    ast.declaration(declarator.id.name, 'const', reducedRhs),
                                    ...otherStatements
                                ]),
                                cont,
                                path,
                                str
                            ];
                        }
                    }
                }
                paths[0].push('body[0]');
                const [reduced, cont, path, str] = reduce(firstStatement, context, paths);
                return [
                    ast.blockStatement([reduced, ...otherStatements]),
                    cont,
                    path,
                    str
                ];
            }
        },
        BlockExpression(node, context, paths) {
            if (node.body.length === 0) {
                return [ast.identifier('undefined'), context, paths, explain(node)];
            }
            else {
                const [firstStatement, ...otherStatements] = node.body;
                if (firstStatement.type === 'ReturnStatement') {
                    const arg = firstStatement.argument;
                    return [arg, context, paths, explain(node)];
                }
                else if (firstStatement.type === 'IfStatement') {
                    paths[0].push('body[0]');
                    const [reduced, cont, path, str] = reduce(firstStatement, context, paths);
                    if (reduced.type === 'BlockStatement') {
                        const body = reduced.body;
                        if (body.length > 1) {
                            path[1] = [...path[0].slice(0, path[0].length - 1)];
                        }
                        const wholeBlock = body.concat(...otherStatements);
                        return [ast.blockExpression(wholeBlock), cont, path, str];
                    }
                    else {
                        return [
                            ast.blockExpression([
                                reduced,
                                ...otherStatements
                            ]),
                            cont,
                            path,
                            str
                        ];
                    }
                }
                else if (firstStatement.type === 'ExpressionStatement' &&
                    isIrreducible(firstStatement.expression, context)) {
                    let stmt;
                    if (otherStatements.length > 0) {
                        paths[0].push('body[0]');
                        paths.push([]);
                        stmt = ast.blockExpression(otherStatements);
                    }
                    else {
                        stmt = ast.identifier('undefined');
                    }
                    return [stmt, context, paths, explain(node)];
                }
                else if (firstStatement.type === 'FunctionDeclaration') {
                    let funDecExp = ast.functionDeclarationExpression(firstStatement.id, firstStatement.params, firstStatement.body);
                    // substitute body
                    funDecExp = substituteMain(funDecExp.id, funDecExp, funDecExp, [
                        []
                    ])[0];
                    // substitute the rest of the blockExpression
                    const remainingBlockExpression = ast.blockExpression(otherStatements);
                    // substitution within the same block, add " same" so that substituter can differentiate between
                    // substitution within the block and substitution from outside the block
                    const newId = ast.identifier(funDecExp.id.name + ' same', funDecExp.id.loc);
                    const subst = substituteMain(newId, funDecExp, remainingBlockExpression, paths);
                    // concats paths such that:
                    // paths[0] -> path to the program to be substituted, pre-redex
                    // paths[1...] -> path(s) to the parts of the remaining program
                    // that were substituted, post-redex
                    paths[0].push('body[0]');
                    const allPaths = paths.concat(subst[1]);
                    if (subst[1].length === 0) {
                        allPaths.push([]);
                    }
                    return [subst[0], context, allPaths, explain(node)];
                }
                else if (firstStatement.type === 'VariableDeclaration') {
                    const { kind, declarations } = firstStatement;
                    if (kind !== 'const') {
                        // TODO: cannot use let or var
                        return [(0, dummyAstCreator_1.dummyBlockExpression)(), context, paths, 'cannot use let or var'];
                    }
                    else if (declarations.length <= 0 ||
                        declarations.length > 1 ||
                        declarations[0].type !== 'VariableDeclarator' ||
                        !declarations[0].init) {
                        // TODO: syntax error
                        return [(0, dummyAstCreator_1.dummyBlockExpression)(), context, paths, 'syntax error'];
                    }
                    else {
                        const declarator = declarations[0];
                        const rhs = declarator.init;
                        if (declarator.id.type !== 'Identifier') {
                            // TODO: source does not allow destructuring
                            return [(0, dummyAstCreator_1.dummyBlockExpression)(), context, paths, 'source does not allow destructuring'];
                        }
                        else if (isIrreducible(rhs, context)) {
                            const remainingBlockExpression = ast.blockExpression(otherStatements);
                            // forced casting for some weird errors
                            // substitution within the same block, add " same" so that substituter can differentiate between
                            // substitution within the block and substitution from outside the block
                            const newId = ast.identifier(declarator.id.name + ' same', declarator.id.loc);
                            const subst = substituteMain(newId, rhs, remainingBlockExpression, paths);
                            // concats paths such that:
                            // paths[0] -> path to the program to be substituted, pre-redex
                            // paths[1...] -> path(s) to the parts of the remaining program
                            // that were substituted, post-redex
                            paths[0].push('body[0]');
                            const allPaths = paths.concat(subst[1]);
                            if (subst[1].length === 0) {
                                allPaths.push([]);
                            }
                            return [subst[0], context, allPaths, explain(node)];
                        }
                        else if (rhs.type === 'ArrowFunctionExpression' ||
                            rhs.type === 'FunctionExpression') {
                            let funDecExp = ast.functionDeclarationExpression(declarator.id, rhs.params, rhs.body.type === 'BlockStatement'
                                ? rhs.body
                                : ast.blockStatement([ast.returnStatement(rhs.body)]));
                            // substitute body
                            funDecExp = substituteMain(funDecExp.id, funDecExp, funDecExp, [
                                []
                            ])[0];
                            // substitute the rest of the blockExpression
                            const remainingBlockExpression = ast.blockExpression(otherStatements);
                            // substitution within the same block, add " same" so that substituter can differentiate between
                            // substitution within the block and substitution from outside the block
                            const newId = ast.identifier(funDecExp.id.name + ' same', funDecExp.id.loc);
                            const subst = substituteMain(newId, funDecExp, remainingBlockExpression, paths);
                            // concats paths such that:
                            // paths[0] -> path to the program to be substituted, pre-redex
                            // paths[1...] -> path(s) to the parts of the remaining program
                            // that were substituted, post-redex
                            paths[0].push('body[0]');
                            const allPaths = paths.concat(subst[1]);
                            if (subst[1].length === 0) {
                                allPaths.push([]);
                            }
                            return [subst[0], context, allPaths, explain(node)];
                        }
                        else {
                            paths[0].push('body[0]');
                            paths[0].push('declarations[0]');
                            paths[0].push('init');
                            const [reducedRhs, cont, path, str] = reduce(rhs, context, paths);
                            return [
                                ast.blockExpression([
                                    ast.declaration(declarator.id.name, 'const', reducedRhs),
                                    ...otherStatements
                                ]),
                                cont,
                                path,
                                str
                            ];
                        }
                    }
                }
                paths[0].push('body[0]');
                const [reduced, cont, path, str] = reduce(firstStatement, context, paths);
                return [
                    ast.blockExpression([reduced, ...otherStatements]),
                    cont,
                    path,
                    str
                ];
            }
        },
        // source 1
        IfStatement(node, context, paths) {
            const { test, consequent, alternate } = node;
            if (test.type === 'Literal') {
                const error = rttc.checkIfStatement(node, test.value, context.chapter);
                if (error === undefined) {
                    return [
                        (test.value ? consequent : alternate),
                        context,
                        paths,
                        explain(node)
                    ];
                }
                else {
                    throw error;
                }
            }
            else {
                paths[0].push('test');
                const [reducedTest, cont, path, str] = reduce(test, context, paths);
                const reducedIfStatement = ast.ifStatement(reducedTest, consequent, alternate, node.loc);
                return [reducedIfStatement, cont, path, str];
            }
        }
    };
    /**
     * Reduces one step of the program and returns
     * 1. The reduced program
     * 2. The path(s) leading to the redex
     *    - If substitution not involved, returns array containing one path
     *    - If substitution is involved, returns array containing
     *      path to program to be substituted pre-redex, as well as
     *      path(s) to the parts of the program that were substituted post-redex
     * 3. String explaining the reduction
     */
    function reduce(node, context, paths) {
        const reducer = reducers[node.type];
        if (reducer === undefined) {
            return [ast.program([]), context, [], 'error']; // exit early
        }
        else {
            return reducer(node, context, paths);
        }
    }
    return reduce(node, context, [[]]);
}
// Main creates a scope for us to control the verbosity
function treeifyMain(target) {
    // recurse down the program like substitute
    // if see a function at expression position,
    //   has an identifier: replace with the name
    //   else: replace with an identifer "=>"
    let verboseCount = 0;
    const treeifiers = {
        // Identifier: return
        ExpressionStatement: (target) => {
            return ast.expressionStatement(treeify(target.expression));
        },
        BinaryExpression: (target) => {
            return ast.binaryExpression(target.operator, treeify(target.left), treeify(target.right));
        },
        UnaryExpression: (target) => {
            return ast.unaryExpression(target.operator, treeify(target.argument));
        },
        ConditionalExpression: (target) => {
            return ast.conditionalExpression(treeify(target.test), treeify(target.consequent), treeify(target.alternate));
        },
        LogicalExpression: (target) => {
            return ast.logicalExpression(target.operator, treeify(target.left), treeify(target.right));
        },
        CallExpression: (target) => {
            return ast.callExpression(treeify(target.callee), target.arguments.map(arg => treeify(arg)));
        },
        FunctionDeclaration: (target) => {
            return ast.functionDeclaration(target.id, target.params, treeify(target.body));
        },
        // CORE
        FunctionExpression: (target) => {
            if (target.id) {
                return target.id;
            }
            else if (verboseCount < 5) {
                // here onwards is guarding against arrow turned function expressions
                verboseCount++;
                const redacted = ast.arrowFunctionExpression(target.params, treeify(target.body));
                verboseCount = 0;
                return redacted;
            }
            else {
                // shortens body after 5 iterations
                return ast.arrowFunctionExpression(target.params, ast.identifier('...'));
            }
        },
        Program: (target) => {
            return ast.program(target.body.map(stmt => treeify(stmt)));
        },
        BlockStatement: (target) => {
            return ast.blockStatement(target.body.map(stmt => treeify(stmt)));
        },
        BlockExpression: (target) => {
            return ast.blockStatement(target.body.map(treeify));
        },
        ReturnStatement: (target) => {
            return ast.returnStatement(treeify(target.argument));
        },
        // source 1
        // CORE
        ArrowFunctionExpression: (target) => {
            if (verboseCount < 5) {
                // here onwards is guarding against arrow turned function expressions
                verboseCount++;
                const redacted = ast.arrowFunctionExpression(target.params, treeify(target.body));
                verboseCount = 0;
                return redacted;
            }
            else {
                // shortens body after 5 iterations
                return ast.arrowFunctionExpression(target.params, ast.identifier('...'));
            }
        },
        VariableDeclaration: (target) => {
            return ast.variableDeclaration(target.declarations.map(treeify));
        },
        VariableDeclarator: (target) => {
            return ast.variableDeclarator(target.id, treeify(target.init));
        },
        IfStatement: (target) => {
            return ast.ifStatement(treeify(target.test), treeify(target.consequent), treeify(target.alternate));
        },
        // source 2
        ArrayExpression: (target) => {
            return ast.arrayExpression(target.elements.map(treeify));
        }
    };
    function treeify(target) {
        const treeifier = treeifiers[target.type];
        if (treeifier === undefined) {
            return target;
        }
        else {
            return treeifier(target);
        }
    }
    return treeify(target);
}
function jsTreeifyMain(target, visited, readOnly) {
    // recurse down the program like substitute
    // if see a function at expression position,
    //   visited before recursing to this target: replace with the name
    //   else: replace with a FunctionExpression
    let verboseCount = 0;
    const treeifiers = {
        Identifier: (target) => {
            if (readOnly && target.name.startsWith('anonymous_')) {
                return ast.identifier('[Function]');
            }
            return target;
        },
        Literal: (target) => {
            if (typeof target.value === 'object' && target.value !== null) {
                target.raw = (0, converter_1.objectToString)(target.value);
            }
            return target;
        },
        ExpressionStatement: (target) => {
            return ast.expressionStatement(treeify(target.expression));
        },
        BinaryExpression: (target) => {
            return ast.binaryExpression(target.operator, treeify(target.left), treeify(target.right));
        },
        UnaryExpression: (target) => {
            return ast.unaryExpression(target.operator, treeify(target.argument));
        },
        ConditionalExpression: (target) => {
            return ast.conditionalExpression(treeify(target.test), treeify(target.consequent), treeify(target.alternate));
        },
        LogicalExpression: (target) => {
            return ast.logicalExpression(target.operator, treeify(target.left), treeify(target.right));
        },
        CallExpression: (target) => {
            return ast.callExpression(treeify(target.callee), target.arguments.map(arg => treeify(arg)));
        },
        FunctionDeclaration: (target) => {
            return ast.functionDeclaration(target.id, target.params, treeify(target.body));
        },
        // CORE
        FunctionExpression: (target) => {
            if (visited.has(target) && target.id) {
                return target.id;
            }
            visited.add(target);
            if (readOnly && target.id) {
                return target.id;
            }
            else if (target.id) {
                return ast.functionExpression(target.params, treeify(target.body), target.loc, target.id);
            }
            else {
                return ast.functionExpression(target.params, treeify(target.body), target.loc);
            }
        },
        Program: (target) => {
            return ast.program(target.body.map(stmt => treeify(stmt)));
        },
        BlockStatement: (target) => {
            return ast.blockStatement(target.body.map(stmt => treeify(stmt)));
        },
        BlockExpression: (target) => {
            return ast.blockStatement(target.body.map(node => treeify(node)));
        },
        ReturnStatement: (target) => {
            return ast.returnStatement(treeify(target.argument));
        },
        // source 1
        ArrowFunctionExpression: (target) => {
            if (verboseCount < 5) {
                // here onwards is guarding against arrow turned function expressions
                verboseCount++;
                const redacted = ast.arrowFunctionExpression(target.params, treeify(target.body));
                verboseCount = 0;
                return redacted;
            }
            else {
                // shortens body after 5 iterations
                return ast.arrowFunctionExpression(target.params, ast.identifier('...'));
            }
        },
        VariableDeclaration: (target) => {
            return ast.variableDeclaration(target.declarations.map(treeify));
        },
        VariableDeclarator: (target) => {
            return ast.variableDeclarator(target.id, treeify(target.init));
        },
        IfStatement: (target) => {
            return ast.ifStatement(treeify(target.test), treeify(target.consequent), treeify(target.alternate));
        },
        // source 2
        ArrayExpression: (target) => {
            return ast.arrayExpression(target.elements.map(treeify));
        }
    };
    function treeify(target) {
        const treeifier = treeifiers[target.type];
        if (treeifier === undefined) {
            return target;
        }
        else {
            return treeifier(target);
        }
    }
    return treeify(target);
}
// Mainly kept for testing
const codify = (node) => (0, astring_1.generate)(treeifyMain(node));
exports.codify = codify;
const javascriptify = (node) => '(' + (0, astring_1.generate)(jsTreeifyMain(node, new Set(), false)) + ');';
exports.javascriptify = javascriptify;
/**
 * Recurses down the tree, tracing path to redex
 * and calling treeifyMain on all other children
 * Once redex is found, extract redex from tree
 * and put redexMarker in its place
 * Returns array containing modified tree and
 * extracted redex
 */
function pathifyMain(target, paths, visited) {
    let pathIndex = 0;
    let path = paths[0];
    let redex = ast.program([]);
    let endIndex = path === undefined ? 0 : path.length - 1;
    const redexMarker = ast.identifier('@redex');
    const withBrackets = ast.identifier('(@redex)');
    const pathifiers = {
        ExpressionStatement: (target) => {
            let exp = jsTreeifyMain(target.expression, visited, true);
            if (path[pathIndex] === 'expression') {
                if (pathIndex === endIndex) {
                    redex = exp;
                    exp =
                        target.expression.type === 'ArrowFunctionExpression'
                            ? withBrackets
                            : redexMarker;
                }
                else {
                    pathIndex++;
                    exp = pathify(target.expression);
                }
            }
            return ast.expressionStatement(exp);
        },
        BinaryExpression: (target) => {
            let left = jsTreeifyMain(target.left, visited, true);
            let right = jsTreeifyMain(target.right, visited, true);
            if (path[pathIndex] === 'left') {
                if (pathIndex === endIndex) {
                    redex = left;
                    if (redex.type === 'ConditionalExpression') {
                        left = withBrackets;
                    }
                    else {
                        left = redexMarker;
                    }
                }
                else {
                    pathIndex++;
                    left = pathify(target.left);
                }
            }
            else if (path[pathIndex] === 'right') {
                if (pathIndex === endIndex) {
                    redex = right;
                    if (redex.type === 'BinaryExpression' || redex.type === 'ConditionalExpression') {
                        right = withBrackets;
                    }
                    else {
                        right = redexMarker;
                    }
                }
                else {
                    pathIndex++;
                    right = pathify(target.right);
                }
            }
            return ast.binaryExpression(target.operator, left, right);
        },
        UnaryExpression: (target) => {
            let arg = jsTreeifyMain(target.argument, visited, true);
            if (path[pathIndex] === 'argument') {
                if (pathIndex === endIndex) {
                    redex = arg;
                    arg = redexMarker;
                }
                else {
                    pathIndex++;
                    arg = pathify(target.argument);
                }
            }
            return ast.unaryExpression(target.operator, arg);
        },
        ConditionalExpression: (target) => {
            let test = jsTreeifyMain(target.test, visited, true);
            let cons = jsTreeifyMain(target.consequent, visited, true);
            let alt = jsTreeifyMain(target.alternate, visited, true);
            if (path[pathIndex] === 'test') {
                if (pathIndex === endIndex) {
                    redex = test;
                    test = redexMarker;
                }
                else {
                    pathIndex++;
                    test = pathify(target.test);
                }
            }
            else if (path[pathIndex] === 'consequent') {
                if (pathIndex === endIndex) {
                    redex = cons;
                    cons = redexMarker;
                }
                else {
                    pathIndex++;
                    cons = pathify(target.consequent);
                }
            }
            else if (path[pathIndex] === 'alternate') {
                if (pathIndex === endIndex) {
                    redex = alt;
                    alt = redexMarker;
                }
                else {
                    pathIndex++;
                    alt = pathify(target.alternate);
                }
            }
            return ast.conditionalExpression(test, cons, alt);
        },
        LogicalExpression: (target) => {
            let left = jsTreeifyMain(target.left, visited, true);
            let right = jsTreeifyMain(target.right, visited, true);
            if (path[pathIndex] === 'left') {
                if (pathIndex === endIndex) {
                    redex = left;
                    left = redexMarker;
                }
                else {
                    pathIndex++;
                    left = pathify(target.left);
                }
            }
            else if (path[pathIndex] === 'right') {
                if (pathIndex === endIndex) {
                    redex = right;
                    right = redexMarker;
                }
                else {
                    pathIndex++;
                    right = pathify(target.right);
                }
            }
            return ast.logicalExpression(target.operator, left, right);
        },
        CallExpression: (target) => {
            let callee = jsTreeifyMain(target.callee, visited, true);
            const args = target.arguments.map(arg => jsTreeifyMain(arg, visited, true));
            if (path[pathIndex] === 'callee') {
                if (pathIndex === endIndex) {
                    redex = callee;
                    callee =
                        target.callee.type === 'ArrowFunctionExpression'
                            ? withBrackets
                            : redexMarker;
                }
                else {
                    pathIndex++;
                    callee = pathify(target.callee);
                }
            }
            else {
                let argIndex;
                const isEnd = pathIndex === endIndex;
                for (let i = 0; i < target.arguments.length; i++) {
                    if (path[pathIndex] === 'arguments[' + i + ']') {
                        argIndex = i;
                        break;
                    }
                }
                if (argIndex !== undefined) {
                    pathIndex++;
                    if (isEnd) {
                        redex = args[argIndex];
                        args[argIndex] = redexMarker;
                    }
                    else {
                        args[argIndex] = pathify(target.arguments[argIndex]);
                    }
                }
            }
            return ast.callExpression(callee, args);
        },
        FunctionDeclaration: (target) => {
            let body = jsTreeifyMain(target.body, visited, true);
            if (path[pathIndex] === 'body') {
                if (pathIndex === endIndex) {
                    redex = body;
                    body = redexMarker;
                }
                else {
                    pathIndex++;
                    body = pathify(target.body);
                }
            }
            return ast.functionDeclaration(target.id, target.params, body);
        },
        FunctionExpression: (target) => {
            if (target.id) {
                return target.id;
            }
            else {
                let body = jsTreeifyMain(target.body, visited, true);
                if (path[pathIndex] === 'body') {
                    if (pathIndex === endIndex) {
                        redex = body;
                        body = redexMarker;
                    }
                    else {
                        pathIndex++;
                        body = pathify(target.body);
                    }
                }
                return ast.arrowFunctionExpression(target.params, body);
            }
        },
        Program: (target) => {
            const body = target.body.map(node => jsTreeifyMain(node, visited, true));
            let bodyIndex;
            const isEnd = pathIndex === endIndex;
            for (let i = 0; i < target.body.length; i++) {
                if (path[pathIndex] === 'body[' + i + ']') {
                    bodyIndex = i;
                    break;
                }
            }
            if (bodyIndex !== undefined) {
                if (isEnd) {
                    redex = body[bodyIndex];
                    body[bodyIndex] = redexMarker;
                }
                else {
                    pathIndex++;
                    body[bodyIndex] = pathify(target.body[bodyIndex]);
                }
            }
            return ast.program(body);
        },
        BlockStatement: (target) => {
            const body = target.body.map(node => jsTreeifyMain(node, visited, true));
            let bodyIndex;
            const isEnd = pathIndex === endIndex;
            for (let i = 0; i < target.body.length; i++) {
                if (path[pathIndex] === 'body[' + i + ']') {
                    bodyIndex = i;
                    break;
                }
            }
            if (bodyIndex !== undefined) {
                if (isEnd) {
                    redex = body[bodyIndex];
                    body[bodyIndex] = redexMarker;
                }
                else {
                    pathIndex++;
                    body[bodyIndex] = pathify(target.body[bodyIndex]);
                }
            }
            return ast.blockStatement(body);
        },
        BlockExpression: (target) => {
            const body = target.body.map(node => jsTreeifyMain(node, visited, true));
            let bodyIndex;
            const isEnd = pathIndex === endIndex;
            for (let i = 0; i < target.body.length; i++) {
                if (path[pathIndex] === 'body[' + i + ']') {
                    bodyIndex = i;
                    break;
                }
            }
            if (bodyIndex !== undefined) {
                if (isEnd) {
                    redex = body[bodyIndex];
                    body[bodyIndex] = redexMarker;
                }
                else {
                    pathIndex++;
                    body[bodyIndex] = pathify(target.body[bodyIndex]);
                }
            }
            return ast.blockStatement(body);
        },
        ReturnStatement: (target) => {
            let arg = jsTreeifyMain(target.argument, visited, true);
            if (path[pathIndex] === 'argument') {
                if (pathIndex === endIndex) {
                    redex = arg;
                    arg = redexMarker;
                }
                else {
                    pathIndex++;
                    arg = pathify(target.argument);
                }
            }
            return ast.returnStatement(arg);
        },
        // source 1
        ArrowFunctionExpression: (target) => {
            let body = jsTreeifyMain(target.body, visited, true);
            if (path[pathIndex] === 'body') {
                if (pathIndex === endIndex) {
                    redex = body;
                    body = redexMarker;
                }
                else {
                    pathIndex++;
                    body = pathify(target.body);
                }
            }
            //localhost:8000
            return ast.arrowFunctionExpression(target.params, body);
        },
        VariableDeclaration: (target) => {
            const decl = target.declarations.map(node => jsTreeifyMain(node, visited, true));
            let declIndex;
            const isEnd = pathIndex === endIndex;
            for (let i = 0; i < target.declarations.length; i++) {
                if (path[pathIndex] === 'declarations[' + i + ']') {
                    declIndex = i;
                    break;
                }
            }
            if (declIndex !== undefined) {
                if (isEnd) {
                    redex = decl[declIndex];
                    decl[declIndex] = redexMarker;
                }
                else {
                    pathIndex++;
                    decl[declIndex] = pathify(target.declarations[declIndex]);
                }
            }
            return ast.variableDeclaration(decl);
        },
        VariableDeclarator: (target) => {
            let init = jsTreeifyMain(target.init, visited, true);
            if (path[pathIndex] === 'init') {
                if (pathIndex === endIndex) {
                    redex = init;
                    init = redexMarker;
                }
                else {
                    pathIndex++;
                    init = pathify(target.init);
                }
            }
            return ast.variableDeclarator(target.id, init);
        },
        IfStatement: (target) => {
            let test = jsTreeifyMain(target.test, visited, true);
            let cons = jsTreeifyMain(target.consequent, visited, true);
            let alt = jsTreeifyMain(target.alternate, visited, true);
            if (path[pathIndex] === 'test') {
                if (pathIndex === endIndex) {
                    redex = test;
                    test = redexMarker;
                }
                else {
                    pathIndex++;
                    test = pathify(target.test);
                }
            }
            else if (path[pathIndex] === 'consequent') {
                if (pathIndex === endIndex) {
                    redex = cons;
                    cons = redexMarker;
                }
                else {
                    pathIndex++;
                    cons = pathify(target.consequent);
                }
            }
            else if (path[pathIndex] === 'alternate') {
                if (pathIndex === endIndex) {
                    redex = alt;
                    alt = redexMarker;
                }
                else {
                    pathIndex++;
                    alt = pathify(target.alternate);
                }
            }
            return ast.ifStatement(test, cons, alt);
        },
        // source 2
        ArrayExpression: (target) => {
            const eles = target.elements.map(node => jsTreeifyMain(node, visited, true));
            let eleIndex;
            const isEnd = pathIndex === endIndex;
            for (let i = 0; i < target.elements.length; i++) {
                if (path[pathIndex] === 'elements[' + i + ']') {
                    eleIndex = i;
                    break;
                }
            }
            if (eleIndex !== undefined) {
                if (isEnd) {
                    redex = eles[eleIndex];
                    eles[eleIndex] = redexMarker;
                }
                else {
                    pathIndex++;
                    eles[eleIndex] = pathify(target.elements[eleIndex]);
                }
            }
            return ast.arrayExpression(eles);
        }
    };
    function pathify(target) {
        const pathifier = pathifiers[target.type];
        if (pathifier === undefined) {
            return jsTreeifyMain(target, visited, true);
        }
        else {
            return pathifier(target);
        }
    }
    if (path === undefined || path[0] === undefined) {
        return [jsTreeifyMain(target, visited, true), ast.program([])];
    }
    else {
        let pathified = pathify(target);
        // runs pathify more than once if more than one substitution path
        for (let i = 1; i < paths.length; i++) {
            pathIndex = 0;
            path = paths[i];
            endIndex = path === undefined ? 0 : path.length - 1;
            pathified = pathify(pathified);
        }
        return [pathified, redex];
    }
}
// Function to convert array from getEvaluationSteps into text
const redexify = (node, path) => [
    (0, astring_1.generate)(pathifyMain(node, path, new Set())[0]),
    (0, astring_1.generate)(pathifyMain(node, path, new Set())[1])
];
exports.redexify = redexify;
const getRedex = (node, path) => pathifyMain(node, path, new Set())[1];
exports.getRedex = getRedex;
// strategy: we remember how many statements are there originally in program.
// since listPrelude are just functions, they will be disposed of one by one
// we prepend the program with the program resulting from the definitions,
//   and reduce the combined program until the program body
//   has number of statement === original program
// then we return it to the getEvaluationSteps
function substPredefinedFns(program, context) {
    if (context.prelude) {
        // replace all occurences of '$' with 'helper_' to
        // prevent collision with redex (temporary solution)
        // context.prelude = context.prelude.replace(/\$/gi, 'helper_')
        // evaluate the list prelude first
        const listPreludeProgram = (0, parser_1.parse)(context.prelude, context);
        const origBody = program.body;
        program.body = listPreludeProgram.body;
        program.body.push(ast.blockStatement(origBody));
        while (program.body.length > 1) {
            program = reduceMain(program, context)[0];
        }
        program.body = program.body[0].body;
    }
    return [program, context];
}
function substPredefinedConstants(program) {
    const constants = [['undefined', undefined]];
    const mathConstants = Object.getOwnPropertyNames(Math)
        .filter(name => typeof Math[name] !== 'function')
        .map(name => ['math_' + name, Math[name]]);
    let substed = program;
    for (const nameValuePair of constants.concat(mathConstants)) {
        substed = substituteMain(ast.identifier(nameValuePair[0]), ast.literal(nameValuePair[1]), substed, [[]])[0];
    }
    return substed;
}
function removeDebuggerStatements(program) {
    // recursively detect and remove debugger statements
    function remove(removee) {
        if (removee.type === 'BlockStatement' || removee.type === 'Program') {
            removee.body = removee.body.filter(s => s.type !== 'DebuggerStatement');
            removee.body.forEach(s => remove(s));
        }
        else if (removee.type === 'VariableDeclaration') {
            removee.declarations.forEach(s => remove(s.init));
        }
        else if (removee.type === 'FunctionDeclaration') {
            remove(removee.body);
        }
        else if (removee.type === 'IfStatement') {
            remove(removee.consequent);
            remove(removee.alternate);
        }
        else if (removee.type === 'ArrowFunctionExpression') {
            remove(removee.body);
        }
    }
    remove(program);
    return program;
}
function evaluateImports(program, context, { loadTabs, checkImports, wrapSourceModules }) {
    return __awaiter(this, void 0, void 0, function* () {
        const [importNodeMap, otherNodes] = (0, helpers_1.filterImportDeclarations)(program);
        try {
            const environment = (0, util_1.currentEnvironment)(context);
            yield Promise.all(Object.entries(importNodeMap).map(([moduleName, nodes]) => __awaiter(this, void 0, void 0, function* () {
                yield (0, moduleLoaderAsync_1.initModuleContextAsync)(moduleName, context, loadTabs);
                const functions = yield (0, moduleLoaderAsync_1.loadModuleBundleAsync)(moduleName, context, wrapSourceModules, nodes[0]);
                for (const node of nodes) {
                    for (const spec of node.specifiers) {
                        (0, assert_1.default)(spec.type === 'ImportSpecifier', `Only ImportSpecifiers are supported, got: ${spec.type}`);
                        if (checkImports && !(spec.imported.name in functions)) {
                            throw new errors_1.UndefinedImportError(spec.imported.name, moduleName, spec);
                        }
                        (0, util_1.declareIdentifier)(context, spec.local.name, node, environment);
                        (0, util_1.defineVariable)(context, spec.local.name, functions[spec.imported.name], true, node);
                    }
                }
            })));
        }
        catch (error) {
            // console.log(error)
            (0, util_1.handleRuntimeError)(context, error);
        }
        program.body = otherNodes;
    });
}
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
function getNativeIds(program, usedIdentifiers) {
    const globalIds = {};
    for (const identifier of globalIdNames) {
        globalIds[identifier] = ast.identifier((0, uniqueIds_1.getUniqueId)(usedIdentifiers, identifier));
    }
    return globalIds;
}
function checkForUndefinedVariables(program, context) {
    const usedIdentifiers = new Set([
        ...(0, uniqueIds_1.getIdentifiersInProgram)(program),
        ...(0, uniqueIds_1.getIdentifiersInNativeStorage)(context.nativeStorage)
    ]);
    const globalIds = getNativeIds(program, usedIdentifiers);
    const preludes = context.prelude
        ? (0, uniqueIds_1.getFunctionDeclarationNamesInProgram)((0, parser_1.parse)(context.prelude, context))
        : new Set();
    const builtins = context.nativeStorage.builtins;
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
        const isPreviouslyDeclared = context.nativeStorage.previousProgramsIdentifiers.has(name);
        if (isPreviouslyDeclared) {
            continue;
        }
        const isBuiltin = builtins.has(name);
        if (isBuiltin) {
            continue;
        }
        const isPrelude = preludes.has(name);
        if (isPrelude) {
            continue;
        }
        const isNativeId = nativeInternalNames.has(name);
        if (!isNativeId) {
            throw new errors.UndefinedVariable(name, identifier);
        }
    }
}
// the context here is for builtins
function getEvaluationSteps(program, context, { importOptions, stepLimit }) {
    return __awaiter(this, void 0, void 0, function* () {
        const steps = [];
        try {
            checkForUndefinedVariables(program, context);
            const limit = stepLimit === undefined ? 1000 : stepLimit % 2 === 0 ? stepLimit : stepLimit + 1;
            yield evaluateImports(program, context, importOptions);
            // starts with substituting predefined constants
            let start = substPredefinedConstants(program);
            // and predefined fns
            start = substPredefinedFns(start, context)[0];
            // and remove debugger statements.
            start = removeDebuggerStatements(start);
            // then add in path and explanation string
            let reducedWithPath = [
                start,
                context,
                [],
                'Start of evaluation'
            ];
            // reduces program until evaluation completes
            // even steps: program before reduction
            // odd steps: program after reduction
            let i = -1;
            let limitExceeded = false;
            while (reducedWithPath[0].body.length > 0) {
                if (steps.length === limit) {
                    steps[steps.length - 1] = [ast.program([]), [], 'Maximum number of steps exceeded'];
                    limitExceeded = true;
                    break;
                }
                steps.push([
                    reducedWithPath[0],
                    reducedWithPath[2].length > 1 ? reducedWithPath[2].slice(1) : reducedWithPath[2],
                    reducedWithPath[3]
                ]);
                steps.push([reducedWithPath[0], [], '']);
                if (i > 0) {
                    steps[i][1] = reducedWithPath[2].length > 1 ? [reducedWithPath[2][0]] : reducedWithPath[2];
                    steps[i][2] = reducedWithPath[3];
                }
                reducedWithPath = reduceMain(reducedWithPath[0], context);
                i += 2;
            }
            if (!limitExceeded && steps.length > 0) {
                steps[steps.length - 1][2] = 'Evaluation complete';
            }
            if (steps.length === 0) {
                steps.push([reducedWithPath[0], [], 'Nothing to evaluate']);
            }
            return steps;
        }
        catch (error) {
            context.errors.push(error);
            return steps;
        }
    });
}
exports.getEvaluationSteps = getEvaluationSteps;
function isStepperOutput(output) {
    return 'code' in output;
}
exports.isStepperOutput = isStepperOutput;
function callee(content, context) {
    if (content.type === 'CallExpression') {
        let reducedArgs = true;
        for (const arg of content.arguments) {
            if (!isIrreducible(arg, context)) {
                reducedArgs = false;
            }
        }
        return reducedArgs ? content.callee : undefined;
    }
    else {
        return undefined;
    }
}
exports.callee = callee;
//# sourceMappingURL=stepper.js.map