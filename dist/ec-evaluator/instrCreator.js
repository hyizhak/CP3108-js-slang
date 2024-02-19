"use strict";
/**
 * Utility functions for creating the various agenda instructions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.breakMarkerInstr = exports.breakInstr = exports.contMarkerInstr = exports.contInstr = exports.markerInstr = exports.arrAssmtInstr = exports.arrAccInstr = exports.arrLitInstr = exports.envInstr = exports.branchInstr = exports.appInstr = exports.popInstr = exports.binOpInstr = exports.unOpInstr = exports.assmtInstr = exports.forInstr = exports.whileInstr = exports.resetInstr = void 0;
const types_1 = require("./types");
const resetInstr = (srcNode) => ({
    instrType: types_1.InstrType.RESET,
    srcNode
});
exports.resetInstr = resetInstr;
const whileInstr = (test, body, srcNode) => ({
    instrType: types_1.InstrType.WHILE,
    test,
    body,
    srcNode
});
exports.whileInstr = whileInstr;
const forInstr = (init, test, update, body, srcNode) => ({
    instrType: types_1.InstrType.FOR,
    init,
    test,
    update,
    body,
    srcNode
});
exports.forInstr = forInstr;
const assmtInstr = (symbol, constant, declaration, srcNode) => ({
    instrType: types_1.InstrType.ASSIGNMENT,
    symbol,
    constant,
    declaration,
    srcNode
});
exports.assmtInstr = assmtInstr;
const unOpInstr = (symbol, srcNode) => ({
    instrType: types_1.InstrType.UNARY_OP,
    symbol,
    srcNode
});
exports.unOpInstr = unOpInstr;
const binOpInstr = (symbol, srcNode) => ({
    instrType: types_1.InstrType.BINARY_OP,
    symbol,
    srcNode
});
exports.binOpInstr = binOpInstr;
const popInstr = (srcNode) => ({ instrType: types_1.InstrType.POP, srcNode });
exports.popInstr = popInstr;
const appInstr = (numOfArgs, srcNode) => ({
    instrType: types_1.InstrType.APPLICATION,
    numOfArgs,
    srcNode
});
exports.appInstr = appInstr;
const branchInstr = (consequent, alternate, srcNode) => ({
    instrType: types_1.InstrType.BRANCH,
    consequent,
    alternate,
    srcNode
});
exports.branchInstr = branchInstr;
const envInstr = (env, srcNode) => ({
    instrType: types_1.InstrType.ENVIRONMENT,
    env,
    srcNode
});
exports.envInstr = envInstr;
const arrLitInstr = (arity, srcNode) => ({
    instrType: types_1.InstrType.ARRAY_LITERAL,
    arity,
    srcNode
});
exports.arrLitInstr = arrLitInstr;
const arrAccInstr = (srcNode) => ({
    instrType: types_1.InstrType.ARRAY_ACCESS,
    srcNode
});
exports.arrAccInstr = arrAccInstr;
const arrAssmtInstr = (srcNode) => ({
    instrType: types_1.InstrType.ARRAY_ASSIGNMENT,
    srcNode
});
exports.arrAssmtInstr = arrAssmtInstr;
const markerInstr = (srcNode) => ({
    instrType: types_1.InstrType.MARKER,
    srcNode
});
exports.markerInstr = markerInstr;
const contInstr = (srcNode) => ({
    instrType: types_1.InstrType.CONTINUE,
    srcNode
});
exports.contInstr = contInstr;
const contMarkerInstr = (srcNode) => ({
    instrType: types_1.InstrType.CONTINUE_MARKER,
    srcNode
});
exports.contMarkerInstr = contMarkerInstr;
const breakInstr = (srcNode) => ({
    instrType: types_1.InstrType.BREAK,
    srcNode
});
exports.breakInstr = breakInstr;
const breakMarkerInstr = (srcNode) => ({
    instrType: types_1.InstrType.BREAK_MARKER,
    srcNode
});
exports.breakMarkerInstr = breakMarkerInstr;
//# sourceMappingURL=instrCreator.js.map