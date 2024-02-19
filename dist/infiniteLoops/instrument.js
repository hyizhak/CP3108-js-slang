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
exports.InfiniteLoopRuntimeObjectNames = exports.InfiniteLoopRuntimeFunctions = exports.instrument = exports.getOriginalName = void 0;
const astring_1 = require("astring");
const transpiler_1 = require("../transpiler/transpiler");
const create = require("../utils/astCreator");
const walkers_1 = require("../utils/walkers");
// transforms AST of program
const globalIds = {
    builtinsId: 'builtins',
    functionsId: '__InfLoopFns',
    stateId: '__InfLoopState'
};
exports.InfiniteLoopRuntimeObjectNames = globalIds;
var FunctionNames;
(function (FunctionNames) {
    FunctionNames[FunctionNames["nothingFunction"] = 0] = "nothingFunction";
    FunctionNames[FunctionNames["concretize"] = 1] = "concretize";
    FunctionNames[FunctionNames["hybridize"] = 2] = "hybridize";
    FunctionNames[FunctionNames["wrapArg"] = 3] = "wrapArg";
    FunctionNames[FunctionNames["dummify"] = 4] = "dummify";
    FunctionNames[FunctionNames["saveBool"] = 5] = "saveBool";
    FunctionNames[FunctionNames["saveVar"] = 6] = "saveVar";
    FunctionNames[FunctionNames["preFunction"] = 7] = "preFunction";
    FunctionNames[FunctionNames["returnFunction"] = 8] = "returnFunction";
    FunctionNames[FunctionNames["postLoop"] = 9] = "postLoop";
    FunctionNames[FunctionNames["enterLoop"] = 10] = "enterLoop";
    FunctionNames[FunctionNames["exitLoop"] = 11] = "exitLoop";
    FunctionNames[FunctionNames["trackLoc"] = 12] = "trackLoc";
    FunctionNames[FunctionNames["evalB"] = 13] = "evalB";
    FunctionNames[FunctionNames["evalU"] = 14] = "evalU";
})(FunctionNames || (FunctionNames = {}));
exports.InfiniteLoopRuntimeFunctions = FunctionNames;
/**
 * Renames all variables in the program to differentiate shadowed variables and
 * variables declared with the same name but in different scopes.
 *
 * E.g. "function f(f)..." -> "function f_0(f_1)..."
 * @param predefined A table of [key: string, value:string], where variables named 'key' will be renamed to 'value'
 */
function unshadowVariables(program, predefined = {}) {
    for (const name of Object.values(globalIds)) {
        predefined[name] = name;
    }
    const seenIds = new Set();
    const env = [predefined];
    const genId = (name) => {
        let count = 0;
        while (seenIds.has(`${name}_${count}`))
            count++;
        const newName = `${name}_${count}`;
        seenIds.add(newName);
        env[0][name] = newName;
        return newName;
    };
    const unshadowFunctionInner = (node, s, callback) => {
        env.unshift(Object.assign({}, env[0]));
        for (const id of node.params) {
            id.name = genId(id.name);
        }
        callback(node.body, undefined);
        env.shift();
    };
    const doStatements = (stmts, callback) => {
        for (const stmt of stmts) {
            if (stmt.type === 'FunctionDeclaration') {
                // do hoisting first
                if (stmt.id === null) {
                    throw new Error('Encountered a FunctionDeclaration node without an identifier. This should have been caught when parsing.');
                }
                stmt.id.name = genId(stmt.id.name);
            }
            else if (stmt.type === 'VariableDeclaration') {
                for (const decl of stmt.declarations) {
                    decl.id = decl.id;
                    const newName = genId(decl.id.name);
                    decl.id.name = newName;
                }
            }
        }
        for (const stmt of stmts) {
            callback(stmt, undefined);
        }
    };
    (0, walkers_1.recursive)(program, [{}], {
        BlockStatement(node, s, callback) {
            env.unshift(Object.assign({}, env[0]));
            doStatements(node.body, callback);
            env.shift();
        },
        VariableDeclarator(node, s, callback) {
            node.id = node.id;
            if (node.init) {
                callback(node.init, s);
            }
        },
        FunctionDeclaration(node, s, callback) {
            // note: params can shadow function name
            env.unshift(Object.assign({}, env[0]));
            for (const id of node.params) {
                id.name = genId(id.name);
            }
            callback(node.body, undefined);
            env.shift();
        },
        ForStatement(node, s, callback) {
            var _a;
            env.unshift(Object.assign({}, env[0]));
            if (((_a = node.init) === null || _a === void 0 ? void 0 : _a.type) === 'VariableDeclaration')
                doStatements([node.init], callback);
            if (node.test)
                callback(node.test, s);
            if (node.update)
                callback(node.update, s);
            callback(node.body, s);
            env.shift();
        },
        ArrowFunctionExpression: unshadowFunctionInner,
        FunctionExpression: unshadowFunctionInner,
        Identifier(node, _s, _callback) {
            if (env[0][node.name]) {
                node.name = env[0][node.name];
            }
            else {
                create.mutateToMemberExpression(node, create.identifier(globalIds.functionsId), create.literal(FunctionNames.nothingFunction));
                node.computed = true;
            }
        },
        AssignmentExpression(node, s, callback) {
            callback(node.left, s);
            callback(node.right, s);
        },
        TryStatement(node, s, callback) {
            if (!node.finalizer)
                return; // should not happen
            env.unshift(Object.assign({}, env[0]));
            doStatements(node.block.body, callback);
            doStatements(node.finalizer.body, callback);
            env.shift();
        }
    });
}
/**
 * Returns the original name of the variable before
 * it was changed during the code instrumentation process.
 */
