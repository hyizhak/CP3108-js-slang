"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasContinueStatement = exports.hasBreakStatement = exports.hasReturnStatement = exports.checkStackOverFlow = exports.checkNumberOfArguments = exports.handleRuntimeError = exports.setVariable = exports.getVariable = exports.defineVariable = exports.hasImportDeclarations = exports.hasDeclarations = exports.declareFunctionsAndVariables = exports.declareIdentifier = exports.createBlockEnvironment = exports.pushEnvironment = exports.popEnvironment = exports.createEnvironment = exports.currentEnvironment = exports.isSimpleFunction = exports.envChanging = exports.valueProducing = exports.reduceConditional = exports.handleSequence = exports.isAssmtInstr = exports.isRestElement = exports.isBlockStatement = exports.isIfStatement = exports.isReturnStatement = exports.isIdentifier = exports.isNode = exports.isInstr = exports.Stack = void 0;
const lodash_1 = require("lodash");
const errors = require("../errors/errors");
const closure_1 = require("../interpreter/closure");
const ast = require("../utils/astCreator");
const instr = require("./instrCreator");
const types_1 = require("./types");
class Stack {
    constructor() {
        // Bottom of the array is at index 0
        this.storage = [];
    }
    push(...items) {
        for (const item of items) {
            this.storage.push(item);
        }
    }
    pop() {
        return this.storage.pop();
    }
    peek() {
        if (this.isEmpty()) {
            return undefined;
        }
        return this.storage[this.size() - 1];
    }
    size() {
        return this.storage.length;
    }
    isEmpty() {
        return this.size() == 0;
    }
    getStack() {
        // return a copy of the stack's contents
        return [...this.storage];
    }
    some(predicate) {
        return this.storage.some(predicate);
    }
}
exports.Stack = Stack;
/**
 * Typeguard for Instr to distinguish between program statements and instructions.
 *
 * @param command An AgendaItem
 * @returns true if the AgendaItem is an instruction and false otherwise.
 */
const isInstr = (command) => {
    return command.instrType !== undefined;
};
exports.isInstr = isInstr;
/**
 * Typeguard for esNode to distinguish between program statements and instructions.
 *
 * @param command An AgendaItem
 * @returns true if the AgendaItem is an esNode and false if it is an instruction.
 */
const isNode = (command) => {
    return command.type !== undefined;
};
exports.isNode = isNode;
/**
 * Typeguard for esIdentifier. To verify if an esNode is an esIdentifier.
 *
 * @param node an esNode
 * @returns true if node is an esIdentifier, false otherwise.
 */
const isIdentifier = (node) => {
    return node.name !== undefined;
};
exports.isIdentifier = isIdentifier;
/**
 * Typeguard for esReturnStatement. To verify if an esNode is an esReturnStatement.
 *
 * @param node an esNode
 * @returns true if node is an esReturnStatement, false otherwise.
 */
const isReturnStatement = (node) => {
    return node.type == 'ReturnStatement';
};
exports.isReturnStatement = isReturnStatement;
/**
 * Typeguard for esIfStatement. To verify if an esNode is an esIfStatement.
 *
 * @param node an esNode
 * @returns true if node is an esIfStatement, false otherwise.
 */
const isIfStatement = (node) => {
    return node.type == 'IfStatement';
};
exports.isIfStatement = isIfStatement;
/**
 * Typeguard for esBlockStatement. To verify if an esNode is a block statement.
 *
 * @param node an esNode
 * @returns true if node is an esBlockStatement, false otherwise.
 */
const isBlockStatement = (node) => {
    return node.type == 'BlockStatement';
};
exports.isBlockStatement = isBlockStatement;
/**
 * Typeguard for esRestElement. To verify if an esNode is a block statement.
 *
 * @param node an esNode
 * @returns true if node is an esRestElement, false otherwise.
 */
const isRestElement = (node) => {
    return node.type == 'RestElement';
};
exports.isRestElement = isRestElement;
/**
 * Typeguard for AssmtInstr. To verify if an instruction is an assignment instruction.
 *
 * @param instr an instruction
 * @returns true if instr is an AssmtInstr, false otherwise.
 */
