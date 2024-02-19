"use strict";
/**
 * This interpreter implements an explicit-control evaluator.
 *
 * Heavily adapted from https://github.com/source-academy/JSpike/
 * and the legacy interpreter at '../interpreter/interpreter'
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ECEResultPromise = exports.resumeEvaluate = exports.evaluate = exports.Stash = exports.Agenda = void 0;
const lodash_1 = require("lodash");
const constants_1 = require("../constants");
const errors = require("../errors/errors");
const runtimeSourceError_1 = require("../errors/runtimeSourceError");
const closure_1 = require("../interpreter/closure");
const errors_1 = require("../modules/errors");
const moduleLoader_1 = require("../modules/moduleLoader");
const inspector_1 = require("../stdlib/inspector");
const assert_1 = require("../utils/assert");
const helpers_1 = require("../utils/ast/helpers");
const ast = require("../utils/astCreator");
const operators_1 = require("../utils/operators");
const rttc = require("../utils/rttc");
const instr = require("./instrCreator");
const types_1 = require("./types");
const utils_1 = require("./utils");
/**
 * The agenda is a list of commands that still needs to be executed by the machine.
 * It contains syntax tree nodes or instructions.
 */
class Agenda extends utils_1.Stack {
    constructor(program) {
        super();
        // Load program into agenda stack
        this.push(program);
    }
    push(...items) {
        const itemsNew = Agenda.simplifyBlocksWithoutDeclarations(...items);
        super.push(...itemsNew);
    }
    /**
     * Before pushing block statements on the agenda, we check if the block statement has any declarations.
     * If not, instead of pushing the entire block, just the body is pushed since the block is not adding any value.
     * @param items The items being pushed on the agenda.
     * @returns The same set of agenda items, but with block statements without declarations simplified.
     */
    static simplifyBlocksWithoutDeclarations(...items) {
        const itemsNew = [];
        items.forEach(item => {
            if ((0, utils_1.isNode)(item) && (0, utils_1.isBlockStatement)(item) && !(0, utils_1.hasDeclarations)(item)) {
                itemsNew.push(...Agenda.simplifyBlocksWithoutDeclarations(...(0, utils_1.handleSequence)(item.body)));
            }
            else {
                itemsNew.push(item);
            }
        });
        return itemsNew;
    }
}
exports.Agenda = Agenda;
/**
 * The stash is a list of values that stores intermediate results.
 */
class Stash extends utils_1.Stack {
    constructor() {
        super();
    }
}
exports.Stash = Stash;
/**
 * Function to be called when a program is to be interpreted using
 * the explicit control evaluator.
 *
 * @param program The program to evaluate.
 * @param context The context to evaluate the program in.
 * @returns The result of running the ECE machine.
 */
function evaluate(program, context, options) {
    try {
        context.runtime.isRunning = true;
        context.runtime.agenda = new Agenda(program);
        context.runtime.stash = new Stash();
        return runECEMachine(context, context.runtime.agenda, context.runtime.stash, options.envSteps, options.stepLimit, options.isPrelude);
    }
    catch (error) {
        return new types_1.ECError(error);
    }
    finally {
        context.runtime.isRunning = false;
    }
}
exports.evaluate = evaluate;
/**
 * Function that is called when a user wishes to resume evaluation after
 * hitting a breakpoint.
 * This should only be called after the first 'evaluate' function has been called so that
 * context.runtime.agenda and context.runtime.stash are defined.
 * @param context The context to continue evaluating the program in.
 * @returns The result of running the ECE machine.
 */
function resumeEvaluate(context) {
    try {
        context.runtime.isRunning = true;
        return runECEMachine(context, context.runtime.agenda, context.runtime.stash, -1, -1);
    }
    catch (error) {
        return new types_1.ECError(error);
    }
    finally {
        context.runtime.isRunning = false;
    }
}
exports.resumeEvaluate = resumeEvaluate;
function evaluateImports(program, context, { loadTabs, checkImports }) {
    try {
        const [importNodeMap] = (0, helpers_1.filterImportDeclarations)(program);
        const environment = (0, utils_1.currentEnvironment)(context);
        Object.entries(importNodeMap).forEach(([moduleName, nodes]) => {
            (0, moduleLoader_1.initModuleContext)(moduleName, context, loadTabs);
            const functions = (0, moduleLoader_1.loadModuleBundle)(moduleName, context, nodes[0]);
            for (const node of nodes) {
                for (const spec of node.specifiers) {
                    (0, assert_1.default)(spec.type === 'ImportSpecifier', `Only ImportSpecifiers are supported, got: ${spec.type}`);
                    if (checkImports && !(spec.imported.name in functions)) {
                        throw new errors_1.UndefinedImportError(spec.imported.name, moduleName, spec);
                    }
                    (0, utils_1.declareIdentifier)(context, spec.local.name, node, environment);
                    (0, utils_1.defineVariable)(context, spec.local.name, functions[spec.imported.name], true, node);
                }
            }
        });
    }
    catch (error) {
        (0, utils_1.handleRuntimeError)(context, error);
    }
}
/**
 * Function that returns the appropriate Promise<Result> given the output of ec evaluating, depending
 * on whether the program is finished evaluating, ran into a breakpoint or ran into an error.
 * @param context The context of the program.
 * @param value The value of ec evaluating the program.
 * @returns The corresponding promise.
 */
