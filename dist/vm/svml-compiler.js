"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileToIns = exports.compilePreludeToIns = exports.compileForConcurrent = void 0;
const constants_1 = require("../constants");
const errors_1 = require("../errors/errors");
const parser_1 = require("../parser/parser");
const vm_prelude_1 = require("../stdlib/vm.prelude");
const create = require("../utils/astCreator");
const walkers_1 = require("../utils/walkers");
const opcodes_1 = require("./opcodes");
const VALID_UNARY_OPERATORS = new Map([
    ['!', opcodes_1.default.NOTG],
    ['-', opcodes_1.default.NEGG]
]);
const VALID_BINARY_OPERATORS = new Map([
    ['+', opcodes_1.default.ADDG],
    ['-', opcodes_1.default.SUBG],
    ['*', opcodes_1.default.MULG],
    ['/', opcodes_1.default.DIVG],
    ['%', opcodes_1.default.MODG],
    ['<', opcodes_1.default.LTG],
    ['>', opcodes_1.default.GTG],
    ['<=', opcodes_1.default.LEG],
    ['>=', opcodes_1.default.GEG],
    ['===', opcodes_1.default.EQG],
    ['!==', opcodes_1.default.NEQG]
]);
// Array of function headers in the compiled program
let SVMFunctions = [];
function updateFunction(index, stackSize, ins) {
    const f = SVMFunctions[index];
    f[0] = stackSize;
    f[3] = ins;
}
// Individual function's machine code
let functionCode = [];
// three insert functions (nullary, unary, binary)
function addNullaryInstruction(opCode) {
    const ins = [opCode];
    functionCode.push(ins);
}
function addUnaryInstruction(opCode, arg1) {
    const ins = [opCode, arg1];
    functionCode.push(ins);
}
function addBinaryInstruction(opCode, arg1, arg2) {
    const ins = [opCode, arg1, arg2];
    functionCode.push(ins);
}
// toCompile stack keeps track of remaining compiler work:
// these are function bodies that still need to be compiled
let toCompile = [];
function popToCompile() {
    const next = toCompile.pop();
    if (!next) {
        throw Error('Unable to compile');
    }
    return next;
}
function pushToCompile(task) {
    toCompile.push(task);
}
// to compile a function body, we need an index table
// to get the environment indices for each name
// (parameters, globals and locals)
// Each compile function returns the max operand stack
// size needed for running the code. When compilation of
// a function body is done, the function continueToCompile
// writes the max operand stack size and the address of the
// function body to the given addresses.
// must ensure body passed in is something that has an array of nodes
// Program or BlockStatement
function makeToCompileTask(body, functionAddress, indexTable) {
    return [body, functionAddress, indexTable];
}
function toCompileTaskBody(toCompileTask) {
    return toCompileTask[0];
}
function toCompileTaskFunctionAddress(toCompileTask) {
    return toCompileTask[1];
}
function toCompileTaskIndexTable(toCompileTask) {
    return toCompileTask[2];
}
// indexTable keeps track of environment addresses
// assigned to names
function makeEmptyIndexTable() {
    return [];
}
function makeIndexTableWithPrimitivesAndInternals(vmInternalFunctions) {
    const names = new Map();
    for (let i = 0; i < vm_prelude_1.PRIMITIVE_FUNCTION_NAMES.length; i++) {
        const name = vm_prelude_1.PRIMITIVE_FUNCTION_NAMES[i];
        names.set(name, { index: i, isVar: false, type: 'primitive' });
    }
    if (vmInternalFunctions) {
        for (let i = 0; i < vmInternalFunctions.length; i++) {
            const name = vmInternalFunctions[i];
            names.set(name, { index: i, isVar: false, type: 'internal' });
        }
    }
    return extendIndexTable(makeEmptyIndexTable(), names);
}
function extendIndexTable(indexTable, names) {
    return indexTable.concat([names]);
}
function indexOf(indexTable, node) {
    const name = node.name;
    for (let i = indexTable.length - 1; i >= 0; i--) {
        if (indexTable[i].has(name)) {
            const envLevel = indexTable.length - 1 - i;
            const { index, isVar, type } = indexTable[i].get(name);
            return { envLevel, index, isVar, type };
        }
    }
    throw new errors_1.UndefinedVariable(name, node);
}
// a small complication: the toplevel function
// needs to return the value of the last statement
let toplevel = true;
const toplevelReturnNodes = new Set([
    'Literal',
    'UnaryExpression',
    'BinaryExpression',
    'CallExpression',
    'Identifier',
    'ArrayExpression',
    'LogicalExpression',
    'MemberExpression',
    'AssignmentExpression',
    'ArrowFunctionExpression',
    'IfStatement',
    'VariableDeclaration'
]);
function continueToCompile() {
    while (toCompile.length !== 0) {
        const nextToCompile = popToCompile();
        const functionAddress = toCompileTaskFunctionAddress(nextToCompile);
        const indexTable = toCompileTaskIndexTable(nextToCompile);
        const body = toCompileTaskBody(nextToCompile);
        body.isFunctionBlock = true;
        const { maxStackSize } = compile(body, indexTable, true);
        const functionIndex = functionAddress[0];
        updateFunction(functionIndex, maxStackSize, functionCode);
        functionCode = [];
        toplevel = false;
    }
}
// extracts all name declarations within a function or block,
// renaming every declaration if rename is true.
// if rename is true, rename to name_line_col and recursively rename identifiers in ast if no same scope declaration
// (check for variable, function declaration in each block. Check for params in each function call)
// for any duplicates, rename recursively within scope
// recurse for any blocks with rename = true
function extractAndRenameNames(baseNode, names, rename = true) {
    var _a, _b;
    // get all declared names of current scope and keep track of names to rename
    const namesToRename = new Map();
    for (const stmt of baseNode.body) {
        if (stmt.type === 'VariableDeclaration') {
            const node = stmt;
            let name = node.declarations[0].id.name;
            if (rename) {
                const loc = ((_a = node.loc) !== null && _a !== void 0 ? _a : constants_1.UNKNOWN_LOCATION).start;
                const oldName = name;
                do {
                    name = `${name}-${loc.line}-${loc.column}`;
                } while (names.has(name));
                namesToRename.set(oldName, name);
            }
            const isVar = node.kind === 'let';
            const index = names.size;
            names.set(name, { index, isVar });
        }
        else if (stmt.type === 'FunctionDeclaration') {
            const node = stmt;
            if (node.id === null) {
                throw new Error('Encountered a FunctionDeclaration node without an identifier. This should have been caught when parsing.');
            }
            let name = node.id.name;
            if (rename) {
                const loc = ((_b = node.loc) !== null && _b !== void 0 ? _b : constants_1.UNKNOWN_LOCATION).start;
                const oldName = name;
                do {
                    name = `${name}-${loc.line}-${loc.column}`;
                } while (names.has(name));
                namesToRename.set(oldName, name);
            }
            const isVar = false;
            const index = names.size;
            names.set(name, { index, isVar });
        }
    }
    // rename all references within blocks if nested block does not redeclare name
    renameVariables(baseNode, namesToRename);
    // recurse for blocks. Need to manually add all cases to recurse
    for (const stmt of baseNode.body) {
        if (stmt.type === 'BlockStatement') {
            const node = stmt;
            extractAndRenameNames(node, names, true);
        }
        if (stmt.type === 'IfStatement') {
            let nextAlt = stmt;
            while (nextAlt.type === 'IfStatement') {
                // if else if...
                const { consequent, alternate } = nextAlt;
                extractAndRenameNames(consequent, names, true);
                // Source spec must have alternate
                nextAlt = alternate;
            }
            extractAndRenameNames(nextAlt, names, true);
        }
        if (stmt.type === 'WhileStatement') {
            extractAndRenameNames(stmt.body, names, true);
        }
    }
    return names;
}
// rename variables if nested scope does not redeclare names
// redeclaration occurs on VariableDeclaration and FunctionDeclaration
function renameVariables(baseNode, namesToRename) {
    if (namesToRename.size === 0)
        return;
    let baseScope = true;
    function recurseBlock(node, inactive, c) {
        // get names in current scope
        const locals = getLocalsInScope(node);
        // add names to state
        const oldActive = new Set(inactive);
        for (const name of locals) {
            inactive.add(name);
        }
        // recurse
        for (const stmt of node.body) {
            c(stmt, inactive);
        }
        // reset state to normal
        for (const name of locals) {
            if (oldActive.has(name)) {
                continue;
            }
            inactive.delete(name); // delete if not in old scope
        }
    }
    (0, walkers_1.recursive)(baseNode, new Set(), {
        VariablePattern(node, inactive, _c) {
            // for declarations
            const name = node.name;
            if (inactive.has(name)) {
                return;
            }
            if (namesToRename.has(name)) {
                node.name = namesToRename.get(name);
            }
        },
        Identifier(node, inactive, _c) {
            // for lone references
            const name = node.name;
            if (inactive.has(name)) {
                return;
            }
            if (namesToRename.has(name)) {
                node.name = namesToRename.get(name);
            }
        },
        BlockStatement(node, inactive, c) {
            if (baseScope) {
                baseScope = false;
                for (const stmt of node.body) {
                    c(stmt, inactive);
                }
            }
            else {
                recurseBlock(node, inactive, c);
            }
        },
        IfStatement(node, inactive, c) {
            c(node.test, inactive);
            let nextAlt = node;
            while (nextAlt.type === 'IfStatement') {
                const { consequent, alternate } = nextAlt;
                recurseBlock(consequent, inactive, c);
                c(nextAlt.test, inactive);
                nextAlt = alternate;
            }
            recurseBlock(nextAlt, inactive, c);
        },
        Function(node, inactive, c) {
            if (node.type === 'FunctionDeclaration') {
                if (node.id === null) {
                    throw new Error('Encountered a FunctionDeclaration node without an identifier. This should have been caught when parsing.');
                }
                c(node.id, inactive);
            }
            const oldActive = new Set(inactive);
            const locals = new Set();
            for (const param of node.params) {
                const id = param;
                locals.add(id.name);
            }
            for (const name of locals) {
                inactive.add(name);
            }
            c(node.body, inactive, node.type === 'ArrowFunctionExpression' && node.expression ? 'Expression' : 'Statement');
            for (const name of locals) {
                if (oldActive.has(name)) {
                    continue;
                }
                inactive.delete(name); // delete if not in old scope
            }
        },
        WhileStatement(node, inactive, c) {
            c(node.test, inactive);
            recurseBlock(node.body, inactive, c);
        }
    });
}
function getLocalsInScope(node) {
    const locals = new Set();
    for (const stmt of node.body) {
        if (stmt.type === 'VariableDeclaration') {
            const name = stmt.declarations[0].id.name;
            locals.add(name);
        }
        else if (stmt.type === 'FunctionDeclaration') {
            if (stmt.id === null) {
                throw new Error('Encountered a FunctionDeclaration node without an identifier. This should have been caught when parsing.');
            }
            const name = stmt.id.name;
            locals.add(name);
        }
    }
    return locals;
}
function compileArguments(exprs, indexTable) {
    let maxStackSize = 0;
    for (let i = 0; i < exprs.length; i++) {
        const { maxStackSize: curExpSize } = compile(exprs[i], indexTable, false);
        maxStackSize = Math.max(i + curExpSize, maxStackSize);
    }
    return maxStackSize;
}
// tuple of loop type, breaks, continues and continueDestinationIndex
// break and continue need to know how much to offset for the branch
// instruction. When compiling the individual instruction, that info
// is not available, so need to keep track of the break and continue
// instruction's index to update the offset when the compiler finishes
// compiling the loop. We need to keep track of continue destination as
// a for loop needs to know where the assignment instructions are.
// This works because of the way a for loop is transformed to a while loop.
// If the loop is a for loop, the last statement in the while loop block
// is always the assignment expression
let loopTracker = [];
const LOOP_TYPE = 0;
const BREAK_INDEX = 1;
const CONT_INDEX = 2;
const CONT_DEST_INDEX = 3;
// used to compile block bodies
function compileStatements(node, indexTable, insertFlag) {
    const statements = node.body;
    let maxStackSize = 0;
    for (let i = 0; i < statements.length; i++) {
        if (node.isLoopBlock &&
            i === statements.length - 1 &&
            loopTracker[loopTracker.length - 1][LOOP_TYPE] === 'for') {
            loopTracker[loopTracker.length - 1][CONT_DEST_INDEX] = functionCode.length;
        }
        const { maxStackSize: curExprSize } = compile(statements[i], indexTable, i === statements.length - 1 ? insertFlag : false);
        if (i !== statements.length - 1 || node.isLoopBlock) {
            addNullaryInstruction(opcodes_1.default.POPG);
        }
        maxStackSize = Math.max(maxStackSize, curExprSize);
    }
    if (statements.length === 0 && !node.isLoopBlock) {
        addNullaryInstruction(opcodes_1.default.LGCU);
        if (insertFlag || node.isFunctionBlock) {
            addNullaryInstruction(opcodes_1.default.RETG);
        }
        maxStackSize++;
    }
    return { maxStackSize, insertFlag: false };
}
// each compiler should return a maxStackSize
const compilers = {
    // wrapper
    Program(node, indexTable, insertFlag) {
        node = node;
        return compileStatements(node, indexTable, insertFlag);
    },
    // wrapper
    BlockStatement(node, indexTable, insertFlag) {
        node = node;
        return compileStatements(node, indexTable, insertFlag);
    },
    // wrapper
    ExpressionStatement(node, indexTable, insertFlag) {
        node = node;
        return compile(node.expression, indexTable, insertFlag);
    },
    IfStatement(node, indexTable, insertFlag) {
        const { test, consequent, alternate } = node;
        const { maxStackSize: m1 } = compile(test, indexTable, false);
        addUnaryInstruction(opcodes_1.default.BRF, NaN);
        const BRFIndex = functionCode.length - 1;
        const { maxStackSize: m2 } = compile(consequent, indexTable, false);
        addUnaryInstruction(opcodes_1.default.BR, NaN);
        const BRIndex = functionCode.length - 1;
        functionCode[BRFIndex][1] = functionCode.length - BRFIndex;
        // source spec: must have alternate
        const { maxStackSize: m3 } = compile(alternate, indexTable, false);
        functionCode[BRIndex][1] = functionCode.length - BRIndex;
        const maxStackSize = Math.max(m1, m2, m3);
        return { maxStackSize, insertFlag };
    },
    // wrapper, compile as an arrow function expression instead
    FunctionDeclaration(node, indexTable, insertFlag) {
        if (node.id === null) {
            throw new Error('Encountered a FunctionDeclaration node without an identifier. This should have been caught when parsing.');
        }
        return compile(create.constantDeclaration(node.id.name, create.arrowFunctionExpression(node.params, node.body)), indexTable, insertFlag);
    },
    VariableDeclaration(node, indexTable, insertFlag) {
        // only supports const / let
        node = node;
        if (node.kind === 'const' || node.kind === 'let') {
            // assumes left side can only be name
            // source spec: only 1 declaration at a time
            const id = node.declarations[0].id;
            const { envLevel, index } = indexOf(indexTable, id);
            const { maxStackSize } = compile(node.declarations[0].init, indexTable, false);
            if (envLevel === 0) {
                addUnaryInstruction(opcodes_1.default.STLG, index);
            }
            else {
                // this should never happen
                addBinaryInstruction(opcodes_1.default.STPG, index, envLevel);
            }
            addNullaryInstruction(opcodes_1.default.LGCU);
            return { maxStackSize, insertFlag };
        }
        throw Error('Invalid declaration');
    },
    // handled by insertFlag in compile function
    ReturnStatement(node, indexTable, _insertFlag) {
        node = node;
        if (loopTracker.length > 0) {
            throw Error('return not allowed in loops');
        }
        const { maxStackSize } = compile(node.argument, indexTable, false, true);
        return { maxStackSize, insertFlag: true };
    },
    // Three types of calls, normal function calls declared by the Source program,
    // primitive function calls that are predefined, and internal calls.
    // We differentiate them with callType.
    CallExpression(node, indexTable, insertFlag, isTailCallPosition = false) {
        node = node;
        let maxStackOperator = 0;
        let callType = 'normal';
        let callValue = NaN;
        if (node.callee.type === 'Identifier') {
            const callee = node.callee;
            const { envLevel, index, type } = indexOf(indexTable, callee);
            if (type === 'primitive' || type === 'internal') {
                callType = type;
                callValue = index;
            }
            else if (envLevel === 0) {
                addUnaryInstruction(opcodes_1.default.LDLG, index);
            }
            else {
                addBinaryInstruction(opcodes_1.default.LDPG, index, envLevel);
            }
        }
        else {
            ;
            ({ maxStackSize: maxStackOperator } = compile(node.callee, indexTable, false));
        }
        let maxStackOperands = compileArguments(node.arguments, indexTable);
        if (callType === 'primitive') {
            addBinaryInstruction(isTailCallPosition ? opcodes_1.default.CALLTP : opcodes_1.default.CALLP, callValue, node.arguments.length);
        }
        else if (callType === 'internal') {
            addBinaryInstruction(isTailCallPosition ? opcodes_1.default.CALLTV : opcodes_1.default.CALLV, callValue, node.arguments.length);
        }
        else {
            // normal call. only normal function calls have the function on the stack
            addUnaryInstruction(isTailCallPosition ? opcodes_1.default.CALLT : opcodes_1.default.CALL, node.arguments.length);
            maxStackOperands++;
        }
        // need at least 1 stack slot for the return value!
        return { maxStackSize: Math.max(maxStackOperator, maxStackOperands, 1), insertFlag };
    },
    UnaryExpression(node, indexTable, insertFlag) {
        node = node;
        if (VALID_UNARY_OPERATORS.has(node.operator)) {
            const opCode = VALID_UNARY_OPERATORS.get(node.operator);
            const { maxStackSize } = compile(node.argument, indexTable, false);
            addNullaryInstruction(opCode);
            return { maxStackSize, insertFlag };
        }
        throw Error('Unsupported operation');
    },
    BinaryExpression(node, indexTable, insertFlag) {
        node = node;
        if (VALID_BINARY_OPERATORS.has(node.operator)) {
            const opCode = VALID_BINARY_OPERATORS.get(node.operator);
            const { maxStackSize: m1 } = compile(node.left, indexTable, false);
            const { maxStackSize: m2 } = compile(node.right, indexTable, false);
            addNullaryInstruction(opCode);
            return { maxStackSize: Math.max(m1, 1 + m2), insertFlag };
        }
        throw Error('Unsupported operation');
    },
    // convert logical expressions to conditional expressions
    LogicalExpression(node, indexTable, insertFlag, isTailCallPosition = false) {
        node = node;
        if (node.operator === '&&') {
            const { maxStackSize } = compile(create.conditionalExpression(node.left, node.right, create.literal(false)), indexTable, false, isTailCallPosition);
            return { maxStackSize, insertFlag };
        }
        else if (node.operator === '||') {
            const { maxStackSize } = compile(create.conditionalExpression(node.left, create.literal(true), node.right), indexTable, false, isTailCallPosition);
            return { maxStackSize, insertFlag };
        }
        throw Error('Unsupported operation');
    },
    ConditionalExpression(node, indexTable, insertFlag, isTailCallPosition = false) {
        const { test, consequent, alternate } = node;
        const { maxStackSize: m1 } = compile(test, indexTable, false);
        addUnaryInstruction(opcodes_1.default.BRF, NaN);
        const BRFIndex = functionCode.length - 1;
        const { maxStackSize: m2 } = compile(consequent, indexTable, insertFlag, isTailCallPosition);
        let BRIndex = NaN;
        if (!insertFlag) {
            addUnaryInstruction(opcodes_1.default.BR, NaN);
            BRIndex = functionCode.length - 1;
        }
        functionCode[BRFIndex][1] = functionCode.length - BRFIndex;
        const { maxStackSize: m3 } = compile(alternate, indexTable, insertFlag, isTailCallPosition);
        if (!insertFlag) {
            functionCode[BRIndex][1] = functionCode.length - BRIndex;
        }
        const maxStackSize = Math.max(m1, m2, m3);
        return { maxStackSize, insertFlag: false };
    },
    ArrowFunctionExpression(node, indexTable, insertFlag) {
        node = node;
        // node.body is either a block statement or a single node to return
        const bodyNode = node.body.type === 'BlockStatement'
            ? node.body
            : create.blockStatement([create.returnStatement(node.body)]);
        const names = new Map();
        for (let param of node.params) {
            param = param;
            const index = names.size;
            names.set(param.name, { index, isVar: true });
        }
        extractAndRenameNames(bodyNode, names);
        const extendedIndexTable = extendIndexTable(indexTable, names);
        const newSVMFunction = [NaN, names.size, node.params.length, []];
        const functionIndex = SVMFunctions.length;
        SVMFunctions.push(newSVMFunction);
        pushToCompile(makeToCompileTask(bodyNode, [functionIndex], extendedIndexTable));
        addUnaryInstruction(opcodes_1.default.NEWC, [functionIndex]);
        return { maxStackSize: 1, insertFlag };
    },
    Identifier(node, indexTable, insertFlag) {
        node = node;
        let envLevel;
        let index;
        let type;
        try {
            ;
            ({ envLevel, index, type } = indexOf(indexTable, node));
            if (type === 'primitive') {
                addUnaryInstruction(opcodes_1.default.NEWCP, index);
            }
            else if (type === 'internal') {
                addUnaryInstruction(opcodes_1.default.NEWCV, index);
            }
            else if (envLevel === 0) {
                addUnaryInstruction(opcodes_1.default.LDLG, index);
            }
            else {
                addBinaryInstruction(opcodes_1.default.LDPG, index, envLevel);
            }
        }
        catch (error) {
            // only possible to have UndefinedVariable error
            const matches = vm_prelude_1.CONSTANT_PRIMITIVES.filter(f => f[0] === error.name);
            if (matches.length === 0) {
                throw error;
            }
            if (typeof matches[0][1] === 'number') {
                // for NaN and Infinity
                addUnaryInstruction(opcodes_1.default.LGCF32, matches[0][1]);
            }
            else if (matches[0][1] === undefined) {
                addNullaryInstruction(opcodes_1.default.LGCU);
            }
            else {
                throw Error('Unknown primitive constant');
            }
        }
        return { maxStackSize: 1, insertFlag };
    },
    // string, boolean, number or null
    Literal(node, indexTable, insertFlag) {
        node = node;
        const value = node.value;
        if (value === null) {
            addNullaryInstruction(opcodes_1.default.LGCN);
        }
        else {
            switch (typeof value) {
                case 'boolean':
                    if (value) {
                        addNullaryInstruction(opcodes_1.default.LGCB1);
                    }
                    else {
                        addNullaryInstruction(opcodes_1.default.LGCB0);
                    }
                    break;
                case 'number': // need to adjust depending on target
                    // LGCI takes a signed 32-bit integer operand (hence the range)
                    if (Number.isInteger(value) && -2147483648 <= value && value <= 2147483647) {
                        addUnaryInstruction(opcodes_1.default.LGCI, value);
                    }
                    else {
                        addUnaryInstruction(opcodes_1.default.LGCF64, value);
                    }
                    break;
                case 'string':
                    addUnaryInstruction(opcodes_1.default.LGCS, value);
                    break;
                default:
                    throw Error('Unsupported literal');
            }
        }
        return { maxStackSize: 1, insertFlag };
    },
    // array declarations
    ArrayExpression(node, indexTable, insertFlag) {
        node = node;
        addNullaryInstruction(opcodes_1.default.NEWA);
        const elements = node.elements;
        let maxStackSize = 1;
        for (let i = 0; i < elements.length; i++) {
            // special case when element wasnt specified
            // i.e. [,]. Treat as undefined element
            if (elements[i] === null) {
                continue;
            }
            // keep the array in the stack
            addNullaryInstruction(opcodes_1.default.DUP);
            addUnaryInstruction(opcodes_1.default.LGCI, i);
            const { maxStackSize: m1 } = compile(elements[i], indexTable, false);
            addNullaryInstruction(opcodes_1.default.STAG);
            maxStackSize = Math.max(1 + 2 + m1, maxStackSize);
        }
        return { maxStackSize, insertFlag };
    },
    AssignmentExpression(node, indexTable, insertFlag) {
        node = node;
        if (node.left.type === 'Identifier') {
            const { envLevel, index, isVar } = indexOf(indexTable, node.left);
            if (!isVar) {
                throw new errors_1.ConstAssignment(node.left, node.left.name);
            }
            const { maxStackSize } = compile(node.right, indexTable, false);
            if (envLevel === 0) {
                addUnaryInstruction(opcodes_1.default.STLG, index);
            }
            else {
                addBinaryInstruction(opcodes_1.default.STPG, index, envLevel);
            }
            addNullaryInstruction(opcodes_1.default.LGCU);
            return { maxStackSize, insertFlag };
        }
        else if (node.left.type === 'MemberExpression' && node.left.computed === true) {
            // case for array member assignment
            const { maxStackSize: m1 } = compile(node.left.object, indexTable, false);
            const { maxStackSize: m2 } = compile(node.left.property, indexTable, false);
            const { maxStackSize: m3 } = compile(node.right, indexTable, false);
            addNullaryInstruction(opcodes_1.default.STAG);
            addNullaryInstruction(opcodes_1.default.LGCU);
            return { maxStackSize: Math.max(m1, 1 + m2, 2 + m3), insertFlag };
        }
        // property assignments are not supported
        throw Error('Invalid Assignment');
    },
    ForStatement(_node, _indexTable, _insertFlag) {
        throw Error('Unsupported operation');
    },
    // Loops need to have their own environment due to closures
    WhileStatement(node, indexTable, insertFlag) {
        node = node;
        const isFor = node.isFor;
        const condIndex = functionCode.length;
        const { maxStackSize: m1 } = compile(node.test, indexTable, false);
        addUnaryInstruction(opcodes_1.default.BRF, NaN);
        const BRFIndex = functionCode.length - 1;
        loopTracker.push([isFor ? 'for' : 'while', [], [], NaN]);
        // Add environment for loop and run in new environment
        const locals = extractAndRenameNames(node.body, new Map());
        addUnaryInstruction(opcodes_1.default.NEWENV, locals.size);
        const extendedIndexTable = extendIndexTable(indexTable, locals);
        const body = node.body;
        body.isLoopBlock = true;
        const { maxStackSize: m2 } = compile(body, extendedIndexTable, false);
        if (!isFor) {
            // for while loops, the `continue` statement should branch here
            loopTracker[loopTracker.length - 1][CONT_DEST_INDEX] = functionCode.length;
        }
        addNullaryInstruction(opcodes_1.default.POPENV);
        const endLoopIndex = functionCode.length;
        addUnaryInstruction(opcodes_1.default.BR, condIndex - endLoopIndex);
        functionCode[BRFIndex][1] = functionCode.length - BRFIndex;
        // update BR instructions within loop
        const curLoop = loopTracker.pop();
        for (const b of curLoop[BREAK_INDEX]) {
            functionCode[b][1] = functionCode.length - b;
        }
        for (const c of curLoop[CONT_INDEX]) {
            functionCode[c][1] = curLoop[CONT_DEST_INDEX] - c;
        }
        addNullaryInstruction(opcodes_1.default.LGCU);
        return { maxStackSize: Math.max(m1, m2), insertFlag };
    },
    BreakStatement(node, indexTable, insertFlag) {
        // keep track of break instruction
        addNullaryInstruction(opcodes_1.default.POPENV);
        loopTracker[loopTracker.length - 1][BREAK_INDEX].push(functionCode.length);
        addUnaryInstruction(opcodes_1.default.BR, NaN);
        return { maxStackSize: 0, insertFlag };
    },
    ContinueStatement(node, indexTable, insertFlag) {
        // keep track of continue instruction
        // no need to POPENV as continue will go to the end of the while loop
        loopTracker[loopTracker.length - 1][CONT_INDEX].push(functionCode.length);
        addUnaryInstruction(opcodes_1.default.BR, NaN);
        return { maxStackSize: 0, insertFlag };
    },
    ObjectExpression(_node, _indexTable, _insertFlag) {
        throw Error('Unsupported operation');
    },
    MemberExpression(node, indexTable, insertFlag) {
        node = node;
        if (node.computed) {
            const { maxStackSize: m1 } = compile(node.object, indexTable, false);
            const { maxStackSize: m2 } = compile(node.property, indexTable, false);
            addNullaryInstruction(opcodes_1.default.LDAG);
            return { maxStackSize: Math.max(m1, 1 + m2), insertFlag };
        }
        // properties are not supported
        throw Error('Unsupported operation');
    },
    Property(_node, _indexTable, _insertFlag) {
        throw Error('Unsupported operation');
    },
    DebuggerStatement(_node, _indexTable, _insertFlag) {
        throw Error('Unsupported operation');
    }
};
function compile(expr, indexTable, insertFlag, isTailCallPosition = false) {
    const compiler = compilers[expr.type];
    if (!compiler) {
        throw Error('Unsupported operation');
    }
    const { maxStackSize: temp, insertFlag: newInsertFlag } = compiler(expr, indexTable, insertFlag, isTailCallPosition);
    let maxStackSize = temp;
    // insertFlag decides whether we need to introduce a RETG instruction. For some functions
    // where return is not specified, there is an implicit "return undefined", which we do here.
    // Source programs should return the last evaluated statement, which is what toplevel handles.
    // TODO: Don't emit an unnecessary RETG after a tail call. (This is harmless, but wastes an instruction.)
    // (There are unnecessary RETG for many cases at the top level)
    // TODO: Source programs should return last evaluated statement.
    if (newInsertFlag) {
        if (expr.type === 'ReturnStatement') {
            addNullaryInstruction(opcodes_1.default.RETG);
        }
        else if (toplevel && toplevelReturnNodes.has(expr.type)) {
            // conditional expressions already handled
            addNullaryInstruction(opcodes_1.default.RETG);
        }
        else if (expr.type === 'Program' ||
            expr.type === 'ExpressionStatement' ||
            expr.type === 'BlockStatement' ||
            expr.type === 'FunctionDeclaration') {
            // do nothing for wrapper nodes
        }
        else {
            maxStackSize += 1;
            addNullaryInstruction(opcodes_1.default.LGCU);
            addNullaryInstruction(opcodes_1.default.RETG);
        }
    }
    return { maxStackSize, insertFlag: newInsertFlag };
}
function compileForConcurrent(program, context) {
    // assume vmPrelude is always a correct program
    const prelude = compilePreludeToIns((0, parser_1.parse)(vm_prelude_1.vmPrelude, context));
    (0, vm_prelude_1.generatePrimitiveFunctionCode)(prelude);
    const vmInternalFunctions = vm_prelude_1.INTERNAL_FUNCTIONS.map(([name]) => name);
    return compileToIns(program, prelude, vmInternalFunctions);
}
exports.compileForConcurrent = compileForConcurrent;
function compilePreludeToIns(program) {
    // reset variables
    SVMFunctions = [];
    functionCode = [];
    toCompile = [];
    loopTracker = [];
    toplevel = true;
    transformForLoopsToWhileLoops(program);
    // don't rename names at the top level, because we need them for linking
    const locals = extractAndRenameNames(program, new Map(), false);
    const topFunction = [NaN, locals.size, 0, []];
    const topFunctionIndex = 0; // GE + # primitive func
    SVMFunctions[topFunctionIndex] = topFunction;
    const extendedTable = extendIndexTable(makeIndexTableWithPrimitivesAndInternals(), locals);
    pushToCompile(makeToCompileTask(program, [topFunctionIndex], extendedTable));
    continueToCompile();
    return [0, SVMFunctions];
}
exports.compilePreludeToIns = compilePreludeToIns;
function compileToIns(program, prelude, vmInternalFunctions) {
    // reset variables
    SVMFunctions = [];
    functionCode = [];
    toCompile = [];
    loopTracker = [];
    toplevel = true;
    transformForLoopsToWhileLoops(program);
    insertEmptyElseBlocks(program);
    const locals = extractAndRenameNames(program, new Map());
    const topFunction = [NaN, locals.size, 0, []];
    if (prelude) {
        SVMFunctions.push(...prelude[1]);
    }
    const topFunctionIndex = prelude ? vm_prelude_1.PRIMITIVE_FUNCTION_NAMES.length + 1 : 0; // GE + # primitive func
    SVMFunctions[topFunctionIndex] = topFunction;
    const extendedTable = extendIndexTable(makeIndexTableWithPrimitivesAndInternals(vmInternalFunctions), locals);
    pushToCompile(makeToCompileTask(program, [topFunctionIndex], extendedTable));
    continueToCompile();
    return [0, SVMFunctions];
}
exports.compileToIns = compileToIns;
// transform according to Source 3 spec. Refer to spec for the way of transformation
function transformForLoopsToWhileLoops(program) {
    (0, walkers_1.simple)(program, {
        ForStatement(node) {
            const { test, body, init, update } = node;
            let forLoopBody = body;
            // Source spec: init must be present
            if (init.type === 'VariableDeclaration') {
                const loopVarName = init.declarations[0].id
                    .name;
                // loc is used for renaming. It doesn't matter if we use the same location, as the
                // renaming function will notice that they are the same, and rename it further so that
                // there aren't any clashes.
                const loc = init.loc;
                const copyOfLoopVarName = 'copy-of-' + loopVarName;
                const innerBlock = create.blockStatement([
                    create.constantDeclaration(loopVarName, create.identifier(copyOfLoopVarName), loc),
                    body
                ]);
                forLoopBody = create.blockStatement([
                    create.constantDeclaration(copyOfLoopVarName, create.identifier(loopVarName), loc),
                    innerBlock
                ]);
            }
            const assignment1 = init && init.type === 'VariableDeclaration'
                ? init
                : create.expressionStatement(init);
            const assignment2 = create.expressionStatement(update);
            const newLoopBody = create.blockStatement([forLoopBody, assignment2]);
            const newLoop = create.whileStatement(newLoopBody, test);
            newLoop.isFor = true;
            const newBlockBody = [assignment1, newLoop];
            node = node;
            node.body = newBlockBody;
            node.type = 'BlockStatement';
        }
    });
}
function insertEmptyElseBlocks(program) {
    (0, walkers_1.simple)(program, {
        IfStatement(node) {
            var _a;
            (_a = node.alternate) !== null && _a !== void 0 ? _a : (node.alternate = {
                type: 'BlockStatement',
                body: []
            });
        }
    });
}
//# sourceMappingURL=svml-compiler.js.map