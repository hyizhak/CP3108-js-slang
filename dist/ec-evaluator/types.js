"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ECError = exports.ECEBreak = exports.InstrType = void 0;
var InstrType;
(function (InstrType) {
    InstrType["RESET"] = "Reset";
    InstrType["WHILE"] = "While";
    InstrType["FOR"] = "For";
    InstrType["ASSIGNMENT"] = "Assignment";
    InstrType["UNARY_OP"] = "UnaryOperation";
    InstrType["BINARY_OP"] = "BinaryOperation";
    InstrType["POP"] = "Pop";
    InstrType["APPLICATION"] = "Application";
    InstrType["BRANCH"] = "Branch";
    InstrType["ENVIRONMENT"] = "Environment";
    InstrType["ARRAY_LITERAL"] = "ArrayLiteral";
    InstrType["ARRAY_ACCESS"] = "ArrayAccess";
    InstrType["ARRAY_ASSIGNMENT"] = "ArrayAssignment";
    InstrType["ARRAY_LENGTH"] = "ArrayLength";
    InstrType["MARKER"] = "Marker";
    InstrType["CONTINUE"] = "Continue";
    InstrType["CONTINUE_MARKER"] = "ContinueMarker";
    InstrType["BREAK"] = "Break";
    InstrType["BREAK_MARKER"] = "BreakMarker";
})(InstrType = exports.InstrType || (exports.InstrType = {}));
// Special class that cannot be found on the stash so is safe to be used
// as an indicator of a breakpoint from running the ECE machine
class ECEBreak {
}
exports.ECEBreak = ECEBreak;
// Special value that cannot be found on the stash so is safe to be used
// as an indicator of an error from running the ECE machine
class ECError {
    constructor(error) {
        this.error = error;
    }
}
exports.ECError = ECError;
//# sourceMappingURL=types.js.map