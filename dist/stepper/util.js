"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defineVariable = exports.currentEnvironment = exports.declareIdentifier = exports.handleRuntimeError = exports.getDeclaredNames = exports.isAllowedLiterals = exports.isNumber = exports.isNegNumber = exports.isPositiveNumber = exports.isInfinity = exports.isImportedFunction = exports.isBuiltinFunction = void 0;
const errors = require("../errors/errors");
const builtin = require("./lib");
function isBuiltinFunction(node) {
    return (node.type === 'Identifier' &&
        // predeclared, except for evaluateMath
        ((typeof builtin[node.name] === 'function' && node.name !== 'evaluateMath') ||
            // one of the math functions
            Object.getOwnPropertyNames(Math)
                .filter(name => typeof Math[name] === 'function')
                .map(name => 'math_' + name)
                .includes(node.name)));
}
exports.isBuiltinFunction = isBuiltinFunction;
function isImportedFunction(node, context) {
    return (node.type === 'Identifier' &&
        Object.keys(context.runtime.environments[0].head).includes(node.name));
}
exports.isImportedFunction = isImportedFunction;
function isInfinity(node) {
    return node.type === 'Identifier' && node.name === 'Infinity';
}
exports.isInfinity = isInfinity;
function isPositiveNumber(node) {
    return node.type === 'Literal' && typeof node.value === 'number';
}
exports.isPositiveNumber = isPositiveNumber;
function isNegNumber(node) {
    return (node.type === 'UnaryExpression' &&
        node.operator === '-' &&
        (isInfinity(node.argument) || isPositiveNumber(node.argument)));
}
exports.isNegNumber = isNegNumber;
function isNumber(node) {
    return isPositiveNumber(node) || isNegNumber(node);
}
exports.isNumber = isNumber;
function isAllowedLiterals(node) {
    return node.type === 'Identifier' && ['NaN', 'Infinity', 'undefined'].includes(node.name);
}
exports.isAllowedLiterals = isAllowedLiterals;
function getDeclaredNames(node) {
    const declaredNames = new Set();
    for (const stmt of node.body) {
        // if stmt is assignment or functionDeclaration
        // add stmt into a set of identifiers
        // return that set
        if (stmt.type === 'VariableDeclaration') {
            stmt.declarations
                .map(decn => decn.id)
                .map(id => id.name)
                .forEach(name => declaredNames.add(name));
        }
        else if (stmt.type === 'FunctionDeclaration' && stmt.id) {
            declaredNames.add(stmt.id.name);
        }
    }
    return declaredNames;
}
exports.getDeclaredNames = getDeclaredNames;
const handleRuntimeError = (context, error) => {
    context.errors.push(error);
    throw error;
};
exports.handleRuntimeError = handleRuntimeError;
const DECLARED_BUT_NOT_YET_ASSIGNED = Symbol('Used to implement hoisting');
function declareIdentifier(context, name, node, environment) {
    if (environment.head.hasOwnProperty(name)) {
        const descriptors = Object.getOwnPropertyDescriptors(environment.head);
        return (0, exports.handleRuntimeError)(context, new errors.VariableRedeclaration(node, name, descriptors[name].writable));
    }
    environment.head[name] = DECLARED_BUT_NOT_YET_ASSIGNED;
    return environment;
}
exports.declareIdentifier = declareIdentifier;
const currentEnvironment = (context) => context.runtime.environments[0];
exports.currentEnvironment = currentEnvironment;
function defineVariable(context, name, value, constant = false, node) {
    const environment = (0, exports.currentEnvironment)(context);
    if (environment.head[name] !== DECLARED_BUT_NOT_YET_ASSIGNED) {
        return (0, exports.handleRuntimeError)(context, new errors.VariableRedeclaration(node, name, !constant));
    }
    Object.defineProperty(environment.head, name, {
        value,
        writable: !constant,
        enumerable: true
    });
    return environment;
}
exports.defineVariable = defineVariable;
//# sourceMappingURL=util.js.map