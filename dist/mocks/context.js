"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockEnvironment = exports.mockClosure = exports.mockRuntimeContext = exports.mockImportDeclaration = exports.mockContext = void 0;
const createContext_1 = require("../createContext");
const closure_1 = require("../interpreter/closure");
const interpreter_1 = require("../interpreter/interpreter");
const types_1 = require("../types");
function mockContext(chapter = types_1.Chapter.SOURCE_1, variant = types_1.Variant.DEFAULT) {
    return (0, createContext_1.default)(chapter, variant);
}
exports.mockContext = mockContext;
function mockImportDeclaration() {
    const mockImportDecl = {
        type: 'ImportDeclaration',
        specifiers: [
            {
                type: 'ImportDefaultSpecifier',
                local: {
                    type: 'Identifier',
                    name: 'MockName'
                }
            }
        ],
        source: {
            type: 'Literal',
            value: 'mock-path',
            raw: "'mock-path'"
        }
    };
    return mockImportDecl;
}
exports.mockImportDeclaration = mockImportDeclaration;
function mockRuntimeContext() {
    const context = (0, createContext_1.default)();
    context.runtime = {
        break: false,
        debuggerOn: true,
        isRunning: true,
        environmentTree: new createContext_1.EnvTree(),
        environments: [],
        nodes: [
            {
                type: 'Literal',
                loc: {
                    start: { line: 1, column: 0 },
                    end: { line: 1, column: 1 }
                },
                value: 0,
                raw: '0',
                range: [0, 1]
            }
        ],
        agenda: null,
        stash: null,
        envStepsTotal: 0,
        breakpointSteps: []
    };
    return context;
}
exports.mockRuntimeContext = mockRuntimeContext;
function mockClosure() {
    return new closure_1.default({
        type: 'FunctionExpression',
        loc: null,
        id: null,
        params: [],
        body: {
            type: 'BlockStatement',
            body: []
        }
    }, {}, {});
}
exports.mockClosure = mockClosure;
function mockEnvironment(context, name = 'blockEnvironment', head = {}) {
    return (0, interpreter_1.createBlockEnvironment)(context, name, head);
}
exports.mockEnvironment = mockEnvironment;
//# sourceMappingURL=context.js.map