function ECEResultPromise(context, value) {
    return new Promise((resolve, reject) => {
        if (value instanceof types_1.ECEBreak) {
            resolve({ status: 'suspended-ec-eval', context });
        }
        else if (value instanceof types_1.ECError) {
            resolve({ status: 'error' });
        }
        else {
            resolve({ status: 'finished', context, value });
        }
    });
}
exports.ECEResultPromise = ECEResultPromise;
/**
 * The primary runner/loop of the explicit control evaluator.
 *
 * @param context The context to evaluate the program in.
 * @param agenda Points to the current context.runtime.agenda
 * @param stash Points to the current context.runtime.stash
 * @param isPrelude Whether the program we are running is the prelude
 * @returns A special break object if the program is interrupted by a breakpoint;
 * else the top value of the stash. It is usually the return value of the program.
 */
function runECEMachine(context, agenda, stash, envSteps, stepLimit, isPrelude = false) {
    context.runtime.break = false;
    context.runtime.nodes = [];
    let steps = 1;
    let command = agenda.peek();
    // First node will be a Program
    context.runtime.nodes.unshift(command);
    while (command) {
        // Return to capture a snapshot of the agenda and stash after the target step count is reached
        if (!isPrelude && steps === envSteps) {
            return stash.peek();
        }
        // Step limit reached, stop further evaluation
        if (!isPrelude && steps === stepLimit) {
            break;
        }
        if ((0, utils_1.isNode)(command) && command.type === 'DebuggerStatement') {
            // steps += 1
            // Record debugger step if running for the first time
            if (envSteps === -1) {
                context.runtime.breakpointSteps.push(steps);
            }
        }
        agenda.pop();
        if ((0, utils_1.isNode)(command)) {
            context.runtime.nodes.shift();
            context.runtime.nodes.unshift(command);
            (0, inspector_1.checkEditorBreakpoints)(context, command);
            cmdEvaluators[command.type](command, context, agenda, stash, isPrelude);
            if (context.runtime.break && context.runtime.debuggerOn) {
                // We can put this under isNode since context.runtime.break
                // will only be updated after a debugger statement and so we will
                // run into a node immediately after.
                // With the new evaluator, we don't return a break
                // return new ECEBreak()
            }
        }
        else {
            // Command is an instrucion
            cmdEvaluators[command.instrType](command, context, agenda, stash, isPrelude);
        }
        // Push undefined into the stack if both agenda and stash is empty
        if (agenda.isEmpty() && stash.isEmpty()) {
            stash.push(undefined);
        }
        command = agenda.peek();
        steps += 1;
    }
    if (!isPrelude) {
        context.runtime.envStepsTotal = steps;
    }
    return stash.peek();
}
/**
 * Dictionary of functions which handle the logic for the response of the three registers of
 * the ASE machine to each AgendaItem.
 */
