"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apply = exports.evaluateProgram = exports.evaluators = exports.pushEnvironment = exports.createBlockEnvironment = exports.actualValue = void 0;
const lodash_1 = require("lodash");
const constants_1 = require("../constants");
const createContext_1 = require("../createContext");
const errors = require("../errors/errors");
const runtimeSourceError_1 = require("../errors/runtimeSourceError");
const errors_1 = require("../modules/errors");
const moduleLoader_1 = require("../modules/moduleLoader");
const inspector_1 = require("../stdlib/inspector");
const types_1 = require("../types");
const assert_1 = require("../utils/assert");
const create = require("../utils/astCreator");
const astCreator_1 = require("../utils/astCreator");
const operators_1 = require("../utils/operators");
const rttc = require("../utils/rttc");
const closure_1 = require("./closure");
class BreakValue {
}
class ContinueValue {
}
class ReturnValue {
    constructor(value) {
        this.value = value;
    }
}
class TailCallReturnValue {
    constructor(callee, args, node) {
        this.callee = callee;
        this.args = args;
        this.node = node;
    }
}
class Thunk {
    constructor(exp, env) {
        this.exp = exp;
        this.env = env;
        this.isMemoized = false;
        this.value = null;
    }
}
const delayIt = (exp, env) => new Thunk(exp, env);
function* forceIt(val, context) {
    if (val instanceof Thunk) {
        if (val.isMemoized)
            return val.value;
        (0, exports.pushEnvironment)(context, val.env);
        const evalRes = yield* actualValue(val.exp, context);
        popEnvironment(context);
        val.value = evalRes;
        val.isMemoized = true;
        return evalRes;
    }
    else
        return val;
}
function* actualValue(exp, context) {
    const evalResult = yield* evaluate(exp, context);
    const forced = yield* forceIt(evalResult, context);
    return forced;
}
exports.actualValue = actualValue;
const createEnvironment = (closure, args, callExpression) => {
    const environment = {
        name: closure.functionName,
        tail: closure.environment,
        head: {},
        id: (0, lodash_1.uniqueId)()
    };
    if (callExpression) {
        environment.callExpression = Object.assign(Object.assign({}, callExpression), { arguments: args.map(astCreator_1.primitive) });
    }
    closure.node.params.forEach((param, index) => {
        if (param.type === 'RestElement') {
            environment.head[param.argument.name] = args.slice(index);
        }
        else {
            environment.head[param.name] = args[index];
        }
    });
    return environment;
};
const createBlockEnvironment = (context, name = 'blockEnvironment', head = {}) => {
    return {
        name,
        tail: currentEnvironment(context),
        head,
        id: (0, lodash_1.uniqueId)()
    };
};
exports.createBlockEnvironment = createBlockEnvironment;
const handleRuntimeError = (context, error) => {
    context.errors.push(error);
    context.runtime.environments = context.runtime.environments.slice(-context.numberOfOuterEnvironments);
    throw error;
};
const DECLARED_BUT_NOT_YET_ASSIGNED = Symbol('Used to implement block scope');
function declareIdentifier(context, name, node) {
    const environment = currentEnvironment(context);
    if (environment.head.hasOwnProperty(name)) {
        const descriptors = Object.getOwnPropertyDescriptors(environment.head);
        return handleRuntimeError(context, new errors.VariableRedeclaration(node, name, descriptors[name].writable));
    }
    environment.head[name] = DECLARED_BUT_NOT_YET_ASSIGNED;
    return environment;
}
function declareVariables(context, node) {
    for (const declaration of node.declarations) {
        declareIdentifier(context, declaration.id.name, node);
    }
}
function declareFunctionsAndVariables(context, node) {
    for (const statement of node.body) {
        switch (statement.type) {
            case 'VariableDeclaration':
                declareVariables(context, statement);
                break;
            case 'FunctionDeclaration':
                if (statement.id === null) {
                    throw new Error('Encountered a FunctionDeclaration node without an identifier. This should have been caught when parsing.');
                }
                declareIdentifier(context, statement.id.name, statement);
                break;
        }
    }
}
function defineVariable(context, name, value, constant = false) {
    const environment = currentEnvironment(context);
    if (environment.head[name] !== DECLARED_BUT_NOT_YET_ASSIGNED) {
        return handleRuntimeError(context, new errors.VariableRedeclaration(context.runtime.nodes[0], name, !constant));
    }
    Object.defineProperty(environment.head, name, {
        value,
        writable: !constant,
        enumerable: true
    });
    return environment;
}
function* visit(context, node) {
    (0, inspector_1.checkEditorBreakpoints)(context, node);
    context.runtime.nodes.unshift(node);
    yield context;
}
function* leave(context) {
    context.runtime.break = false;
    context.runtime.nodes.shift();
    yield context;
}
const currentEnvironment = (context) => context.runtime.environments[0];
const replaceEnvironment = (context, environment) => {
    context.runtime.environments[0] = environment;
    context.runtime.environmentTree.insert(environment);
};
const popEnvironment = (context) => context.runtime.environments.shift();
const pushEnvironment = (context, environment) => {
    context.runtime.environments.unshift(environment);
    context.runtime.environmentTree.insert(environment);
};
exports.pushEnvironment = pushEnvironment;
const getVariable = (context, name) => {
    let environment = currentEnvironment(context);
    while (environment) {
        if (environment.head.hasOwnProperty(name)) {
            if (environment.head[name] === DECLARED_BUT_NOT_YET_ASSIGNED) {
                return handleRuntimeError(context, new errors.UnassignedVariable(name, context.runtime.nodes[0]));
            }
            else {
                return environment.head[name];
            }
        }
        else {
            environment = environment.tail;
        }
    }
    return handleRuntimeError(context, new errors.UndefinedVariable(name, context.runtime.nodes[0]));
};
const setVariable = (context, name, value) => {
    let environment = currentEnvironment(context);
    while (environment) {
        if (environment.head.hasOwnProperty(name)) {
            if (environment.head[name] === DECLARED_BUT_NOT_YET_ASSIGNED) {
                break;
            }
            const descriptors = Object.getOwnPropertyDescriptors(environment.head);
            if (descriptors[name].writable) {
                environment.head[name] = value;
                return undefined;
            }
            return handleRuntimeError(context, new errors.ConstAssignment(context.runtime.nodes[0], name));
        }
        else {
            environment = environment.tail;
        }
    }
    return handleRuntimeError(context, new errors.UndefinedVariable(name, context.runtime.nodes[0]));
};
const checkNumberOfArguments = (context, callee, args, exp) => {
    var _a;
    if (callee instanceof closure_1.default) {
        const params = callee.node.params;
        const hasVarArgs = ((_a = params[params.length - 1]) === null || _a === void 0 ? void 0 : _a.type) === 'RestElement';
        if (hasVarArgs ? params.length - 1 > args.length : params.length !== args.length) {
            return handleRuntimeError(context, new errors.InvalidNumberOfArguments(exp, hasVarArgs ? params.length - 1 : params.length, args.length, hasVarArgs));
        }
    }
    else {
        const hasVarArgs = callee.minArgsNeeded != undefined;
        if (hasVarArgs ? callee.minArgsNeeded > args.length : callee.length !== args.length) {
            return handleRuntimeError(context, new errors.InvalidNumberOfArguments(exp, hasVarArgs ? callee.minArgsNeeded : callee.length, args.length, hasVarArgs));
        }
    }
    return undefined;
};
function* getArgs(context, call) {
    const args = [];
    for (const arg of call.arguments) {
        if (context.variant === types_1.Variant.LAZY) {
            args.push(delayIt(arg, currentEnvironment(context)));
        }
        else if (arg.type === 'SpreadElement') {
            args.push(...(yield* actualValue(arg.argument, context)));
        }
        else {
            args.push(yield* actualValue(arg, context));
        }
    }
    return args;
}
function transformLogicalExpression(node) {
    if (node.operator === '&&') {
        return (0, astCreator_1.conditionalExpression)(node.left, node.right, (0, astCreator_1.literal)(false), node.loc);
    }
    else {
        return (0, astCreator_1.conditionalExpression)(node.left, (0, astCreator_1.literal)(true), node.right, node.loc);
    }
}
function* reduceIf(node, context) {
    const test = yield* actualValue(node.test, context);
    const error = rttc.checkIfStatement(node, test, context.chapter);
    if (error) {
        return handleRuntimeError(context, error);
    }
    return test ? node.consequent : node.alternate;
}
function* evaluateBlockStatement(context, node) {
    declareFunctionsAndVariables(context, node);
    let result;
    for (const statement of node.body) {
        result = yield* evaluate(statement, context);
        if (result instanceof ReturnValue ||
            result instanceof TailCallReturnValue ||
            result instanceof BreakValue ||
            result instanceof ContinueValue) {
            break;
        }
    }
    return result;
}
/**
 * WARNING: Do not use object literal shorthands, e.g.
 *   {
 *     *Literal(node: es.Literal, ...) {...},
 *     *ThisExpression(node: es.ThisExpression, ..._ {...},
 *     ...
 *   }
 * They do not minify well, raising uncaught syntax errors in production.
 * See: https://github.com/webpack/webpack/issues/7566
 */
