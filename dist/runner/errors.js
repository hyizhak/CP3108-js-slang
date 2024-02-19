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
exports.toSourceError = void 0;
const source_map_1 = require("source-map");
const constants_1 = require("../constants");
const errors_1 = require("../errors/errors");
const astCreator_1 = require("../utils/astCreator");
var BrowserType;
(function (BrowserType) {
    BrowserType["Chrome"] = "Chrome";
    BrowserType["FireFox"] = "FireFox";
    BrowserType["Unsupported"] = "Unsupported";
})(BrowserType || (BrowserType = {}));
const ChromeEvalErrorLocator = {
    regex: /eval at.+<anonymous>:(\d+):(\d+)/gm,
    browser: BrowserType.Chrome
};
const FireFoxEvalErrorLocator = {
    regex: /eval:(\d+):(\d+)/gm,
    browser: BrowserType.FireFox
};
const EVAL_LOCATORS = [ChromeEvalErrorLocator, FireFoxEvalErrorLocator];
const UNDEFINED_VARIABLE_MESSAGES = ['is not defined'];
// brute-forced from MDN website for phrasing of errors from different browsers
// FWIW node and chrome uses V8 so they'll have the same error messages
// unable to test on other engines
const ASSIGNMENT_TO_CONST_ERROR_MESSAGES = [
    'invalid assignment to const',
    'Assignment to constant variable',
    'Assignment to const',
    'Redeclaration of const'
];
function getBrowserType() {
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.indexOf('chrome') > -1
        ? BrowserType.Chrome
        : userAgent.indexOf('firefox') > -1
            ? BrowserType.FireFox
            : BrowserType.Unsupported;
}
function extractErrorLocation(errorStack, lineOffset, errorLocator) {
    const evalErrors = Array.from(errorStack.matchAll(errorLocator.regex));
    if (evalErrors.length) {
        const baseEvalError = evalErrors[0];
        const [lineNumStr, colNumStr] = baseEvalError.slice(1, 3);
        return { line: parseInt(lineNumStr) - lineOffset, column: parseInt(colNumStr) };
    }
    return undefined;
}
function getErrorLocation(error, lineOffset = 0) {
    const browser = getBrowserType();
    const errorLocator = EVAL_LOCATORS.find(locator => locator.browser === browser);
    const errorStack = error.stack;
    if (errorStack && errorLocator) {
        return extractErrorLocation(errorStack, lineOffset, errorLocator);
    }
    else if (errorStack) {
        // if browser is unsupported try all supported locators until the first success
        return EVAL_LOCATORS.map(locator => extractErrorLocation(errorStack, lineOffset, locator)).find(x => x !== undefined);
    }
    return undefined;
}
/**
 * Converts native errors to SourceError
 *
 * @param error
 * @param sourceMap
 * @returns
 */
function toSourceError(error, sourceMap) {
    var _a, _b, _c, _d;
    return __awaiter(this, void 0, void 0, function* () {
        const errorLocation = getErrorLocation(error);
        if (!errorLocation) {
            return new errors_1.ExceptionError(error, constants_1.UNKNOWN_LOCATION);
        }
        let { line, column } = errorLocation;
        let identifier = 'UNKNOWN';
        let source = null;
        if (sourceMap && !(line === -1 || column === -1)) {
            // Get original lines, column and identifier
            const originalPosition = yield source_map_1.SourceMapConsumer.with(sourceMap, null, consumer => consumer.originalPositionFor({ line, column }));
            line = (_a = originalPosition.line) !== null && _a !== void 0 ? _a : -1; // use -1 in place of null
            column = (_b = originalPosition.column) !== null && _b !== void 0 ? _b : -1;
            identifier = (_c = originalPosition.name) !== null && _c !== void 0 ? _c : identifier;
            source = (_d = originalPosition.source) !== null && _d !== void 0 ? _d : null;
        }
        const errorMessage = error.message;
        const errorMessageContains = (possibleMessages) => possibleMessages.some(possibleMessage => errorMessage.includes(possibleMessage));
        if (errorMessageContains(ASSIGNMENT_TO_CONST_ERROR_MESSAGES)) {
            return new errors_1.ConstAssignment((0, astCreator_1.locationDummyNode)(line, column, source), identifier);
        }
        else if (errorMessageContains(UNDEFINED_VARIABLE_MESSAGES)) {
            return new errors_1.UndefinedVariable(identifier, (0, astCreator_1.locationDummyNode)(line, column, source));
        }
        else {
            const location = line === -1 || column === -1
                ? constants_1.UNKNOWN_LOCATION
                : {
                    start: { line, column },
                    end: { line: -1, column: -1 }
                };
            return new errors_1.ExceptionError(error, location);
        }
    });
}
exports.toSourceError = toSourceError;
//# sourceMappingURL=errors.js.map