const cmdEvaluators = {
    /**
     * Statements
     */
    Program: function (command, context, agenda, stash, isPrelude) {
        // Create and push the environment only if it is non empty.
        if ((0, utils_1.hasDeclarations)(command) || (0, utils_1.hasImportDeclarations)(command)) {
            const environment = (0, utils_1.createBlockEnvironment)(context, 'programEnvironment');
            (0, utils_1.pushEnvironment)(context, environment);
            evaluateImports(command, context, {
                wrapSourceModules: true,
                checkImports: true,
                loadTabs: true
            });
            (0, utils_1.declareFunctionsAndVariables)(context, command, environment);
        }
        if (command.body.length == 1) {
            // If program only consists of one statement, evaluate it immediately
            const next = command.body[0];
            cmdEvaluators[next.type](next, context, agenda, stash, isPrelude);
        }
        else {
            // Push block body
            agenda.push(...(0, utils_1.handleSequence)(command.body));
        }
    },
    BlockStatement: function (command, context, agenda) {
        // To restore environment after block ends
        // If there is an env instruction on top of the stack, or if there are no declarations, or there is no next agenda item
        // we do not need to push another one
        // The no declarations case is handled by Agenda :: simplifyBlocksWithoutDeclarations, so no blockStatement node
        // without declarations should end up here.
        const next = agenda.peek();
        // Push ENVIRONMENT instruction if needed
        if (next && !((0, utils_1.isInstr)(next) && next.instrType === types_1.InstrType.ENVIRONMENT)) {
            agenda.push(instr.envInstr((0, utils_1.currentEnvironment)(context), command));
        }
        const environment = (0, utils_1.createBlockEnvironment)(context, 'blockEnvironment');
        (0, utils_1.declareFunctionsAndVariables)(context, command, environment);
        (0, utils_1.pushEnvironment)(context, environment);
        // Push block body
        agenda.push(...(0, utils_1.handleSequence)(command.body));
    },
    WhileStatement: function (command, context, agenda, stash) {
        if ((0, utils_1.hasBreakStatement)(command.body)) {
            agenda.push(instr.breakMarkerInstr(command));
        }
        agenda.push(instr.whileInstr(command.test, command.body, command));
        agenda.push(command.test);
        agenda.push(ast.identifier('undefined', command.loc)); // Return undefined if there is no loop execution
    },
    ForStatement: function (command, context, agenda) {
        // All 3 parts will be defined due to parser rules
        const init = command.init;
        const test = command.test;
        const update = command.update;
        // Loop control variable present
        // Refer to Source §3 specifications https://docs.sourceacademy.org/source_3.pdf
        if (init.type === 'VariableDeclaration' && init.kind === 'let') {
            const id = init.declarations[0].id;
            const valueExpression = init.declarations[0].init;
            agenda.push(ast.blockStatement([
                init,
                ast.forStatement(ast.assignmentExpression(id, valueExpression, command.loc), test, update, ast.blockStatement([
                    ast.variableDeclaration([
                        ast.variableDeclarator(ast.identifier(`_copy_of_${id.name}`, command.loc), ast.identifier(id.name, command.loc), command.loc)
                    ], command.loc),
                    ast.blockStatement([
                        ast.variableDeclaration([
                            ast.variableDeclarator(ast.identifier(id.name, command.loc), ast.identifier(`_copy_of_${id.name}`, command.loc), command.loc)
                        ], command.loc),
                        command.body
                    ], command.loc)
                ], command.loc), command.loc)
            ], command.loc));
        }
        else {
            if ((0, utils_1.hasBreakStatement)(command.body)) {
                agenda.push(instr.breakMarkerInstr(command));
            }
            agenda.push(instr.forInstr(init, test, update, command.body, command));
            agenda.push(test);
            agenda.push(instr.popInstr(command)); // Pop value from init assignment
            agenda.push(init);
            agenda.push(ast.identifier('undefined', command.loc)); // Return undefined if there is no loop execution
        }
    },
    IfStatement: function (command, context, agenda, stash) {
        agenda.push(...(0, utils_1.reduceConditional)(command));
    },
    ExpressionStatement: function (command, context, agenda, stash, isPrelude) {
        // Fast forward to the expression
        // If not the next step will look like it's only removing ';'
        cmdEvaluators[command.expression.type](command.expression, context, agenda, stash, isPrelude);
    },
    DebuggerStatement: function (command, context) {
        context.runtime.break = true;
    },
    VariableDeclaration: function (command, context, agenda) {
        const declaration = command.declarations[0];
        const id = declaration.id;
        // Parser enforces initialisation during variable declaration
        const init = declaration.init;
        agenda.push(instr.popInstr(command));
        agenda.push(instr.assmtInstr(id.name, command.kind === 'const', true, command));
        agenda.push(init);
    },
    FunctionDeclaration: function (command, context, agenda) {
        // Function declaration desugared into constant declaration.
        const lambdaExpression = ast.blockArrowFunction(command.params, command.body, command.loc);
        const lambdaDeclaration = ast.constantDeclaration(command.id.name, lambdaExpression, command.loc);
        agenda.push(lambdaDeclaration);
    },
    ReturnStatement: function (command, context, agenda) {
        // Push return argument onto agenda as well as Reset Instruction to clear to ignore all statements after the return.
        const next = agenda.peek();
        if (next && (0, utils_1.isInstr)(next) && next.instrType === types_1.InstrType.MARKER) {
            agenda.pop();
        }
        else {
            agenda.push(instr.resetInstr(command));
        }
        if (command.argument) {
            agenda.push(command.argument);
        }
    },
    ContinueStatement: function (command, context, agenda, stash) {
        agenda.push(instr.contInstr(command));
    },
    BreakStatement: function (command, context, agenda, stash) {
        agenda.push(instr.breakInstr(command));
    },
    ImportDeclaration: function () { },
    /**
     * Expressions
     */
    Literal: function (command, context, agenda, stash) {
        stash.push(command.value);
    },
    AssignmentExpression: function (command, context, agenda) {
        if (command.left.type === 'MemberExpression') {
            agenda.push(instr.arrAssmtInstr(command));
            agenda.push(command.right);
            agenda.push(command.left.property);
            agenda.push(command.left.object);
        }
        else if (command.left.type === 'Identifier') {
            const id = command.left;
            agenda.push(instr.assmtInstr(id.name, false, false, command));
            agenda.push(command.right);
        }
    },
    ArrayExpression: function (command, context, agenda) {
        const elems = command.elements;
        const len = elems.length;
        agenda.push(instr.arrLitInstr(len, command));
        for (const elem of elems) {
            agenda.push(elem);
        }
    },
    MemberExpression: function (command, context, agenda, stash) {
        agenda.push(instr.arrAccInstr(command));
        agenda.push(command.property);
        agenda.push(command.object);
    },
    ConditionalExpression: function (command, context, agenda, stash) {
        agenda.push(...(0, utils_1.reduceConditional)(command));
    },
    Identifier: function (command, context, agenda, stash) {
        stash.push((0, utils_1.getVariable)(context, command.name, command));
    },
    UnaryExpression: function (command, context, agenda) {
        agenda.push(instr.unOpInstr(command.operator, command));
        agenda.push(command.argument);
    },
    BinaryExpression: function (command, context, agenda) {
        agenda.push(instr.binOpInstr(command.operator, command));
        agenda.push(command.right);
        agenda.push(command.left);
    },
    LogicalExpression: function (command, context, agenda) {
        if (command.operator === '&&') {
            agenda.push(ast.conditionalExpression(command.left, command.right, ast.literal(false), command.loc));
        }
        else {
            agenda.push(ast.conditionalExpression(command.left, ast.literal(true), command.right, command.loc));
        }
    },
    ArrowFunctionExpression: function (command, context, agenda, stash, isPrelude) {
        // Reuses the Closure data structure from legacy interpreter
        const closure = closure_1.default.makeFromArrowFunction(command, (0, utils_1.currentEnvironment)(context), context, true, isPrelude);
        const next = agenda.peek();
        if (!(next && (0, utils_1.isInstr)(next) && (0, utils_1.isAssmtInstr)(next))) {
            Object.defineProperty((0, utils_1.currentEnvironment)(context).head, (0, lodash_1.uniqueId)(), {
                value: closure,
                writable: false,
                enumerable: true
            });
        }
        stash.push(closure);
    },
    CallExpression: function (command, context, agenda) {
        // Push application instruction, function arguments and function onto agenda.
        agenda.push(instr.appInstr(command.arguments.length, command));
        for (let index = command.arguments.length - 1; index >= 0; index--) {
            agenda.push(command.arguments[index]);
        }
        agenda.push(command.callee);
    },
    /**
     * Instructions
     */
    [types_1.InstrType.RESET]: function (command, context, agenda, stash) {
        // Keep pushing reset instructions until marker is found.
        const cmdNext = agenda.pop();
        if (cmdNext && ((0, utils_1.isNode)(cmdNext) || cmdNext.instrType !== types_1.InstrType.MARKER)) {
            agenda.push(instr.resetInstr(command.srcNode));
        }
    },
    [types_1.InstrType.WHILE]: function (command, context, agenda, stash) {
        const test = stash.pop();
        // Check if test condition is a boolean
        const error = rttc.checkIfStatement(command.srcNode, test, context.chapter);
        if (error) {
            (0, utils_1.handleRuntimeError)(context, error);
        }
        if (test) {
            agenda.push(command);
            agenda.push(command.test);
            if ((0, utils_1.hasContinueStatement)(command.body)) {
                agenda.push(instr.contMarkerInstr(command.srcNode));
            }
            if (!(0, utils_1.valueProducing)(command.body)) {
                // if loop body is not value-producing, insert undefined expression statement
                agenda.push(ast.identifier('undefined', command.body.loc));
            }
            agenda.push(command.body);
            agenda.push(instr.popInstr(command.srcNode)); // Pop previous body value
        }
    },
    [types_1.InstrType.FOR]: function (command, context, agenda, stash) {
        const test = stash.pop();
        // Check if test condition is a boolean
        const error = rttc.checkIfStatement(command.srcNode, test, context.chapter);
        if (error) {
            (0, utils_1.handleRuntimeError)(context, error);
        }
        if (test) {
            agenda.push(command);
            agenda.push(command.test);
            agenda.push(instr.popInstr(command.srcNode)); // Pop value from update
            agenda.push(command.update);
            if ((0, utils_1.hasContinueStatement)(command.body)) {
                agenda.push(instr.contMarkerInstr(command.srcNode));
            }
            if (!(0, utils_1.valueProducing)(command.body)) {
                // if loop body is not value-producing, insert undefined expression statement
                agenda.push(ast.identifier('undefined', command.body.loc));
            }
            agenda.push(command.body);
            agenda.push(instr.popInstr(command.srcNode)); // Pop previous body value
        }
    },
    [types_1.InstrType.ASSIGNMENT]: function (command, context, agenda, stash) {
        command.declaration
            ? (0, utils_1.defineVariable)(context, command.symbol, stash.peek(), command.constant, command.srcNode)
            : (0, utils_1.setVariable)(context, command.symbol, stash.peek(), command.srcNode);
    },
    [types_1.InstrType.UNARY_OP]: function (command, context, agenda, stash) {
        const argument = stash.pop();
        const error = rttc.checkUnaryExpression(command.srcNode, command.symbol, argument, context.chapter);
        if (error) {
            (0, utils_1.handleRuntimeError)(context, error);
        }
        stash.push((0, operators_1.evaluateUnaryExpression)(command.symbol, argument));
    },
    [types_1.InstrType.BINARY_OP]: function (command, context, agenda, stash) {
        const right = stash.pop();
        const left = stash.pop();
        const error = rttc.checkBinaryExpression(command.srcNode, command.symbol, context.chapter, left, right);
        if (error) {
            (0, utils_1.handleRuntimeError)(context, error);
        }
        stash.push((0, operators_1.evaluateBinaryExpression)(command.symbol, left, right));
    },
    [types_1.InstrType.POP]: function (command, context, agenda, stash) {
        stash.pop();
    },
    [types_1.InstrType.APPLICATION]: function (command, context, agenda, stash) {
        var _a, _b;
        (0, utils_1.checkStackOverFlow)(context, agenda);
        // Get function arguments from the stash
        const args = [];
        for (let index = 0; index < command.numOfArgs; index++) {
            args.unshift(stash.pop());
        }
        // Get function from the stash
        const func = stash.pop();
        if (func instanceof closure_1.default) {
            // Check for number of arguments mismatch error
            (0, utils_1.checkNumberOfArguments)(context, func, args, command.srcNode);
            // Display the pre-defined functions on the global environment if needed.
            if (func.preDefined) {
                Object.defineProperty(context.runtime.environments[1].head, (0, lodash_1.uniqueId)(), {
                    value: func,
                    writable: false,
                    enumerable: true
                });
            }
            const next = agenda.peek();
            // Push ENVIRONMENT instruction if needed
            if (next &&
                !((0, utils_1.isInstr)(next) && next.instrType === types_1.InstrType.ENVIRONMENT) &&
                agenda.some(utils_1.isNode)) {
                agenda.push(instr.envInstr((0, utils_1.currentEnvironment)(context), command.srcNode));
            }
            // Create environment for function parameters if the function isn't nullary.
            // Name the environment if the function call expression is not anonymous
            if (args.length > 0) {
                const environment = (0, utils_1.createEnvironment)(func, args, command.srcNode);
                (0, utils_1.pushEnvironment)(context, environment);
            }
            else {
                context.runtime.environments.unshift(func.environment);
            }
            // Handle special case if function is simple
            if ((0, utils_1.isSimpleFunction)(func.node)) {
                // Closures convert ArrowExpressionStatements to BlockStatements
                const block = func.node.body;
                const returnStatement = block.body[0];
                agenda.push((_a = returnStatement.argument) !== null && _a !== void 0 ? _a : ast.identifier('undefined', returnStatement.loc));
            }
            else {
                if (agenda.peek()) {
                    // push marker if agenda not empty
                    agenda.push(instr.markerInstr(command.srcNode));
                }
                agenda.push(func.node.body);
            }
        }
        else if (typeof func === 'function') {
            // Check for number of arguments mismatch error
            (0, utils_1.checkNumberOfArguments)(context, func, args, command.srcNode);
            // Directly stash result of applying pre-built functions without the ASE machine.
            try {
                const result = func(...args);
                stash.push(result);
            }
            catch (error) {
                if (!(error instanceof runtimeSourceError_1.RuntimeSourceError || error instanceof errors.ExceptionError)) {
                    // The error could've arisen when the builtin called a source function which errored.
                    // If the cause was a source error, we don't want to include the error.
                    // However if the error came from the builtin itself, we need to handle it.
                    const loc = (_b = command.srcNode.loc) !== null && _b !== void 0 ? _b : constants_1.UNKNOWN_LOCATION;
                    (0, utils_1.handleRuntimeError)(context, new errors.ExceptionError(error, loc));
                }
            }
        }
        else {
            (0, utils_1.handleRuntimeError)(context, new errors.CallingNonFunctionValue(func, command.srcNode));
        }
    },
    [types_1.InstrType.BRANCH]: function (command, context, agenda, stash) {
        const test = stash.pop();
        // Check if test condition is a boolean
        const error = rttc.checkIfStatement(command.srcNode, test, context.chapter);
        if (error) {
            (0, utils_1.handleRuntimeError)(context, error);
        }
        if (test) {
            if (!(0, utils_1.valueProducing)(command.consequent)) {
                agenda.push(ast.identifier('undefined', command.consequent.loc));
            }
            agenda.push(command.consequent);
        }
        else if (command.alternate) {
            if (!(0, utils_1.valueProducing)(command.alternate)) {
                agenda.push(ast.identifier('undefined', command.consequent.loc));
            }
            agenda.push(command.alternate);
        }
        else {
            agenda.push(ast.identifier('undefined', command.srcNode.loc));
        }
    },
    [types_1.InstrType.ENVIRONMENT]: function (command, context) {
        // Restore environment
        while ((0, utils_1.currentEnvironment)(context).id !== command.env.id) {
            (0, utils_1.popEnvironment)(context);
        }
    },
    [types_1.InstrType.ARRAY_LITERAL]: function (command, context, agenda, stash) {
        const arity = command.arity;
        const array = [];
        for (let i = 0; i < arity; ++i) {
            array.push(stash.pop());
        }
        stash.push(array);
    },
    [types_1.InstrType.ARRAY_ACCESS]: function (command, context, agenda, stash) {
        const index = stash.pop();
        const array = stash.pop();
        stash.push(array[index]);
    },
    [types_1.InstrType.ARRAY_ASSIGNMENT]: function (command, context, agenda, stash) {
        const value = stash.pop();
        const index = stash.pop();
        const array = stash.pop();
        array[index] = value;
        stash.push(value);
    },
    [types_1.InstrType.CONTINUE]: function (command, context, agenda, stash) {
        const next = agenda.pop();
        if ((0, utils_1.isInstr)(next) && next.instrType == types_1.InstrType.CONTINUE_MARKER) {
            // Encountered continue mark, stop popping
        }
        else if ((0, utils_1.isInstr)(next) && next.instrType == types_1.InstrType.ENVIRONMENT) {
            agenda.push(command);
            agenda.push(next); // Let instruction evaluate to restore env
        }
        else {
            // Continue popping from agenda by pushing same instruction on agenda
            agenda.push(command);
        }
    },
    [types_1.InstrType.CONTINUE_MARKER]: function () { },
    [types_1.InstrType.BREAK]: function (command, context, agenda, stash) {
        const next = agenda.pop();
        if ((0, utils_1.isInstr)(next) && next.instrType == types_1.InstrType.BREAK_MARKER) {
            // Encountered break mark, stop popping
        }
        else if ((0, utils_1.isInstr)(next) && next.instrType == types_1.InstrType.ENVIRONMENT) {
            agenda.push(command);
            agenda.push(next); // Let instruction evaluate to restore env
        }
        else {
            // Continue popping from agenda by pushing same instruction on agenda
            agenda.push(command);
        }
    },
    [types_1.InstrType.BREAK_MARKER]: function () { }
};
//# sourceMappingURL=interpreter.js.map