const isAssmtInstr = (instr) => {
    return instr.instrType === types_1.InstrType.ASSIGNMENT;
};
exports.isAssmtInstr = isAssmtInstr;
/**
 * A helper function for handling sequences of statements.
 * Statements must be pushed in reverse order, and each statement is separated by a pop
 * instruction so that only the result of the last statement remains on stash.
 * Value producing statements have an extra pop instruction.
 *
 * @param seq Array of statements.
 * @returns Array of commands to be pushed into agenda.
 */
const handleSequence = (seq) => {
    const result = [];
    let valueProduced = false;
    for (const command of seq) {
        if (!isImportDeclaration(command)) {
            if ((0, exports.valueProducing)(command)) {
                // Value producing statements have an extra pop instruction
                if (valueProduced) {
                    result.push(instr.popInstr(command));
                }
                else {
                    valueProduced = true;
                }
            }
            result.push(command);
        }
    }
    // Push statements in reverse order
    return result.reverse();
};
exports.handleSequence = handleSequence;
/**
 * This function is used for ConditionalExpressions and IfStatements, to create the sequence
 * of agenda items to be added.
 */
const reduceConditional = (node) => {
    return [instr.branchInstr(node.consequent, node.alternate, node), node.test];
};
exports.reduceConditional = reduceConditional;
/**
 * To determine if an agenda item is value producing. JavaScript distinguishes value producing
 * statements and non-value producing statements.
 * Refer to https://sourceacademy.nus.edu.sg/sicpjs/4.1.2 exercise 4.8.
 *
 * @param command Agenda item to determine if it is value producing.
 * @returns true if it is value producing, false otherwise.
 */
const valueProducing = (command) => {
    const type = command.type;
    return (type !== 'VariableDeclaration' &&
        type !== 'FunctionDeclaration' &&
        type !== 'ContinueStatement' &&
        type !== 'BreakStatement' &&
        type !== 'DebuggerStatement' &&
        (type !== 'BlockStatement' || command.body.some(exports.valueProducing)));
};
exports.valueProducing = valueProducing;
/**
 * To determine if an agenda item changes the environment.
 * There is a change in the environment when
 *  1. pushEnvironment() is called when creating a new frame, if there are variable declarations.
 *     Called in Program, BlockStatement, and Application instructions.
 *  2. there is an assignment.
 *     Called in Assignment and Array Assignment instructions.
 *
 * @param command Agenda item to check against.
 * @returns true if it changes the environment, false otherwise.
 */
const envChanging = (command) => {
    if ((0, exports.isNode)(command)) {
        const type = command.type;
        return type === 'Program' || (type === 'BlockStatement' && hasDeclarations(command));
    }
    else {
        const type = command.instrType;
        return (type === types_1.InstrType.ASSIGNMENT ||
            type === types_1.InstrType.ARRAY_ASSIGNMENT ||
            (type === types_1.InstrType.APPLICATION && command.numOfArgs > 0));
    }
};
exports.envChanging = envChanging;
/**
 * To determine if the function is simple.
 * Simple functions contain a single return statement.
 *
 * @param node The function to check against.
 * @returns true if the function is simple, false otherwise.
 */
const isSimpleFunction = (node) => {
    if (node.body.type !== 'BlockStatement') {
        return true;
    }
    else {
        const block = node.body;
        return block.body.length === 1 && block.body[0].type === 'ReturnStatement';
    }
};
exports.isSimpleFunction = isSimpleFunction;
/**
 * Environments
 */