function getOriginalName(name) {
    if (/^anon[0-9]+$/.exec(name)) {
        return '(anonymous)';
    }
    let cutAt = name.length - 1;
    while (name.charAt(cutAt) !== '_') {
        cutAt--;
        if (cutAt < 0)
            return '(error)';
    }
    return name.slice(0, cutAt);
}
exports.getOriginalName = getOriginalName;
function callFunction(fun) {
    return create.memberExpression(create.identifier(globalIds.functionsId), fun);
}
/**
 * Wrap each argument in every call expression.
 *
 * E.g. "f(x,y)" -> "f(wrap(x), wrap(y))".
 * Ensures we do not test functions passed as arguments
 * for infinite loops.
 */
function wrapCallArguments(program) {
    (0, walkers_1.simple)(program, {
        CallExpression(node) {
            if (node.callee.type === 'MemberExpression')
                return;
            for (const arg of node.arguments) {
                create.mutateToCallExpression(arg, callFunction(FunctionNames.wrapArg), [
                    Object.assign({}, arg),
                    create.identifier(globalIds.stateId)
                ]);
            }
        }
    });
}
/**
 * Turn all "is_null(x)" calls to "is_null(x, stateId)" to
 * facilitate checking of infinite streams in stream mode.
 */
function addStateToIsNull(program) {
    (0, walkers_1.simple)(program, {
        CallExpression(node) {
            if (node.callee.type === 'Identifier' && node.callee.name === 'is_null_0') {
                node.arguments.push(create.identifier(globalIds.stateId));
            }
        }
    });
}
/**
 * Changes logical expressions to the corresponding conditional.
 * Reduces the number of types of expressions we have to consider
 * for the rest of the code transformations.
 *
 * E.g. "x && y" -> "x ? y : false"
 */
function transformLogicalExpressions(program) {
    (0, walkers_1.simple)(program, {
        LogicalExpression(node) {
            if (node.operator === '&&') {
                create.mutateToConditionalExpression(node, node.left, node.right, create.literal(false));
            }
            else {
                create.mutateToConditionalExpression(node, node.left, create.literal(true), node.right);
            }
        }
    });
}
/**
 * Changes -ary operations to functions that accept hybrid values as arguments.
 * E.g. "1+1" -> "functions.evalB('+',1,1)"
 */
