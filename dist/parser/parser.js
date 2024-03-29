"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = void 0;
const types_1 = require("../types");
const fullJS_1 = require("./fullJS");
const fullTS_1 = require("./fullTS");
const python_1 = require("./python");
const scheme_1 = require("./scheme");
const source_1 = require("./source");
const typed_1 = require("./source/typed");
function parse(programStr, context, options, throwOnError) {
    let parser;
    switch (context.chapter) {
        case types_1.Chapter.SCHEME_1:
        case types_1.Chapter.SCHEME_2:
        case types_1.Chapter.SCHEME_3:
        case types_1.Chapter.SCHEME_4:
        case types_1.Chapter.FULL_SCHEME:
            parser = new scheme_1.SchemeParser(context.chapter);
            break;
        case types_1.Chapter.PYTHON_1:
            parser = new python_1.PythonParser(context.chapter);
            break;
        case types_1.Chapter.FULL_JS:
            parser = new fullJS_1.FullJSParser();
            break;
        case types_1.Chapter.FULL_TS:
            parser = new fullTS_1.FullTSParser();
            break;
        default:
            switch (context.variant) {
                case types_1.Variant.TYPED:
                    parser = new typed_1.SourceTypedParser(context.chapter, context.variant);
                    break;
                default:
                    parser = new source_1.SourceParser(context.chapter, context.variant);
            }
    }
    const ast = parser.parse(programStr, context, options, throwOnError);
    const validAst = !!ast && parser.validate(ast, context, throwOnError);
    return validAst ? ast : null;
}
exports.parse = parse;
//# sourceMappingURL=parser.js.map