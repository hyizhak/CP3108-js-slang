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
exports.fullJSRunner = void 0;
/* eslint-disable @typescript-eslint/no-unused-vars */
const astring_1 = require("astring");
const constants_1 = require("../constants");
const runtimeSourceError_1 = require("../errors/runtimeSourceError");
const hoistAndMergeImports_1 = require("../localImports/transformers/hoistAndMergeImports");
const requireProvider_1 = require("../modules/requireProvider");
const parser_1 = require("../parser/parser");
const transpiler_1 = require("../transpiler/transpiler");
const create = require("../utils/astCreator");
const uniqueIds_1 = require("../utils/uniqueIds");
const errors_1 = require("./errors");
const utils_1 = require("./utils");
function fullJSEval(code, requireProvider, nativeStorage) {
    if (nativeStorage.evaller) {
        return nativeStorage.evaller(code);
    }
    else {
        return eval(code);
    }
}
function preparePrelude(context) {
    if (context.prelude === null) {
        return [];
    }
    const prelude = context.prelude;
    context.prelude = null;
    const program = (0, parser_1.parse)(prelude, context);
    if (program === null) {
        return undefined;
    }
    return program.body;
}
function containsPrevEval(context) {
    return context.nativeStorage.evaller != null;
}
function fullJSRunner(program, context, importOptions) {
    return __awaiter(this, void 0, void 0, function* () {
        // prelude & builtins
        // only process builtins and preludes if it is a fresh eval context
        const prelude = preparePrelude(context);
        if (prelude === undefined) {
            return utils_1.resolvedErrorPromise;
        }
        const preludeAndBuiltins = containsPrevEval(context)
            ? []
            : [...(0, transpiler_1.getBuiltins)(context.nativeStorage), ...prelude];
        // modules
        (0, hoistAndMergeImports_1.hoistAndMergeImports)(program);
        // evaluate and create a separate block for preludes and builtins
        const preEvalProgram = create.program([
            ...preludeAndBuiltins,
            (0, transpiler_1.evallerReplacer)(create.identifier(constants_1.NATIVE_STORAGE_ID), new Set())
        ]);
        (0, uniqueIds_1.getFunctionDeclarationNamesInProgram)(preEvalProgram).forEach(id => context.nativeStorage.previousProgramsIdentifiers.add(id));
        (0, transpiler_1.getGloballyDeclaredIdentifiers)(preEvalProgram).forEach(id => context.nativeStorage.previousProgramsIdentifiers.add(id));
        const preEvalCode = (0, astring_1.generate)(preEvalProgram);
        const requireProvider = (0, requireProvider_1.getRequireProvider)(context);
        yield fullJSEval(preEvalCode, requireProvider, context.nativeStorage);
        let transpiled;
        let sourceMapJson;
        try {
            ;
            ({ transpiled, sourceMapJson } = yield (0, transpiler_1.transpile)(program, context, importOptions));
            return {
                status: 'finished',
                context,
                value: yield fullJSEval(transpiled, requireProvider, context.nativeStorage)
            };
        }
        catch (error) {
            context.errors.push(error instanceof runtimeSourceError_1.RuntimeSourceError ? error : yield (0, errors_1.toSourceError)(error, sourceMapJson));
            return utils_1.resolvedErrorPromise;
        }
    });
}
exports.fullJSRunner = fullJSRunner;
//# sourceMappingURL=fullJSRunner.js.map