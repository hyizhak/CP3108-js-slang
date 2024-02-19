"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isIdentifier = exports.checkMemberAccess = exports.checkIfStatement = exports.checkBinaryExpression = exports.checkUnaryExpression = exports.TypeError = void 0;
const runtimeSourceError_1 = require("../errors/runtimeSourceError");
const types_1 = require("../types");
const LHS = ' on left hand side of operation';
const RHS = ' on right hand side of operation';
class TypeError extends runtimeSourceError_1.RuntimeSourceError {
    constructor(node, side, expected, got, chapter = types_1.Chapter.SOURCE_4) {
        super(node);
        this.side = side;
        this.expected = expected;
        this.got = got;
        this.chapter = chapter;
        this.type = types_1.ErrorType.RUNTIME;
        this.severity = types_1.ErrorSeverity.ERROR;
    }
    explain() {
        const displayGot = this.got === 'array' ? (this.chapter <= 2 ? 'pair' : 'compound data') : this.got;
        return `Expected ${this.expected}${this.side}, got ${displayGot}.`;
    }
    elaborate() {
        return this.explain();
    }
}
exports.TypeError = TypeError;
// We need to define our own typeof in order for null/array to display properly in error messages
const typeOf = (v) => {
    if (v === null) {
        return 'null';
    }
    else if (Array.isArray(v)) {
        return 'array';
    }
    else {
        return typeof v;
    }
};
const isNumber = (v) => typeOf(v) === 'number';
// See section 4 of https://2ality.com/2012/12/arrays.html
// v >>> 0 === v checks that v is a valid unsigned 32-bit int
// tslint:disable-next-line:no-bitwise
const isArrayIndex = (v) => isNumber(v) && v >>> 0 === v && v < 2 ** 32 - 1;
const isString = (v) => typeOf(v) === 'string';
const isBool = (v) => typeOf(v) === 'boolean';
const isObject = (v) => typeOf(v) === 'object';
const isArray = (v) => typeOf(v) === 'array';
const checkUnaryExpression = (node, operator, value, chapter = types_1.Chapter.SOURCE_4) => {
    if ((operator === '+' || operator === '-') && !isNumber(value)) {
        return new TypeError(node, '', 'number', typeOf(value), chapter);
    }
    else if (operator === '!' && !isBool(value)) {
        return new TypeError(node, '', 'boolean', typeOf(value), chapter);
    }
    else {
        return undefined;
    }
};
exports.checkUnaryExpression = checkUnaryExpression;
const checkBinaryExpression = (node, operator, chapter, left, right) => {
    switch (operator) {
        case '-':
        case '*':
        case '/':
        case '%':
            if (!isNumber(left)) {
                return new TypeError(node, LHS, 'number', typeOf(left), chapter);
            }
            else if (!isNumber(right)) {
                return new TypeError(node, RHS, 'number', typeOf(right), chapter);
            }
            else {
                return;
            }
        case '+':
        case '<':
        case '<=':
        case '>':
        case '>=':
        case '!==':
        case '===':
            if (chapter > 2 && (operator === '===' || operator === '!==')) {
                return;
            }
            if (isNumber(left)) {
                return isNumber(right)
                    ? undefined
                    : new TypeError(node, RHS, 'number', typeOf(right), chapter);
            }
            else if (isString(left)) {
                return isString(right)
                    ? undefined
                    : new TypeError(node, RHS, 'string', typeOf(right), chapter);
            }
            else {
                return new TypeError(node, LHS, 'string or number', typeOf(left), chapter);
            }
        default:
            return;
    }
};
exports.checkBinaryExpression = checkBinaryExpression;
const checkIfStatement = (node, test, chapter = types_1.Chapter.SOURCE_4) => {
    return isBool(test)
        ? undefined
        : new TypeError(node, ' as condition', 'boolean', typeOf(test), chapter);
};
exports.checkIfStatement = checkIfStatement;
const checkMemberAccess = (node, obj, prop) => {
    if (isObject(obj)) {
        return isString(prop) ? undefined : new TypeError(node, ' as prop', 'string', typeOf(prop));
    }
    else if (isArray(obj)) {
        return isArrayIndex(prop)
            ? undefined
            : isNumber(prop)
                ? new TypeError(node, ' as prop', 'array index', 'other number')
                : new TypeError(node, ' as prop', 'array index', typeOf(prop));
    }
    else {
        return new TypeError(node, '', 'object or array', typeOf(obj));
    }
};
exports.checkMemberAccess = checkMemberAccess;
const isIdentifier = (node) => {
    return node.name !== undefined;
};
exports.isIdentifier = isIdentifier;
//# sourceMappingURL=rttc.js.map