const currentEnvironment = (context) => context.runtime.environments[0];
exports.currentEnvironment = currentEnvironment;
const createEnvironment = (closure, args, callExpression) => {
    const environment = {
        name: (0, exports.isIdentifier)(callExpression.callee) ? callExpression.callee.name : closure.functionName,
        tail: closure.environment,
        head: {},
        id: (0, lodash_1.uniqueId)(),
        callExpression: Object.assign(Object.assign({}, callExpression), { arguments: args.map(ast.primitive) })
    };
    closure.node.params.forEach((param, index) => {
        if ((0, exports.isRestElement)(param)) {
            environment.head[param.argument.name] = args.slice(index);
        }
        else {
            environment.head[param.name] = args[index];
        }
    });
    return environment;
};
exports.createEnvironment = createEnvironment;
const popEnvironment = (context) => context.runtime.environments.shift();
exports.popEnvironment = popEnvironment;
const pushEnvironment = (context, environment) => {
    context.runtime.environments.unshift(environment);
    context.runtime.environmentTree.insert(environment);
};
exports.pushEnvironment = pushEnvironment;
const createBlockEnvironment = (context, name = 'blockEnvironment', head = {}) => {
    return {
        name,
        tail: (0, exports.currentEnvironment)(context),
        head,
        id: (0, lodash_1.uniqueId)()
    };
};
exports.createBlockEnvironment = createBlockEnvironment;
/**
 * Variables
 */
const DECLARED_BUT_NOT_YET_ASSIGNED = Symbol('Used to implement block scope');
function declareIdentifier(context, name, node, environment) {
    if (environment.head.hasOwnProperty(name)) {
        const descriptors = Object.getOwnPropertyDescriptors(environment.head);
        return (0, exports.handleRuntimeError)(context, new errors.VariableRedeclaration(node, name, descriptors[name].writable));
    }
    environment.head[name] = DECLARED_BUT_NOT_YET_ASSIGNED;
    return environment;
}
exports.declareIdentifier = declareIdentifier;
function declareVariables(context, node, environment) {
    for (const declaration of node.declarations) {
        declareIdentifier(context, declaration.id.name, node, environment);
    }
}
function declareFunctionsAndVariables(context, node, environment) {
    for (const statement of node.body) {
        switch (statement.type) {
            case 'VariableDeclaration':
                declareVariables(context, statement, environment);
                break;
            case 'FunctionDeclaration':
                declareIdentifier(context, statement.id.name, statement, environment);
                break;
        }
    }
}
exports.declareFunctionsAndVariables = declareFunctionsAndVariables;
function hasDeclarations(node) {
    for (const statement of node.body) {
        if (statement.type === 'VariableDeclaration' || statement.type === 'FunctionDeclaration') {
            return true;
        }
    }
    return false;
}
exports.hasDeclarations = hasDeclarations;
function hasImportDeclarations(node) {
    for (const statement of node.body) {
        if (statement.type === 'ImportDeclaration') {
            return true;
        }
    }
    return false;
}
exports.hasImportDeclarations = hasImportDeclarations;
function isImportDeclaration(node) {
    return node.type === 'ImportDeclaration';
}
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
const getVariable = (context, name, node) => {
    let environment = (0, exports.currentEnvironment)(context);
    while (environment) {
        if (environment.head.hasOwnProperty(name)) {
            if (environment.head[name] === DECLARED_BUT_NOT_YET_ASSIGNED) {
                return (0, exports.handleRuntimeError)(context, new errors.UnassignedVariable(name, node));
            }
            else {
                return environment.head[name];
            }
        }
        else {
            environment = environment.tail;
        }
    }
    return (0, exports.handleRuntimeError)(context, new errors.UndefinedVariable(name, node));
};
exports.getVariable = getVariable;
const setVariable = (context, name, value, node) => {
    let environment = (0, exports.currentEnvironment)(context);
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
            return (0, exports.handleRuntimeError)(context, new errors.ConstAssignment(node, name));
        }
        else {
            environment = environment.tail;
        }
    }
    return (0, exports.handleRuntimeError)(context, new errors.UndefinedVariable(name, node));
};
exports.setVariable = setVariable;
const handleRuntimeError = (context, error) => {
    context.errors.push(error);
    throw error;
};
exports.handleRuntimeError = handleRuntimeError;
const checkNumberOfArguments = (context, callee, args, exp) => {
    var _a;
    if (callee instanceof closure_1.default) {
        // User-defined or Pre-defined functions
        const params = callee.node.params;
        const hasVarArgs = ((_a = params[params.length - 1]) === null || _a === void 0 ? void 0 : _a.type) === 'RestElement';
        if (hasVarArgs ? params.length - 1 > args.length : params.length !== args.length) {
            return (0, exports.handleRuntimeError)(context, new errors.InvalidNumberOfArguments(exp, hasVarArgs ? params.length - 1 : params.length, args.length, hasVarArgs));
        }
    }
    else {
        // Pre-built functions
        const hasVarArgs = callee.minArgsNeeded != undefined;
        if (hasVarArgs ? callee.minArgsNeeded > args.length : callee.length !== args.length) {
            return (0, exports.handleRuntimeError)(context, new errors.InvalidNumberOfArguments(exp, hasVarArgs ? callee.minArgsNeeded : callee.length, args.length, hasVarArgs));
        }
    }
    return undefined;
};
exports.checkNumberOfArguments = checkNumberOfArguments;
/**
 * This function can be used to check for a stack overflow.
 * The current limit is set to be an agenda size of 1.0 x 10^5, if the agenda
 * flows beyond this limit an error is thrown.
 * This corresponds to about 10mb of space according to tests ran.
 */