// tslint:disable:object-literal-shorthand
// prettier-ignore
exports.evaluators = {
    /** Simple Values */
    Literal: function* (node, _context) {
        return node.value;
    },
    TemplateLiteral: function* (node) {
        // Expressions like `${1}` are not allowed, so no processing needed
        return node.quasis[0].value.cooked;
    },
    ThisExpression: function* (node, context) {
        return currentEnvironment(context).thisContext;
    },
    ArrayExpression: function* (node, context) {
        const res = [];
        for (const n of node.elements) {
            res.push(yield* evaluate(n, context));
        }
        return res;
    },
    DebuggerStatement: function* (node, context) {
        context.runtime.break = true;
        yield;
    },
    FunctionExpression: function* (node, context) {
        return new closure_1.default(node, currentEnvironment(context), context);
    },
    ArrowFunctionExpression: function* (node, context) {
        return closure_1.default.makeFromArrowFunction(node, currentEnvironment(context), context);
    },
    Identifier: function* (node, context) {
        return getVariable(context, node.name);
    },
    CallExpression: function* (node, context) {
        const callee = yield* actualValue(node.callee, context);
        const args = yield* getArgs(context, node);
        let thisContext;
        if (node.callee.type === 'MemberExpression') {
            thisContext = yield* actualValue(node.callee.object, context);
        }
        const result = yield* apply(context, callee, args, node, thisContext);
        return result;
    },
    NewExpression: function* (node, context) {
        const callee = yield* evaluate(node.callee, context);
        const args = [];
        for (const arg of node.arguments) {
            args.push(yield* evaluate(arg, context));
        }
        const obj = {};
        if (callee instanceof closure_1.default) {
            obj.__proto__ = callee.fun.prototype;
            callee.fun.apply(obj, args);
        }
        else {
            obj.__proto__ = callee.prototype;
            callee.apply(obj, args);
        }
        return obj;
    },
    UnaryExpression: function* (node, context) {
        const value = yield* actualValue(node.argument, context);
        const error = rttc.checkUnaryExpression(node, node.operator, value, context.chapter);
        if (error) {
            return handleRuntimeError(context, error);
        }
        return (0, operators_1.evaluateUnaryExpression)(node.operator, value);
    },
    BinaryExpression: function* (node, context) {
        const left = yield* actualValue(node.left, context);
        const right = yield* actualValue(node.right, context);
        const error = rttc.checkBinaryExpression(node, node.operator, context.chapter, left, right);
        if (error) {
            return handleRuntimeError(context, error);
        }
        return (0, operators_1.evaluateBinaryExpression)(node.operator, left, right);
    },
    ConditionalExpression: function* (node, context) {
        return yield* this.IfStatement(node, context);
    },
    LogicalExpression: function* (node, context) {
        return yield* this.ConditionalExpression(transformLogicalExpression(node), context);
    },
    VariableDeclaration: function* (node, context) {
        const declaration = node.declarations[0];
        const constant = node.kind === 'const';
        const id = declaration.id;
        const value = yield* evaluate(declaration.init, context);
        defineVariable(context, id.name, value, constant);
        return undefined;
    },
    ContinueStatement: function* (_node, _context) {
        return new ContinueValue();
    },
    BreakStatement: function* (_node, _context) {
        return new BreakValue();
    },
    ForStatement: function* (node, context) {
        // Create a new block scope for the loop variables
        const loopEnvironment = (0, exports.createBlockEnvironment)(context, 'forLoopEnvironment');
        (0, exports.pushEnvironment)(context, loopEnvironment);
        const initNode = node.init;
        const testNode = node.test;
        const updateNode = node.update;
        if (initNode.type === 'VariableDeclaration') {
            declareVariables(context, initNode);
        }
        yield* actualValue(initNode, context);
        let value;
        while (yield* actualValue(testNode, context)) {
            // create block context and shallow copy loop environment head
            // see https://www.ecma-international.org/ecma-262/6.0/#sec-for-statement-runtime-semantics-labelledevaluation
            // and https://hacks.mozilla.org/2015/07/es6-in-depth-let-and-const/
            // We copy this as a const to avoid ES6 funkiness when mutating loop vars
            // https://github.com/source-academy/js-slang/issues/65#issuecomment-425618227
            const environment = (0, exports.createBlockEnvironment)(context, 'forBlockEnvironment');
            (0, exports.pushEnvironment)(context, environment);
            for (const name in loopEnvironment.head) {
                if (loopEnvironment.head.hasOwnProperty(name)) {
                    declareIdentifier(context, name, node);
                    defineVariable(context, name, loopEnvironment.head[name], true);
                }
            }
            value = yield* actualValue(node.body, context);
            // Remove block context
            popEnvironment(context);
            if (value instanceof ContinueValue) {
                value = undefined;
            }
            if (value instanceof BreakValue) {
                value = undefined;
                break;
            }
            if (value instanceof ReturnValue || value instanceof TailCallReturnValue) {
                break;
            }
            yield* actualValue(updateNode, context);
        }
        popEnvironment(context);
        return value;
    },
    MemberExpression: function* (node, context) {
        let obj = yield* actualValue(node.object, context);
        if (obj instanceof closure_1.default) {
            obj = obj.fun;
        }
        let prop;
        if (node.computed) {
            prop = yield* actualValue(node.property, context);
        }
        else {
            prop = node.property.name;
        }
        const error = rttc.checkMemberAccess(node, obj, prop);
        if (error) {
            return handleRuntimeError(context, error);
        }
        if (obj !== null &&
            obj !== undefined &&
            typeof obj[prop] !== 'undefined' &&
            !obj.hasOwnProperty(prop)) {
            return handleRuntimeError(context, new errors.GetInheritedPropertyError(node, obj, prop));
        }
        try {
            return obj[prop];
        }
        catch (_a) {
            return handleRuntimeError(context, new errors.GetPropertyError(node, obj, prop));
        }
    },
    AssignmentExpression: function* (node, context) {
        if (node.left.type === 'MemberExpression') {
            const left = node.left;
            const obj = yield* actualValue(left.object, context);
            let prop;
            if (left.computed) {
                prop = yield* actualValue(left.property, context);
            }
            else {
                prop = left.property.name;
            }
            const error = rttc.checkMemberAccess(node, obj, prop);
            if (error) {
                return handleRuntimeError(context, error);
            }
            const val = yield* evaluate(node.right, context);
            try {
                obj[prop] = val;
            }
            catch (_a) {
                return handleRuntimeError(context, new errors.SetPropertyError(node, obj, prop));
            }
            return val;
        }
        const id = node.left;
        // Make sure it exist
        const value = yield* evaluate(node.right, context);
        setVariable(context, id.name, value);
        return value;
    },
    FunctionDeclaration: function* (node, context) {
        const id = node.id;
        if (id === null) {
            throw new Error("Encountered a FunctionDeclaration node without an identifier. This should have been caught when parsing.");
        }
        // tslint:disable-next-line:no-any
        const closure = new closure_1.default(node, currentEnvironment(context), context);
        defineVariable(context, id.name, closure, true);
        return undefined;
    },
    IfStatement: function* (node, context) {
        const result = yield* reduceIf(node, context);
        if (result === null) {
            return undefined;
        }
        return yield* evaluate(result, context);
    },
    ExpressionStatement: function* (node, context) {
        return yield* evaluate(node.expression, context);
    },
    ReturnStatement: function* (node, context) {
        let returnExpression = node.argument;
        // If we have a conditional expression, reduce it until we get something else
        while (returnExpression.type === 'LogicalExpression' ||
            returnExpression.type === 'ConditionalExpression') {
            if (returnExpression.type === 'LogicalExpression') {
                returnExpression = transformLogicalExpression(returnExpression);
            }
            returnExpression = yield* reduceIf(returnExpression, context);
        }
        // If we are now left with a CallExpression, then we use TCO
        if (returnExpression.type === 'CallExpression' && context.variant !== types_1.Variant.LAZY) {
            const callee = yield* actualValue(returnExpression.callee, context);
            const args = yield* getArgs(context, returnExpression);
            return new TailCallReturnValue(callee, args, returnExpression);
        }
        else {
            return new ReturnValue(yield* evaluate(returnExpression, context));
        }
    },
    WhileStatement: function* (node, context) {
        let value; // tslint:disable-line
        while (
        // tslint:disable-next-line
        (yield* actualValue(node.test, context)) &&
            !(value instanceof ReturnValue) &&
            !(value instanceof BreakValue) &&
            !(value instanceof TailCallReturnValue)) {
            value = yield* actualValue(node.body, context);
        }
        if (value instanceof BreakValue) {
            return undefined;
        }
        return value;
    },
    ObjectExpression: function* (node, context) {
        const obj = {};
        for (const propUntyped of node.properties) {
            // node.properties: es.Property | es.SpreadExpression, but
            // our Acorn is set to ES6 which cannot have a es.SpreadExpression
            // at this point. Force the type.
            const prop = propUntyped;
            let key;
            if (prop.key.type === 'Identifier') {
                key = prop.key.name;
            }
            else {
                key = yield* evaluate(prop.key, context);
            }
            obj[key] = yield* evaluate(prop.value, context);
        }
        return obj;
    },
    BlockStatement: function* (node, context) {
        // Create a new environment (block scoping)
        const environment = (0, exports.createBlockEnvironment)(context, 'blockEnvironment');
        (0, exports.pushEnvironment)(context, environment);
        const result = yield* evaluateBlockStatement(context, node);
        popEnvironment(context);
        return result;
    },
    ImportDeclaration: function* (node, context) {
        throw new Error('ImportDeclarations should already have been removed');
    },
    ExportNamedDeclaration: function* (_node, _context) {
        // Exports are handled as a separate pre-processing step in 'transformImportedFile'.
        // Subsequently, they are removed from the AST by 'removeExports' before the AST is evaluated.
        // As such, there should be no ExportNamedDeclaration nodes in the AST.
        throw new Error('Encountered an ExportNamedDeclaration node in the AST while evaluating. This suggests that an invariant has been broken.');
    },
    ExportDefaultDeclaration: function* (_node, _context) {
        // Exports are handled as a separate pre-processing step in 'transformImportedFile'.
        // Subsequently, they are removed from the AST by 'removeExports' before the AST is evaluated.
        // As such, there should be no ExportDefaultDeclaration nodes in the AST.
        throw new Error('Encountered an ExportDefaultDeclaration node in the AST while evaluating. This suggests that an invariant has been broken.');
    },
    ExportAllDeclaration: function* (_node, _context) {
        // Exports are handled as a separate pre-processing step in 'transformImportedFile'.
        // Subsequently, they are removed from the AST by 'removeExports' before the AST is evaluated.
        // As such, there should be no ExportAllDeclaration nodes in the AST.
        throw new Error('Encountered an ExportAllDeclaration node in the AST while evaluating. This suggests that an invariant has been broken.');
    },
    Program: function* (node, context) {
        throw new Error('A program should not contain another program within itself');
    }
};
// tslint:enable:object-literal-shorthand
// TODO: move to util
/**
 * Checks if `env` is empty (that is, head of env is an empty object)
 */