function hybridizeBinaryUnaryOperations(program) {
    (0, walkers_1.simple)(program, {
        BinaryExpression(node) {
            const { operator, left, right } = node;
            create.mutateToCallExpression(node, callFunction(FunctionNames.evalB), [
                create.literal(operator),
                left,
                right
            ]);
        },
        UnaryExpression(node) {
            const { operator, argument } = node;
            create.mutateToCallExpression(node, callFunction(FunctionNames.evalU), [
                create.literal(operator),
                argument
            ]);
        }
    });
}
function hybridizeVariablesAndLiterals(program) {
    (0, walkers_1.recursive)(program, true, {
        Identifier(node, state, _callback) {
            if (state) {
                create.mutateToCallExpression(node, callFunction(FunctionNames.hybridize), [
                    create.identifier(node.name),
                    create.literal(node.name),
                    create.identifier(globalIds.stateId)
                ]);
            }
        },
        Literal(node, state, _callback) {
            if (state && (typeof node.value === 'boolean' || typeof node.value === 'number')) {
                create.mutateToCallExpression(node, callFunction(FunctionNames.dummify), [
                    create.literal(node.value)
                ]);
            }
        },
        CallExpression(node, state, callback) {
            // ignore callee
            for (const arg of node.arguments) {
                callback(arg, state);
            }
        },
        MemberExpression(node, state, callback) {
            if (!node.computed)
                return;
            callback(node.object, false);
            callback(node.property, false);
            create.mutateToCallExpression(node.object, callFunction(FunctionNames.concretize), [
                Object.assign({}, node.object)
            ]);
            create.mutateToCallExpression(node.property, callFunction(FunctionNames.concretize), [
                Object.assign({}, node.property)
            ]);
        }
    });
}
/**
 * Wraps the RHS of variable assignment with a function to track it.
 * E.g. "x = x + 1;" -> "x = saveVar(x + 1, 'x', state)".
 * saveVar should return the result of "x + 1".
 *
 * For assignments to elements of arrays we concretize the RHS.
 * E.g. "a[1] = y;" -> "a[1] = concretize(y);"
 */
function trackVariableAssignment(program) {
    (0, walkers_1.simple)(program, {
        AssignmentExpression(node) {
            if (node.left.type === 'Identifier') {
                node.right = create.callExpression(callFunction(FunctionNames.saveVar), [
                    node.right,
                    create.literal(node.left.name),
                    create.identifier(globalIds.stateId)
                ]);
            }
            else if (node.left.type === 'MemberExpression') {
                node.right = create.callExpression(callFunction(FunctionNames.concretize), [
                    Object.assign({}, node.right)
                ]);
            }
        }
    });
}
/**
 * Replaces the test of the node with a function to track the result in the state.
 *
 * E.g. "x===0 ? 1 : 0;" -> "saveBool(x === 0, state) ? 1 : 0;".
 * saveBool should return the result of "x === 0"
 */
function saveTheTest(node) {
    if (node.test === null || node.test === undefined) {
        return;
    }
    const newTest = create.callExpression(callFunction(FunctionNames.saveBool), [
        node.test,
        create.identifier(globalIds.stateId)
    ]);
    node.test = newTest;
}
/**
 * Mutates a node in-place, turning it into a block statement.
 * @param node Node to mutate.
 * @param prepend Optional statement to prepend in the result.
 * @param append Optional statement to append in the result.
 */
function inPlaceEnclose(node, prepend, append) {
    const shallowCopy = Object.assign({}, node);
    node.type = 'BlockStatement';
    node = node;
    node.body = [shallowCopy];
    if (prepend !== undefined) {
        node.body.unshift(prepend);
    }
    if (append !== undefined) {
        node.body.push(append);
    }
}
/**
 * Add tracking to if statements and conditional expressions in the state using saveTheTest.
 */
function trackIfStatements(program) {
    const theFunction = (node) => saveTheTest(node);
    (0, walkers_1.simple)(program, { IfStatement: theFunction, ConditionalExpression: theFunction });
}
/**
 * Tracks loop iterations by adding saveTheTest, postLoop functions.
 * postLoop will be executed after the body (and the update if it is a for loop).
 * Also adds enter/exitLoop before/after the loop.
 *
 * E.g. "for(let i=0;i<10;i=i+1) {display(i);}"
 *      -> "enterLoop(state);
 *          for(let i=0;i<10; postLoop(state, i=i+1)) {display(i);};
 *          exitLoop(state);"
 * Where postLoop should return the value of its (optional) second argument.
 */
