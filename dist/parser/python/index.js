"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PythonParser = void 0;
const src_1 = require("../../py-slang/src");
const types_1 = require("../../types");
const errors_1 = require("../errors");
const utils_1 = require("../utils");
class PythonParser {
    constructor(chapter) {
        this.chapter = chapter;
    }
    parse(programStr, context, options, throwOnError) {
        try {
            // parse the Python code
            const chapterNum = (() => {
                switch (this.chapter) {
                    case types_1.Chapter.PYTHON_1:
                        return 1;
                    // Future additions:
                    //   case Chapter.PYTHON_2:
                    //     return 2
                    //   case Chapter.PYTHON_3:
                    //     return 3
                    //   case Chapter.PYTHON_4:
                    //     return 4
                    default:
                        throw new Error('Unreachable path');
                }
            })();
            return (0, src_1.parsePythonToEstreeAst)(programStr, chapterNum, true);
        }
        catch (error) {
            if (error instanceof SyntaxError) {
                error = new errors_1.FatalSyntaxError((0, utils_1.positionToSourceLocation)(error.loc), error.toString());
            }
            if (throwOnError)
                throw error;
            context.errors.push(error);
        }
        return null;
    }
    validate(_ast, _context, _throwOnError) {
        return true;
    }
    toString() {
        return `PythonParser{chapter: ${this.chapter}}`;
    }
}
exports.PythonParser = PythonParser;
//# sourceMappingURL=index.js.map