const checkStackOverFlow = (context, agenda) => {
    if (agenda.size() > 100000) {
        const stacks = [];
        let counter = 0;
        for (let i = 0; counter < errors.MaximumStackLimitExceeded.MAX_CALLS_TO_SHOW &&
            i < context.runtime.environments.length; i++) {
            if (context.runtime.environments[i].callExpression) {
                stacks.unshift(context.runtime.environments[i].callExpression);
                counter++;
            }
        }
        (0, exports.handleRuntimeError)(context, new errors.MaximumStackLimitExceeded(context.runtime.nodes[0], stacks));
    }
};
exports.checkStackOverFlow = checkStackOverFlow;
/**
 * Checks whether a function body returns in every possible branch.
 * Returns true if every branch has a return statement, else returns false.
 * @param body The function body to be checked
 */
const hasReturnStatement = (body) => {
    if (!(0, exports.isBlockStatement)(body))
        return (0, exports.isReturnStatement)(body);
    for (const statement of body.body) {
        if ((0, exports.isReturnStatement)(statement)) {
            return true;
        }
        if ((0, exports.isIfStatement)(statement)) {
            const consequent = (0, exports.hasReturnStatement)(statement.consequent);
            if (!consequent) {
                return false;
            }
            if (statement.alternate) {
                return (0, exports.hasReturnStatement)(statement.alternate);
            }
        }
    }
    return false;
};
exports.hasReturnStatement = hasReturnStatement;
const hasBreakStatement = (block) => {
    let hasBreak = false;
    for (const statement of block.body) {
        if (statement.type === 'BreakStatement') {
            hasBreak = true;
        }
        else if (statement.type === 'IfStatement') {
            // Parser enforces that if/else have braces (block statement)
            hasBreak = hasBreak || (0, exports.hasBreakStatement)(statement.consequent);
            if (statement.alternate) {
                hasBreak = hasBreak || (0, exports.hasBreakStatement)(statement.alternate);
            }
        }
    }
    return hasBreak;
};
exports.hasBreakStatement = hasBreakStatement;
const hasContinueStatement = (block) => {
    let hasContinue = false;
    for (const statement of block.body) {
        if (statement.type === 'ContinueStatement') {
            hasContinue = true;
        }
        else if (statement.type === 'IfStatement') {
            // Parser enforces that if/else have braces (block statement)
            hasContinue = hasContinue || (0, exports.hasContinueStatement)(statement.consequent);
            if (statement.alternate) {
                hasContinue = hasContinue || (0, exports.hasContinueStatement)(statement.alternate);
            }
        }
    }
    return hasContinue;
};
exports.hasContinueStatement = hasContinueStatement;
//# sourceMappingURL=utils.js.map