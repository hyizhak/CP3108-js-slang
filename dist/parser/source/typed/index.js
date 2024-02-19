"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourceTypedParser = void 0;
const parser_1 = require("@babel/parser");
const constants_1 = require("../../../constants");
const typeErrorChecker_1 = require("../../../typeChecker/typeErrorChecker");
const errors_1 = require("../../errors");
const utils_1 = require("../../utils");
const __1 = require("..");
const typeParser_1 = require("./typeParser");
const utils_2 = require("./utils");
class SourceTypedParser extends __1.SourceParser {
    parse(programStr, context, options, throwOnError) {
        // Parse with acorn type parser first to catch errors such as
        // import/export not at top level, trailing commas, missing semicolons
        try {
            typeParser_1.default.parse(programStr, (0, utils_1.createAcornParserOptions)(constants_1.DEFAULT_ECMA_VERSION, context.errors, options));
        }
        catch (error) {
            if (error instanceof SyntaxError) {
                error = new errors_1.FatalSyntaxError((0, utils_1.positionToSourceLocation)(error.loc, options === null || options === void 0 ? void 0 : options.sourceFile), error.toString());
            }
            if (throwOnError)
                throw error;
            context.errors.push(error);
            return null;
        }
        // Parse again with babel parser to capture all type syntax
        // and catch remaining syntax errors not caught by acorn type parser
        const ast = (0, parser_1.parse)(programStr, Object.assign(Object.assign({}, utils_1.defaultBabelOptions), { sourceFilename: options === null || options === void 0 ? void 0 : options.sourceFile, errorRecovery: throwOnError !== null && throwOnError !== void 0 ? throwOnError : true }));
        if (ast.errors.length) {
            ast.errors
                .filter(error => error instanceof SyntaxError)
                .forEach(error => {
                context.errors.push(new errors_1.FatalSyntaxError((0, utils_1.positionToSourceLocation)(error.loc, options === null || options === void 0 ? void 0 : options.sourceFile), error.toString()));
            });
            return null;
        }
        const typedProgram = ast.program;
        const typedCheckedProgram = (0, typeErrorChecker_1.checkForTypeErrors)(typedProgram, context);
        (0, utils_2.transformBabelASTToESTreeCompliantAST)(typedCheckedProgram);
        return typedCheckedProgram;
    }
    toString() {
        return 'SourceTypedParser';
    }
}
exports.SourceTypedParser = SourceTypedParser;
//# sourceMappingURL=index.js.map