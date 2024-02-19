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
exports.expectNativeToTimeoutAndError = exports.expectToLooselyMatchJS = exports.expectToMatchJS = exports.expectParsedErrorNoSnapshot = exports.expectWarning = exports.expectDifferentParsedErrors = exports.expectParsedError = exports.expectParsedErrorNoErrorSnapshot = exports.expectResult = exports.getDisplayResult = exports.expectVisualiseListResult = exports.expectDisplayResult = exports.snapshotFailure = exports.snapshotWarning = exports.snapshotSuccess = exports.snapshot = exports.testFailure = exports.testSuccessWithErrors = exports.testSuccess = exports.createTestContext = void 0;
const astring_1 = require("astring");
const createContext_1 = require("../createContext");
const gpu_1 = require("../gpu/gpu");
const index_1 = require("../index");
const lazy_1 = require("../lazy/lazy");
const context_1 = require("../mocks/context");
const parser_1 = require("../parser/parser");
const transpiler_1 = require("../transpiler/transpiler");
const types_1 = require("../types");
const stringify_1 = require("./stringify");
function createTestContext({ context, chapter = types_1.Chapter.SOURCE_1, variant = types_1.Variant.DEFAULT, testBuiltins = {} } = {}) {
    if (context !== undefined) {
        return context;
    }
    else {
        const testContext = Object.assign(Object.assign({}, (0, createContext_1.default)(chapter, variant, [], undefined, {
            rawDisplay: (str1, str2, _externalContext) => {
                testContext.displayResult.push((str2 === undefined ? '' : str2 + ' ') + str1);
                return str1;
            },
            prompt: (str, _externalContext) => {
                testContext.promptResult.push(str);
                return null;
            },
            alert: (str, _externalContext) => {
                testContext.alertResult.push(str);
            },
            visualiseList: value => {
                testContext.visualiseListResult.push(value);
            }
        })), { displayResult: [], promptResult: [], alertResult: [], visualiseListResult: [] });
        Object.entries(testBuiltins).forEach(([key, value]) => (0, createContext_1.defineBuiltin)(testContext, key, value));
        return testContext;
    }
}
exports.createTestContext = createTestContext;
function testInContext(code, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const interpretedTestContext = createTestContext(options);
        const scheduler = 'preemptive';
        const getTestResult = (context, result) => {
            const testResult = {
                code,
                displayResult: context.displayResult,
                alertResult: context.alertResult,
                visualiseListResult: context.visualiseListResult,
                numErrors: context.errors.length,
                parsedErrors: (0, index_1.parseError)(context.errors),
                resultStatus: result.status,
                result: result.status === 'finished' ? result.value : undefined
            };
            if (options.showErrorJSON) {
                testResult['errors'] = context.errors;
            }
            return testResult;
        };
        const interpretedResult = getTestResult(interpretedTestContext, yield (0, index_1.runInContext)(code, interpretedTestContext, {
            scheduler,
            executionMethod: 'interpreter',
            variant: options.variant
        }));
        if (options.native) {
            const nativeTestContext = createTestContext(options);
            let pretranspiled = '';
            let transpiled = '';
            const parsed = (0, parser_1.parse)(code, nativeTestContext);
            // Reset errors in context so as not to interfere with actual run.
            nativeTestContext.errors = [];
            if (parsed === undefined) {
                pretranspiled = 'parseError';
            }
            else {
                // Mutates program
                switch (options.variant) {
                    case types_1.Variant.GPU:
                        (0, gpu_1.transpileToGPU)(parsed);
                        pretranspiled = (0, astring_1.generate)(parsed);
                        break;
                    case types_1.Variant.LAZY:
                        (0, lazy_1.transpileToLazy)(parsed);
                        pretranspiled = (0, astring_1.generate)(parsed);
                        break;
                }
                try {
                    ;
                    ({ transpiled } = yield (0, transpiler_1.transpile)(parsed, nativeTestContext, options.importOptions));
                    // replace declaration of builtins since they're repetitive
                    transpiled = transpiled.replace(/\n  const \w+ = nativeStorage\..*;/g, '');
                    transpiled = transpiled.replace(/\n\s*const \w+ = .*\.operators\..*;/g, '');
                }
                catch (_a) {
                    transpiled = 'parseError';
                }
            }
            const nativeResult = getTestResult(nativeTestContext, yield (0, index_1.runInContext)(code, nativeTestContext, {
                scheduler,
                executionMethod: 'native',
                variant: options.variant
            }));
            const propertiesThatShouldBeEqual = [
                'code',
                'displayResult',
                'alertResult',
                'parsedErrors',
                'result'
            ];
            const diff = {};
            for (const property of propertiesThatShouldBeEqual) {
                const nativeValue = (0, stringify_1.stringify)(nativeResult[property]);
                const interpretedValue = (0, stringify_1.stringify)(interpretedResult[property]);
                if (nativeValue !== interpretedValue) {
                    diff[property] = `native:${nativeValue}\ninterpreted:${interpretedValue}`;
                }
            }
            if (options.showTranspiledCode) {
                return Object.assign(Object.assign(Object.assign({}, interpretedResult), diff), { pretranspiled, transpiled });
            }
            else {
                return Object.assign(Object.assign({}, interpretedResult), diff);
            }
        }
        else {
            return interpretedResult;
        }
    });
}
function testSuccess(code, options = { native: false }) {
    return __awaiter(this, void 0, void 0, function* () {
        const testResult = yield testInContext(code, options);
        expect(testResult.parsedErrors).toBe('');
        expect(testResult.resultStatus).toBe('finished');
        return testResult;
    });
}
exports.testSuccess = testSuccess;
function testSuccessWithErrors(code, options = { native: false }) {
    return __awaiter(this, void 0, void 0, function* () {
        const testResult = yield testInContext(code, options);
        expect(testResult.numErrors).not.toEqual(0);
        expect(testResult.resultStatus).toBe('finished');
        return testResult;
    });
}
exports.testSuccessWithErrors = testSuccessWithErrors;
function testFailure(code, options = { native: false }) {
    return __awaiter(this, void 0, void 0, function* () {
        const testResult = yield testInContext(code, options);
        expect(testResult.numErrors).not.toEqual(0);
        expect(testResult.resultStatus).toBe('error');
        return testResult;
    });
}
exports.testFailure = testFailure;
function snapshot(arg1, arg2) {
    if (arg2) {
        return testResult => {
            expect(testResult).toMatchSnapshot(arg1, arg2);
            return testResult;
        };
    }
    else if (arg1) {
        return testResult => {
            expect(testResult).toMatchSnapshot(arg1);
            return testResult;
        };
    }
    else {
        return testResult => {
            return testResult;
        };
    }
}
exports.snapshot = snapshot;
function snapshotSuccess(code, options, snapshotName) {
    return testSuccess(code, options).then(snapshot(snapshotName));
}
exports.snapshotSuccess = snapshotSuccess;
function snapshotWarning(code, options, snapshotName) {
    return testSuccessWithErrors(code, options).then(snapshot(snapshotName));
}
exports.snapshotWarning = snapshotWarning;
function snapshotFailure(code, options, snapshotName) {
    return testFailure(code, options).then(snapshot(snapshotName));
}
exports.snapshotFailure = snapshotFailure;
function expectDisplayResult(code, options = {}) {
    return expect(testSuccess(code, options)
        .then(snapshot('expectDisplayResult'))
        .then(testResult => testResult.displayResult)
        .catch(e => console.log(e))).resolves;
}
exports.expectDisplayResult = expectDisplayResult;
function expectVisualiseListResult(code, options = {}) {
    return expect(testSuccess(code, options)
        .then(snapshot('expectVisualiseListResult'))
        .then(testResult => testResult.visualiseListResult)
        .catch(e => console.log(e))).resolves;
}
exports.expectVisualiseListResult = expectVisualiseListResult;
// for use in concurrent testing
function getDisplayResult(code, options = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield testSuccess(code, options).then(testResult => testResult.displayResult);
    });
}
exports.getDisplayResult = getDisplayResult;
function expectResult(code, options = {}) {
    return expect(testSuccess(code, options)
        .then(snapshot('expectResult'))
        .then(testResult => testResult.result)).resolves;
}
exports.expectResult = expectResult;
function expectParsedErrorNoErrorSnapshot(code, options = {}) {
    options.showErrorJSON = false;
    return expect(testFailure(code, options)
        .then(snapshot('expectParsedErrorNoErrorSnapshot'))
        .then(testResult => testResult.parsedErrors)).resolves;
}
exports.expectParsedErrorNoErrorSnapshot = expectParsedErrorNoErrorSnapshot;
function expectParsedError(code, options = {}) {
    return expect(testFailure(code, options)
        .then(snapshot('expectParsedError'))
        .then(testResult => testResult.parsedErrors)).resolves;
}
exports.expectParsedError = expectParsedError;
function expectDifferentParsedErrors(code1, code2, options = {}) {
    return expect(testFailure(code1, options).then(error1 => {
        expect(testFailure(code2, options).then(error2 => {
            return expect(error1).not.toEqual(error2);
        }));
    })).resolves;
}
exports.expectDifferentParsedErrors = expectDifferentParsedErrors;
function expectWarning(code, options = {}) {
    return expect(testSuccessWithErrors(code, options)
        .then(snapshot('expectWarning'))
        .then(testResult => testResult.parsedErrors)).resolves;
}
exports.expectWarning = expectWarning;
function expectParsedErrorNoSnapshot(code, options = {}) {
    return expect(testFailure(code, options).then(testResult => testResult.parsedErrors)).resolves;
}
exports.expectParsedErrorNoSnapshot = expectParsedErrorNoSnapshot;
function evalWithBuiltins(code, testBuiltins = {}) {
    // Ugly, but if you know how to `eval` code with some builtins attached, please change this.
    let evalstring = '';
    for (const key in testBuiltins) {
        if (testBuiltins.hasOwnProperty(key)) {
            evalstring = evalstring + 'const ' + key + ' = testBuiltins.' + key + '; ';
        }
    }
    // tslint:disable-next-line:no-eval
    return eval(evalstring + code);
}
function expectToMatchJS(code, options = {}) {
    return testSuccess(code, options)
        .then(snapshot('expect to match JS'))
        .then(testResult => expect(testResult.result).toEqual(evalWithBuiltins(code, options.testBuiltins)));
}
exports.expectToMatchJS = expectToMatchJS;
function expectToLooselyMatchJS(code, options = {}) {
    return testSuccess(code, options)
        .then(snapshot('expect to loosely match JS'))
        .then(testResult => expect(testResult.result.replace(/ /g, '')).toEqual(evalWithBuiltins(code, options.testBuiltins).replace(/ /g, '')));
}
exports.expectToLooselyMatchJS = expectToLooselyMatchJS;
function expectNativeToTimeoutAndError(code, timeout) {
    return __awaiter(this, void 0, void 0, function* () {
        const start = Date.now();
        const context = (0, context_1.mockContext)(types_1.Chapter.SOURCE_4);
        const promise = (0, index_1.runInContext)(code, context, {
            scheduler: 'preemptive',
            executionMethod: 'native',
            throwInfiniteLoops: false
        });
        yield promise;
        const timeTaken = Date.now() - start;
        expect(timeTaken).toBeLessThan(timeout * 5);
        expect(timeTaken).toBeGreaterThanOrEqual(timeout);
        return (0, index_1.parseError)(context.errors);
    });
}
exports.expectNativeToTimeoutAndError = expectNativeToTimeoutAndError;
//# sourceMappingURL=testing.js.map