function isEmptyEnvironment(env) {
    return (0, lodash_1.isEmpty)(env.head);
}
/**
 * Extracts the non-empty tail environment from the given environment and
 * returns current environment if tail environment is a null.
 */
function getNonEmptyEnv(environment) {
    if (isEmptyEnvironment(environment)) {
        const tailEnvironment = environment.tail;
        if (tailEnvironment === null) {
            return environment;
        }
        return getNonEmptyEnv(tailEnvironment);
    }
    else {
        return environment;
    }
}
function* evaluateProgram(program, context, checkImports, loadTabs) {
    yield* visit(context, program);
    context.numberOfOuterEnvironments += 1;
    const environment = (0, exports.createBlockEnvironment)(context, 'programEnvironment');
    (0, exports.pushEnvironment)(context, environment);
    const otherNodes = [];
    const moduleFunctions = {};
    try {
        for (const node of program.body) {
            if (node.type !== 'ImportDeclaration') {
                otherNodes.push(node);
                continue;
            }
            yield* visit(context, node);
            const moduleName = node.source.value;
            (0, assert_1.default)(typeof moduleName === 'string', `ImportDeclarations should have string sources, got ${moduleName}`);
            if (!(moduleName in moduleFunctions)) {
                (0, moduleLoader_1.initModuleContext)(moduleName, context, loadTabs);
                moduleFunctions[moduleName] = (0, moduleLoader_1.loadModuleBundle)(moduleName, context, node);
            }
            const functions = moduleFunctions[moduleName];
            for (const spec of node.specifiers) {
                (0, assert_1.default)(spec.type === 'ImportSpecifier', `Only Import Specifiers are supported, got ${spec.type}`);
                if (checkImports && !(spec.imported.name in functions)) {
                    throw new errors_1.UndefinedImportError(spec.imported.name, moduleName, spec);
                }
                declareIdentifier(context, spec.local.name, node);
                defineVariable(context, spec.local.name, functions[spec.imported.name], true);
            }
            yield* leave(context);
        }
    }
    catch (error) {
        handleRuntimeError(context, error);
    }
    const newProgram = create.blockStatement(otherNodes);
    const result = yield* forceIt(yield* evaluateBlockStatement(context, newProgram), context);
    yield* leave(context); // Done visiting program
    if (result instanceof closure_1.default) {
        Object.defineProperty(getNonEmptyEnv(currentEnvironment(context)).head, (0, lodash_1.uniqueId)(), {
            value: result,
            writable: false,
            enumerable: true
        });
    }
    return result;
}
exports.evaluateProgram = evaluateProgram;
function* evaluate(node, context) {
    yield* visit(context, node);
    const result = yield* exports.evaluators[node.type](node, context);
    yield* leave(context);
    if (result instanceof closure_1.default) {
        Object.defineProperty(getNonEmptyEnv(currentEnvironment(context)).head, (0, lodash_1.uniqueId)(), {
            value: result,
            writable: false,
            enumerable: true
        });
    }
    return result;
}
function* apply(context, fun, args, node, thisContext) {
    var _a, _b;
    let result;
    let total = 0;
    while (!(result instanceof ReturnValue)) {
        if (fun instanceof closure_1.default) {
            checkNumberOfArguments(context, fun, args, node);
            const environment = createEnvironment(fun, args, node);
            if (result instanceof TailCallReturnValue) {
                replaceEnvironment(context, environment);
            }
            else {
                (0, exports.pushEnvironment)(context, environment);
                total++;
            }
            const bodyEnvironment = (0, exports.createBlockEnvironment)(context, 'functionBodyEnvironment');
            bodyEnvironment.thisContext = thisContext;
            (0, exports.pushEnvironment)(context, bodyEnvironment);
            result = yield* evaluateBlockStatement(context, fun.node.body);
            popEnvironment(context);
            if (result instanceof TailCallReturnValue) {
                fun = result.callee;
                node = result.node;
                args = result.args;
            }
            else if (!(result instanceof ReturnValue)) {
                // No Return Value, set it as undefined
                result = new ReturnValue(undefined);
            }
        }
        else if (fun instanceof createContext_1.LazyBuiltIn) {
            try {
                let finalArgs = args;
                if (fun.evaluateArgs) {
                    finalArgs = [];
                    for (const arg of args) {
                        finalArgs.push(yield* forceIt(arg, context));
                    }
                }
                result = fun.func.apply(thisContext, finalArgs);
                break;
            }
            catch (e) {
                // Recover from exception
                context.runtime.environments = context.runtime.environments.slice(-context.numberOfOuterEnvironments);
                const loc = (_a = node.loc) !== null && _a !== void 0 ? _a : constants_1.UNKNOWN_LOCATION;
                if (!(e instanceof runtimeSourceError_1.RuntimeSourceError || e instanceof errors.ExceptionError)) {
                    // The error could've arisen when the builtin called a source function which errored.
                    // If the cause was a source error, we don't want to include the error.
                    // However if the error came from the builtin itself, we need to handle it.
                    return handleRuntimeError(context, new errors.ExceptionError(e, loc));
                }
                result = undefined;
                throw e;
            }
        }
        else if (typeof fun === 'function') {
            checkNumberOfArguments(context, fun, args, node);
            try {
                const forcedArgs = [];
                for (const arg of args) {
                    forcedArgs.push(yield* forceIt(arg, context));
                }
                result = fun.apply(thisContext, forcedArgs);
                break;
            }
            catch (e) {
                // Recover from exception
                context.runtime.environments = context.runtime.environments.slice(-context.numberOfOuterEnvironments);
                const loc = (_b = node.loc) !== null && _b !== void 0 ? _b : constants_1.UNKNOWN_LOCATION;
                if (!(e instanceof runtimeSourceError_1.RuntimeSourceError || e instanceof errors.ExceptionError)) {
                    // The error could've arisen when the builtin called a source function which errored.
                    // If the cause was a source error, we don't want to include the error.
                    // However if the error came from the builtin itself, we need to handle it.
                    return handleRuntimeError(context, new errors.ExceptionError(e, loc));
                }
                result = undefined;
                throw e;
            }
        }
        else {
            return handleRuntimeError(context, new errors.CallingNonFunctionValue(fun, node));
        }
    }
    // Unwraps return value and release stack environment
    if (result instanceof ReturnValue) {
        result = result.value;
    }
    for (let i = 1; i <= total; i++) {
        popEnvironment(context);
    }
    return result;
}
exports.apply = apply;
//# sourceMappingURL=interpreter.js.map