function trackLoops(program) {
    const makeCallStatement = (name, args) => create.expressionStatement(create.callExpression(callFunction(name), args));
    const stateExpr = create.identifier(globalIds.stateId);
    (0, walkers_1.simple)(program, {
        WhileStatement: (node) => {
            saveTheTest(node);
            inPlaceEnclose(node.body, undefined, makeCallStatement(FunctionNames.postLoop, [stateExpr]));
            inPlaceEnclose(node, makeCallStatement(FunctionNames.enterLoop, [stateExpr]), makeCallStatement(FunctionNames.exitLoop, [stateExpr]));
        },
        ForStatement: (node) => {
            saveTheTest(node);
            const theUpdate = node.update ? node.update : create.identifier('undefined');
            node.update = create.callExpression(callFunction(FunctionNames.postLoop), [
                stateExpr,
                theUpdate
            ]);
            inPlaceEnclose(node, makeCallStatement(FunctionNames.enterLoop, [stateExpr]), makeCallStatement(FunctionNames.exitLoop, [stateExpr]));
        }
    });
}
/**
 * Tracks function iterations by adding preFunction and returnFunction functions.
 * preFunction is prepended to every function body, and returnFunction is used to
 * wrap the argument of return statements.
 *
 * E.g. "function f(x) {return x;}"
 *      -> "function f(x) {
 *            preFunction('f',[x], state);
 *            return returnFunction(x, state);
 *         }"
 * where returnFunction should return its first argument 'x'.
 */
function trackFunctions(program) {
    const preFunction = (name, params) => {
        const args = params
            .filter(x => x.type === 'Identifier')
            .map(x => x.name)
            .map(x => create.arrayExpression([create.literal(x), create.identifier(x)]));
        return create.expressionStatement(create.callExpression(callFunction(FunctionNames.preFunction), [
            create.literal(name),
            create.arrayExpression(args),
            create.identifier(globalIds.stateId)
        ]));
    };
    let counter = 0;
    const anonFunction = (node) => {
        if (node.body.type !== 'BlockStatement') {
            create.mutateToReturnStatement(node.body, Object.assign({}, node.body));
        }
        inPlaceEnclose(node.body, preFunction(`anon${counter++}`, node.params));
    };
    (0, walkers_1.simple)(program, {
        ArrowFunctionExpression: anonFunction,
        FunctionExpression: anonFunction,
        FunctionDeclaration(node) {
            if (node.id === null) {
                throw new Error('Encountered a FunctionDeclaration node without an identifier. This should have been caught when parsing.');
            }
            const name = node.id.name;
            inPlaceEnclose(node.body, preFunction(name, node.params));
        }
    });
    (0, walkers_1.simple)(program, {
        ReturnStatement(node) {
            const hasNoArgs = node.argument === null || node.argument === undefined;
            const arg = hasNoArgs ? create.identifier('undefined') : node.argument;
            const argsForCall = [arg, create.identifier(globalIds.stateId)];
            node.argument = create.callExpression(callFunction(FunctionNames.returnFunction), argsForCall);
        }
    });
}
function builtinsToStmts(builtins) {
    const makeDecl = (name) => create.declaration(name, 'const', create.callExpression(create.memberExpression(create.identifier(globalIds.builtinsId), 'get'), [create.literal(name)]));
    return [...builtins].map(makeDecl);
}
/**
 * Make all variables in the 'try' block function-scoped so they
 * can be accessed in the 'finally' block
 */
function toVarDeclaration(stmt) {
    (0, walkers_1.simple)(stmt, {
        VariableDeclaration(node) {
            node.kind = 'var';
        }
    });
}
/**
 * There may have been other programs run in the REPL. This hack
 * 'combines' the other programs and the current program into a single
 * large program by enclosing the past programs in 'try' blocks, and the
 * current program in a 'finally' block. Any errors (including detected
 * infinite loops) in the past code will be ignored in the empty 'catch'
 * block.
 */
