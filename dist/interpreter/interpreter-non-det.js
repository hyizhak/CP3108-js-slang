"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nonDetEvaluate = exports.apply = exports.evaluate = exports.evaluators = void 0;
const lodash_1 = require("lodash");
const constants_1 = require("../constants");
const errors = require("../errors/errors");
const runtimeSourceError_1 = require("../errors/runtimeSourceError");
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
        const ident = param;
        environment.head[ident.name] = args[index];
    });
    return environment;
};
const createBlockEnvironment = (context, name = 'blockEnvironment', head = {}) => {
    return {
        name,
        tail: currentEnvironment(context),
        head,
        thisContext: context,
        id: (0, lodash_1.uniqueId)()
    };
};
const handleRuntimeError = (context, error) => {
    context.errors.push(error);
    context.runtime.environments = context.runtime.environments.slice(-context.numberOfOuterEnvironments);
    throw error;
};
const DECLARED_BUT_NOT_YET_ASSIGNED = Symbol('Used to implement declaration');
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
function declareFunctionAndVariableIdentifiers(context, node) {
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
    const environment = context.runtime.environments[0];
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
function undefineVariable(context, name) {
    const environment = context.runtime.environments[0];
    Object.defineProperty(environment.head, name, {
        value: DECLARED_BUT_NOT_YET_ASSIGNED,
        writable: true,
        enumerable: true
    });
}
const currentEnvironment = (context) => context.runtime.environments[0];
const popEnvironment = (context) => context.runtime.environments.shift();
const pushEnvironment = (context, environment) => context.runtime.environments.unshift(environment);
const getVariable = (context, name, ensureVariableAssigned) => {
    let environment = context.runtime.environments[0];
    while (environment) {
        if (environment.head.hasOwnProperty(name)) {
            if (environment.head[name] === DECLARED_BUT_NOT_YET_ASSIGNED) {
                if (ensureVariableAssigned) {
                    return handleRuntimeError(context, new errors.UnassignedVariable(name, context.runtime.nodes[0]));
                }
                else {
                    return DECLARED_BUT_NOT_YET_ASSIGNED;
                }
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
    let environment = context.runtime.environments[0];
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
    if (callee.node.params.length !== args.length) {
        return handleRuntimeError(context, new errors.InvalidNumberOfArguments(exp, callee.node.params.length, args.length));
    }
    return undefined;
};
/**
 * Returns a random integer for a given interval (inclusive).
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
function* getAmbRArgs(context, call) {
    const args = (0, lodash_1.cloneDeep)(call.arguments);
    while (args.length > 0) {
        const r = randomInt(0, args.length - 1);
        const arg = args.splice(r, 1)[0];
        yield* evaluate(arg, context);
    }
}
function* getArgs(context, call) {
    const args = (0, lodash_1.cloneDeep)(call.arguments);
    return yield* cartesianProduct(context, args, []);
}
/* Given a list of non deterministic nodes, this generator returns every
 * combination of values of these nodes */
function* cartesianProduct(context, nodes, nodeValues) {
    if (nodes.length === 0) {
        yield nodeValues;
    }
    else {
        const currentNode = nodes.shift(); // we need the postfix ! to tell compiler that nodes array is nonempty
        const nodeValueGenerator = evaluate(currentNode, context);
        for (const nodeValue of nodeValueGenerator) {
            nodeValues.push(nodeValue);
            yield* cartesianProduct(context, nodes, nodeValues);
            nodeValues.pop();
        }
        nodes.unshift(currentNode);
    }
}
function* getAmbArgs(context, call) {
    for (const arg of call.arguments) {
        yield* evaluate(arg, context);
    }
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
    const testGenerator = evaluate(node.test, context);
    for (const test of testGenerator) {
        const error = rttc.checkIfStatement(node, test, context.chapter);
        if (error) {
            return handleRuntimeError(context, error);
        }
        yield test ? node.consequent : node.alternate;
    }
}
function* evaluateBlockSatement(context, node) {
    declareFunctionAndVariableIdentifiers(context, node);
    yield* evaluateSequence(context, node.body);
}
function* evaluateSequence(context, sequence) {
    if (sequence.length === 0) {
        return yield undefined;
    }
    const firstStatement = sequence[0];
    const sequenceValGenerator = evaluate(firstStatement, context);
    if (sequence.length === 1) {
        yield* sequenceValGenerator;
    }
    else {
        sequence.shift();
        let shouldUnshift = true;
        for (const sequenceValue of sequenceValGenerator) {
            // prevent unshifting of cut operator
            shouldUnshift = sequenceValue !== constants_1.CUT;
            if (sequenceValue instanceof ReturnValue ||
                sequenceValue instanceof BreakValue ||
                sequenceValue instanceof ContinueValue) {
                yield sequenceValue;
                continue;
            }
            const res = yield* evaluateSequence(context, sequence);
            if (res === constants_1.CUT) {
                // prevent unshifting of statements before cut
                shouldUnshift = false;
                break;
            }
        }
        if (shouldUnshift)
            sequence.unshift(firstStatement);
        else
            return constants_1.CUT;
    }
}
function* evaluateConditional(node, context) {
    const branchGenerator = reduceIf(node, context);
    for (const branch of branchGenerator) {
        yield* evaluate(branch, context);
    }
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
        yield node.value;
    },
    ArrowFunctionExpression: function* (node, context) {
        yield closure_1.default.makeFromArrowFunction(node, currentEnvironment(context), context);
    },
    ArrayExpression: function* (node, context) {
        const arrayGenerator = cartesianProduct(context, node.elements, []);
        for (const array of arrayGenerator) {
            yield array.slice(); // yield a new array to avoid modifying previous ones
        }
    },
    Identifier: function* (node, context) {
        return yield getVariable(context, node.name, true);
    },
    CallExpression: function* (node, context) {
        const callee = node.callee;
        if (rttc.isIdentifier(callee)) {
            switch (callee.name) {
                case 'amb':
                    return yield* getAmbArgs(context, node);
                case 'ambR':
                    return yield* getAmbRArgs(context, node);
                case 'cut':
                    return yield constants_1.CUT;
            }
        }
        const calleeGenerator = evaluate(node.callee, context);
        for (const calleeValue of calleeGenerator) {
            const argsGenerator = getArgs(context, node);
            for (const args of argsGenerator) {
                yield* apply(context, calleeValue, args, node, undefined);
            }
        }
    },
    UnaryExpression: function* (node, context) {
        const argGenerator = evaluate(node.argument, context);
        for (const argValue of argGenerator) {
            const error = rttc.checkUnaryExpression(node, node.operator, argValue, context.chapter);
            if (error) {
                return handleRuntimeError(context, error);
            }
            yield (0, operators_1.evaluateUnaryExpression)(node.operator, argValue);
        }
        return;
    },
    BinaryExpression: function* (node, context) {
        const pairGenerator = cartesianProduct(context, [node.left, node.right], []);
        for (const pair of pairGenerator) {
            const leftValue = pair[0];
            const rightValue = pair[1];
            const error = rttc.checkBinaryExpression(node, node.operator, context.chapter, leftValue, rightValue);
            if (error) {
                return handleRuntimeError(context, error);
            }
            yield (0, operators_1.evaluateBinaryExpression)(node.operator, leftValue, rightValue);
        }
        return;
    },
    ConditionalExpression: function* (node, context) {
        yield* evaluateConditional(node, context);
    },
    LogicalExpression: function* (node, context) {
        const conditional = transformLogicalExpression(node);
        yield* evaluateConditional(conditional, context);
    },
    VariableDeclaration: function* (node, context) {
        const declaration = node.declarations[0];
        const constant = node.kind === 'const';
        const id = declaration.id;
        const valueGenerator = evaluate(declaration.init, context);
        for (const value of valueGenerator) {
            defineVariable(context, id.name, value, constant);
            yield value;
            undefineVariable(context, id.name);
        }
        return undefined;
    },
    MemberExpression: function* (node, context) {
        // es.PrivateIdentifier is a ES2022 feature
        const pairGenerator = cartesianProduct(context, [node.property, node.object], []);
        for (const pair of pairGenerator) {
            const prop = pair[0];
            const obj = pair[1];
            const error = rttc.checkMemberAccess(node, obj, prop);
            if (error) {
                return yield handleRuntimeError(context, error);
            }
            yield obj[prop];
        }
        return;
    },
    AssignmentExpression: function* (node, context) {
        if (node.left.type === 'MemberExpression') {
            // es.PrivateIdentifier is a ES2022 feature
            const tripleGenerator = cartesianProduct(context, [node.right, node.left.property, node.left.object], []);
            for (const triple of tripleGenerator) {
                const val = triple[0];
                const prop = triple[1];
                const obj = triple[2];
                const error = rttc.checkMemberAccess(node, obj, prop);
                if (error) {
                    return yield handleRuntimeError(context, error);
                }
                const originalElementValue = obj[prop];
                obj[prop] = val;
                yield val;
                obj[prop] = originalElementValue;
            }
            return;
        }
        const id = node.left;
        const originalValue = getVariable(context, id.name, false);
        const valueGenerator = evaluate(node.right, context);
        for (const value of valueGenerator) {
            setVariable(context, id.name, value);
            yield value;
            setVariable(context, id.name, originalValue);
        }
        return;
    },
    FunctionDeclaration: function* (node, context) {
        const id = node.id;
        if (id === null) {
            throw new Error("Encountered a FunctionDeclaration node without an identifier. This should have been caught when parsing.");
        }
        const closure = new closure_1.default(node, currentEnvironment(context), context);
        defineVariable(context, id.name, closure, true);
        yield undefined;
        undefineVariable(context, id.name);
    },
    IfStatement: function* (node, context) {
        yield* evaluateConditional(node, context);
    },
    ExpressionStatement: function* (node, context) {
        return yield* evaluate(node.expression, context);
    },
    ContinueStatement: function* (_node, _context) {
        yield new ContinueValue();
    },
    BreakStatement: function* (_node, _context) {
        yield new BreakValue();
    },
    WhileStatement: function* (node, context) {
        let value; // tslint:disable-line
        function* loop() {
            const testGenerator = evaluate(node.test, context);
            for (const test of testGenerator) {
                const error = rttc.checkIfStatement(node.test, test, context.chapter);
                if (error)
                    return handleRuntimeError(context, error);
                if (test &&
                    !(value instanceof ReturnValue) &&
                    !(value instanceof BreakValue)) {
                    const iterationValueGenerator = evaluate((0, lodash_1.cloneDeep)(node.body), context);
                    for (const iterationValue of iterationValueGenerator) {
                        value = iterationValue;
                        yield* loop();
                    }
                }
                else {
                    if (value instanceof BreakValue || value instanceof ContinueValue) {
                        yield undefined;
                    }
                    else {
                        yield value;
                    }
                }
            }
        }
        yield* loop();
    },
    ForStatement: function* (node, context) {
        let value;
        function* loop() {
            const testGenerator = evaluate(node.test, context);
            for (const test of testGenerator) {
                const error = rttc.checkIfStatement(node.test, test, context.chapter);
                if (error)
                    return handleRuntimeError(context, error);
                if (test &&
                    !(value instanceof ReturnValue) &&
                    !(value instanceof BreakValue)) {
                    const iterationEnvironment = createBlockEnvironment(context, 'forBlockEnvironment');
                    pushEnvironment(context, iterationEnvironment);
                    for (const name in loopEnvironment.head) {
                        if (loopEnvironment.head.hasOwnProperty(name)) {
                            declareIdentifier(context, name, node);
                            defineVariable(context, name, loopEnvironment.head[name], true);
                        }
                    }
                    const iterationValueGenerator = evaluate((0, lodash_1.cloneDeep)(node.body), context);
                    for (const iterationValue of iterationValueGenerator) {
                        value = iterationValue;
                        popEnvironment(context);
                        const updateNode = evaluate(node.update, context);
                        for (const _update of updateNode) {
                            yield* loop();
                        }
                        pushEnvironment(context, iterationEnvironment);
                    }
                    popEnvironment(context);
                }
                else {
                    if (value instanceof BreakValue || value instanceof ContinueValue) {
                        yield undefined;
                    }
                    else {
                        yield value;
                    }
                }
            }
        }
        // Create a new block scope for the loop variables
        const loopEnvironment = createBlockEnvironment(context, 'forLoopEnvironment');
        pushEnvironment(context, loopEnvironment);
        const initNode = node.init;
        if (initNode.type === 'VariableDeclaration') {
            declareVariables(context, initNode);
        }
        const initNodeGenerator = evaluate(node.init, context);
        for (const _init of initNodeGenerator) {
            const loopGenerator = loop();
            for (const loopValue of loopGenerator) {
                popEnvironment(context);
                yield loopValue;
                pushEnvironment(context, loopEnvironment);
            }
        }
        popEnvironment(context);
    },
    ReturnStatement: function* (node, context) {
        const returnExpression = node.argument;
        const returnValueGenerator = evaluate(returnExpression, context);
        for (const returnValue of returnValueGenerator) {
            yield new ReturnValue(returnValue);
        }
    },
    BlockStatement: function* (node, context) {
        // Create a new environment (block scoping)
        const environment = createBlockEnvironment(context, 'blockEnvironment');
        pushEnvironment(context, environment);
        const resultGenerator = evaluateBlockSatement(context, node);
        for (const result of resultGenerator) {
            popEnvironment(context);
            yield result;
            pushEnvironment(context, environment);
        }
        popEnvironment(context);
    },
    Program: function* (node, context) {
        context.numberOfOuterEnvironments += 1;
        const environment = createBlockEnvironment(context, 'programEnvironment');
        pushEnvironment(context, environment);
        return yield* evaluateBlockSatement(context, node);
    }
};
// tslint:enable:object-literal-shorthand
function* evaluate(node, context) {
    const result = yield* exports.evaluators[node.type](node, context);
    return result;
}
exports.evaluate = evaluate;
exports.nonDetEvaluate = evaluate;
function* apply(context, fun, args, node, thisContext) {
    var _a;
    if (fun instanceof closure_1.default) {
        checkNumberOfArguments(context, fun, args, node);
        const environment = createEnvironment(fun, args, node);
        environment.thisContext = thisContext;
        pushEnvironment(context, environment);
        const applicationValueGenerator = evaluateBlockSatement(context, (0, lodash_1.cloneDeep)(fun.node.body));
        // This function takes a value that may be a ReturnValue.
        // If so, it returns the value wrapped in the ReturnValue.
        // If not, it returns the default value.
        function unwrapReturnValue(result, defaultValue) {
            if (result instanceof ReturnValue) {
                return result.value;
            }
            else {
                return defaultValue;
            }
        }
        for (const applicationValue of applicationValueGenerator) {
            popEnvironment(context);
            yield unwrapReturnValue(applicationValue, undefined);
            pushEnvironment(context, environment);
        }
        popEnvironment(context);
    }
    else if (typeof fun === 'function') {
        try {
            yield fun.apply(thisContext, args);
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
            throw e;
        }
    }
    else {
        return handleRuntimeError(context, new errors.CallingNonFunctionValue(fun, node));
    }
    return;
}
exports.apply = apply;
//# sourceMappingURL=interpreter-non-det.js.map