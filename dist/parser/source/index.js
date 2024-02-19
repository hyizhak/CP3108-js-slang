"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourceParser = void 0;
const acorn_1 = require("acorn");
const constants_1 = require("../../constants");
const walkers_1 = require("../../utils/walkers");
const errors_1 = require("../errors");
const utils_1 = require("../utils");
const rules_1 = require("./rules");
const syntax_1 = require("./syntax");
const combineAncestorWalkers = (w1, w2) => (node, state, ancestors) => {
    w1(node, state, ancestors);
    w2(node, state, ancestors);
};
const mapToObj = (map) => Array.from(map).reduce((obj, [k, v]) => Object.assign(obj, { [k]: v }), {});
class SourceParser {
    constructor(chapter, variant) {
        this.chapter = chapter;
        this.variant = variant;
    }
    static tokenize(programStr, context) {
        return [
            ...(0, acorn_1.tokenizer)(programStr, (0, utils_1.createAcornParserOptions)(constants_1.DEFAULT_ECMA_VERSION, context.errors))
        ];
    }
    parse(programStr, context, options, throwOnError) {
        try {
            return (0, acorn_1.parse)(programStr, (0, utils_1.createAcornParserOptions)(constants_1.DEFAULT_ECMA_VERSION, context.errors, options));
        }
        catch (error) {
            if (error instanceof SyntaxError) {
                error = new errors_1.FatalSyntaxError((0, utils_1.positionToSourceLocation)(error.loc, options === null || options === void 0 ? void 0 : options.sourceFile), error.toString());
            }
            if (throwOnError)
                throw error;
            context.errors.push(error);
        }
        return null;
    }
    validate(ast, context, throwOnError) {
        const validationWalkers = new Map();
        this.getDisallowedSyntaxes().forEach((syntaxNodeName) => {
            validationWalkers.set(syntaxNodeName, (node, _state, _ancestors) => {
                if (node.type != syntaxNodeName)
                    return;
                const error = new errors_1.DisallowedConstructError(node);
                if (throwOnError)
                    throw error;
                context.errors.push(error);
            });
        });
        this.getLangRules()
            .map(rule => Object.entries(rule.checkers))
            .flat()
            .forEach(([syntaxNodeName, checker]) => {
            const langWalker = (node, _state, ancestors) => {
                const errors = checker(node, ancestors);
                if (throwOnError && errors.length > 0)
                    throw errors[0];
                errors.forEach(e => context.errors.push(e));
            };
            if (validationWalkers.has(syntaxNodeName)) {
                validationWalkers.set(syntaxNodeName, combineAncestorWalkers(validationWalkers.get(syntaxNodeName), langWalker));
            }
            else {
                validationWalkers.set(syntaxNodeName, langWalker);
            }
        });
        (0, walkers_1.ancestor)(ast, mapToObj(validationWalkers), undefined, undefined);
        return context.errors.length == 0;
    }
    toString() {
        return `SourceParser{chapter: ${this.chapter}, variant: ${this.variant}}`;
    }
    getDisallowedSyntaxes() {
        return Object.entries(syntax_1.default).reduce((acc, [nodeName, chapterAllowed]) => this.chapter < chapterAllowed ? [...acc, nodeName] : acc, []);
    }
    getLangRules() {
        return rules_1.default.filter((rule) => !((rule.disableFromChapter && this.chapter >= rule.disableFromChapter) ||
            (rule.disableForVariants && rule.disableForVariants.includes(this.variant))));
    }
}
exports.SourceParser = SourceParser;
//# sourceMappingURL=index.js.map