function wrapOldCode(current, toWrap) {
    for (const stmt of toWrap) {
        toVarDeclaration(stmt);
    }
    const tryStmt = {
        type: 'TryStatement',
        block: create.blockStatement([...toWrap]),
        handler: {
            type: 'CatchClause',
            param: create.identifier('e'),
            body: create.blockStatement([])
        },
        finalizer: create.blockStatement([...current.body])
    };
    current.body = [tryStmt];
}
function makePositions(position) {
    return create.objectExpression([
        create.property('line', create.literal(position.line)),
        create.property('column', create.literal(position.column))
    ]);
}
function savePositionAsExpression(loc) {
    if (loc !== undefined && loc !== null) {
        return create.objectExpression([
            create.property('start', makePositions(loc.start)),
            create.property('end', makePositions(loc.end))
        ]);
    }
    else {
        return create.identifier('undefined');
    }
}
/**
 * Wraps every callExpression and prepends every loop body
 * with a function that saves the callExpression/loop's SourceLocation
 * (line number etc) in the state. This location will be used in the
 * error given to the user.
 *
 * E.g. "f(x);" -> "trackLoc({position object}, state, ()=>f(x))".
 * where trackLoc should return the result of "(()=>f(x))();".
 */
function trackLocations(program) {
    // Note: only add locations for most recently entered code
    const trackerFn = callFunction(FunctionNames.trackLoc);
    const stateExpr = create.identifier(globalIds.stateId);
    const doLoops = (node, _state, _callback) => {
        inPlaceEnclose(node.body, create.expressionStatement(create.callExpression(trackerFn, [savePositionAsExpression(node.loc), stateExpr])));
    };
    (0, walkers_1.recursive)(program, undefined, {
        CallExpression(node, _state, _callback) {
            if (node.callee.type === 'MemberExpression')
                return;
            const copy = Object.assign({}, node);
            const lazyCall = create.arrowFunctionExpression([], copy);
            create.mutateToCallExpression(node, trackerFn, [
                savePositionAsExpression(node.loc),
                stateExpr,
                lazyCall
            ]);
        },
        ForStatement: doLoops,
        WhileStatement: doLoops
    });
}
function handleImports(programs) {
    return __awaiter(this, void 0, void 0, function* () {
        const transformed = yield Promise.all(programs.map((program) => __awaiter(this, void 0, void 0, function* () {
            const [prefixToAdd, importsToAdd, otherNodes] = yield (0, transpiler_1.transformImportDeclarations)(program, new Set(), {
                wrapSourceModules: false,
                checkImports: false,
                loadTabs: false
            });
            program.body = importsToAdd.concat(otherNodes);
            const importedNames = importsToAdd.flatMap(node => node.declarations.map(decl => decl.init.object.name));
            return [prefixToAdd, importedNames];
        })));
        const [prefixes, imports] = transformed.reduce(([prefixes, moduleNames], [prefix, importedNames]) => [
            [...prefixes, prefix],
            [...moduleNames, ...importedNames]
        ], [[], []]);
        return [prefixes.join('\n'), [...new Set(imports)]];
    });
}
/**
 * Instruments the given code with functions that track the state of the program.
 *
 * @param previous programs that were previously executed in the REPL, most recent first (at ix 0).
 * @param program most recent program executed.
 * @param builtins Names of builtin functions.
 * @returns code with instrumentations.
 */
function instrument(previous, program, builtins) {
    return __awaiter(this, void 0, void 0, function* () {
        const { builtinsId, functionsId, stateId } = globalIds;
        const predefined = {};
        predefined[builtinsId] = builtinsId;
        predefined[functionsId] = functionsId;
        predefined[stateId] = stateId;
        const innerProgram = Object.assign({}, program);
        const [prefix, moduleNames] = yield handleImports([program].concat(previous));
        for (const name of moduleNames) {
            predefined[name] = name;
        }
        for (const toWrap of previous) {
            wrapOldCode(program, toWrap.body);
        }
        wrapOldCode(program, builtinsToStmts(builtins));
        unshadowVariables(program, predefined);
        transformLogicalExpressions(program);
        hybridizeBinaryUnaryOperations(program);
        hybridizeVariablesAndLiterals(program);
        // tracking functions: add functions to record runtime data.
        trackVariableAssignment(program);
        trackIfStatements(program);
        trackLoops(program);
        trackFunctions(program);
        trackLocations(innerProgram);
        addStateToIsNull(program);
        wrapCallArguments(program);
        const code = (0, astring_1.generate)(program);
        return prefix + code;
    });
}
exports.instrument = instrument;
//# sourceMappingURL=instrument.js.map