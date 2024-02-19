"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dummyVariableDeclarator = exports.dummyBlockExpression = exports.dummyFunctionDeclaration = exports.dummyFunctionExpression = exports.dummyPrimitive = exports.dummyUnaryExpression = exports.dummyBinaryExpression = exports.dummyArrayExpression = exports.dummyConditionalExpression = exports.dummyLogicalExpression = exports.dummyReturnStatement = exports.dummyProgram = exports.dummyArrowFunctionExpression = exports.dummyBlockStatement = exports.dummyStatement = exports.dummyExpressionStatement = exports.dummyCallExpression = exports.dummyExpression = exports.dummyLiteral = exports.dummyIdentifier = exports.dummyLocation = void 0;
const DUMMY_STRING = '__DUMMY__';
const DUMMY_UNARY_OPERATOR = '!';
const DUMMY_LOGICAL_OPERATOR = '||';
const DUMMY_BINARY_OPERATOR = '+';
const dummyLocation = () => ({
    start: { line: -1, column: -1 },
    end: { line: -1, column: -1 }
});
exports.dummyLocation = dummyLocation;
const dummyIdentifier = () => ({
    type: 'Identifier',
    name: DUMMY_STRING
});
exports.dummyIdentifier = dummyIdentifier;
const dummyLiteral = () => ({
    type: 'Literal',
    value: DUMMY_STRING,
    loc: (0, exports.dummyLocation)()
});
exports.dummyLiteral = dummyLiteral;
const dummyExpression = () => (0, exports.dummyLiteral)();
exports.dummyExpression = dummyExpression;
const dummyCallExpression = () => ({
    type: 'CallExpression',
    callee: (0, exports.dummyExpression)(),
    arguments: [],
    loc: (0, exports.dummyLocation)(),
    optional: false
});
exports.dummyCallExpression = dummyCallExpression;
const dummyExpressionStatement = () => ({
    type: 'ExpressionStatement',
    expression: (0, exports.dummyExpression)(),
    loc: (0, exports.dummyLocation)()
});
exports.dummyExpressionStatement = dummyExpressionStatement;
const dummyStatement = () => (0, exports.dummyExpressionStatement)();
exports.dummyStatement = dummyStatement;
const dummyBlockStatement = () => ({
    type: 'BlockStatement',
    body: [],
    loc: (0, exports.dummyLocation)()
});
exports.dummyBlockStatement = dummyBlockStatement;
const dummyArrowFunctionExpression = () => ({
    type: 'ArrowFunctionExpression',
    expression: false,
    generator: false,
    params: [],
    body: (0, exports.dummyBlockStatement)(),
    loc: (0, exports.dummyLocation)()
});
exports.dummyArrowFunctionExpression = dummyArrowFunctionExpression;
const dummyProgram = () => ({
    type: 'Program',
    body: [],
    loc: (0, exports.dummyLocation)(),
    sourceType: 'module'
});
exports.dummyProgram = dummyProgram;
const dummyReturnStatement = () => ({
    type: 'ReturnStatement',
    argument: (0, exports.dummyExpression)(),
    loc: (0, exports.dummyLocation)()
});
exports.dummyReturnStatement = dummyReturnStatement;
/*
export const property = (): es.Property => ({
  type: 'Property',
  method: false,
  shorthand: false,
  computed: false,
  key: dummyIdentifier(),
  value: dummyExpression(),
  kind: 'init'
})

export const objectExpression = (properties: es.Property[]): es.ObjectExpression => ({
  type: 'ObjectExpression',
  properties
})

export const mutateToCallExpression = (
  node: es.Node,
  callee: es.Expression,
  args: es.Expression[]
) => {
  node.type = 'CallExpression'
  node = node as es.CallExpression
  node.callee = callee
  node.arguments = args
}
*/
const dummyLogicalExpression = () => ({
    type: 'LogicalExpression',
    operator: DUMMY_LOGICAL_OPERATOR,
    left: (0, exports.dummyExpression)(),
    right: (0, exports.dummyExpression)(),
    loc: (0, exports.dummyLocation)()
});
exports.dummyLogicalExpression = dummyLogicalExpression;
const dummyConditionalExpression = () => ({
    type: 'ConditionalExpression',
    test: (0, exports.dummyExpression)(),
    consequent: (0, exports.dummyExpression)(),
    alternate: (0, exports.dummyExpression)(),
    loc: (0, exports.dummyLocation)()
});
exports.dummyConditionalExpression = dummyConditionalExpression;
const dummyArrayExpression = () => ({
    type: 'ArrayExpression',
    elements: []
});
exports.dummyArrayExpression = dummyArrayExpression;
const dummyBinaryExpression = () => ({
    type: 'BinaryExpression',
    operator: DUMMY_BINARY_OPERATOR,
    left: (0, exports.dummyExpression)(),
    right: (0, exports.dummyExpression)(),
    loc: (0, exports.dummyLocation)()
});
exports.dummyBinaryExpression = dummyBinaryExpression;
const dummyUnaryExpression = () => ({
    type: 'UnaryExpression',
    operator: DUMMY_UNARY_OPERATOR,
    prefix: true,
    argument: (0, exports.dummyExpression)(),
    loc: (0, exports.dummyLocation)()
});
exports.dummyUnaryExpression = dummyUnaryExpression;
// primitive: undefined is a possible value
const dummyPrimitive = () => (0, exports.dummyLiteral)();
exports.dummyPrimitive = dummyPrimitive;
const dummyFunctionExpression = () => ({
    type: 'FunctionExpression',
    id: (0, exports.dummyIdentifier)(),
    params: [],
    body: (0, exports.dummyBlockStatement)(),
    loc: (0, exports.dummyLocation)()
});
exports.dummyFunctionExpression = dummyFunctionExpression;
const dummyFunctionDeclaration = () => ({
    type: 'FunctionDeclaration',
    id: (0, exports.dummyIdentifier)(),
    params: [],
    body: (0, exports.dummyBlockStatement)(),
    loc: (0, exports.dummyLocation)()
});
exports.dummyFunctionDeclaration = dummyFunctionDeclaration;
const dummyBlockExpression = () => ({
    type: 'BlockExpression',
    body: [],
    loc: (0, exports.dummyLocation)()
});
exports.dummyBlockExpression = dummyBlockExpression;
const dummyVariableDeclarator = () => ({
    type: 'VariableDeclarator',
    id: (0, exports.dummyIdentifier)(),
    init: (0, exports.dummyExpression)(),
    loc: (0, exports.dummyLocation)()
});
exports.dummyVariableDeclarator = dummyVariableDeclarator;
//# sourceMappingURL=dummyAstCreator.js.map