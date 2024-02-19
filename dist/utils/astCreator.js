"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.forStatement = exports.whileStatement = exports.ifStatement = exports.variableDeclarator = exports.variableDeclaration = exports.arrowFunctionExpression = exports.blockExpression = exports.functionDeclaration = exports.functionDeclarationExpression = exports.primitive = exports.unaryExpression = exports.binaryExpression = exports.assignmentExpression = exports.arrayExpression = exports.conditionalExpression = exports.mutateToConditionalExpression = exports.logicalExpression = exports.mutateToMemberExpression = exports.mutateToReturnStatement = exports.mutateToExpressionStatement = exports.mutateToAssignmentExpression = exports.mutateToCallExpression = exports.objectExpression = exports.property = exports.returnStatement = exports.program = exports.blockStatement = exports.functionExpression = exports.blockArrowFunction = exports.expressionStatement = exports.callExpression = exports.constantDeclaration = exports.declaration = exports.memberExpression = exports.literal = exports.identifier = exports.locationDummyNode = exports.getVariableDecarationName = void 0;
const getVariableDecarationName = (decl) => decl.declarations[0].id.name;
exports.getVariableDecarationName = getVariableDecarationName;
const locationDummyNode = (line, column, source) => (0, exports.literal)('Dummy', { start: { line, column }, end: { line, column }, source });
exports.locationDummyNode = locationDummyNode;
const identifier = (name, loc) => ({
    type: 'Identifier',
    name,
    loc
});
exports.identifier = identifier;
const literal = (value, loc) => ({
    type: 'Literal',
    value,
    loc
});
exports.literal = literal;
const memberExpression = (object, property) => ({
    type: 'MemberExpression',
    object,
    computed: typeof property === 'number',
    optional: false,
    property: typeof property === 'number' ? (0, exports.literal)(property) : (0, exports.identifier)(property)
});
exports.memberExpression = memberExpression;
const declaration = (name, kind, init, loc) => ({
    type: 'VariableDeclaration',
    declarations: [
        {
            type: 'VariableDeclarator',
            id: (0, exports.identifier)(name),
            init
        }
    ],
    kind,
    loc
});
exports.declaration = declaration;
const constantDeclaration = (name, init, loc) => (0, exports.declaration)(name, 'const', init, loc);
exports.constantDeclaration = constantDeclaration;
const callExpression = (callee, args, loc) => ({
    type: 'CallExpression',
    callee,
    arguments: args,
    optional: false,
    loc
});
exports.callExpression = callExpression;
const expressionStatement = (expression) => ({
    type: 'ExpressionStatement',
    expression
});
exports.expressionStatement = expressionStatement;
const blockArrowFunction = (params, body, loc) => ({
    type: 'ArrowFunctionExpression',
    expression: false,
    generator: false,
    params,
    body: Array.isArray(body) ? (0, exports.blockStatement)(body) : body,
    loc
});
exports.blockArrowFunction = blockArrowFunction;
const functionExpression = (params, body, loc, id) => ({
    type: 'FunctionExpression',
    id: id !== null && id !== void 0 ? id : null,
    async: false,
    generator: false,
    params,
    body: Array.isArray(body) ? (0, exports.blockStatement)(body) : body,
    loc
});
exports.functionExpression = functionExpression;
const blockStatement = (body, loc) => ({
    type: 'BlockStatement',
    body,
    loc
});
exports.blockStatement = blockStatement;
const program = (body) => ({
    type: 'Program',
    sourceType: 'module',
    body
});
exports.program = program;
const returnStatement = (argument, loc) => ({
    type: 'ReturnStatement',
    argument,
    loc
});
exports.returnStatement = returnStatement;
const property = (key, value) => ({
    type: 'Property',
    method: false,
    shorthand: false,
    computed: false,
    key: (0, exports.identifier)(key),
    value,
    kind: 'init'
});
exports.property = property;
const objectExpression = (properties) => ({
    type: 'ObjectExpression',
    properties
});
exports.objectExpression = objectExpression;
const mutateToCallExpression = (node, callee, args) => {
    node.type = 'CallExpression';
    node = node;
    node.callee = callee;
    node.arguments = args;
};
exports.mutateToCallExpression = mutateToCallExpression;
const mutateToAssignmentExpression = (node, left, right) => {
    node.type = 'AssignmentExpression';
    node = node;
    node.operator = '=';
    node.left = left;
    node.right = right;
};
exports.mutateToAssignmentExpression = mutateToAssignmentExpression;
const mutateToExpressionStatement = (node, expr) => {
    node.type = 'ExpressionStatement';
    node = node;
    node.expression = expr;
};
exports.mutateToExpressionStatement = mutateToExpressionStatement;
const mutateToReturnStatement = (node, expr) => {
    node.type = 'ReturnStatement';
    node = node;
    node.argument = expr;
};
exports.mutateToReturnStatement = mutateToReturnStatement;
const mutateToMemberExpression = (node, obj, prop) => {
    node.type = 'MemberExpression';
    node = node;
    node.object = obj;
    node.property = prop;
    node.computed = false;
};
exports.mutateToMemberExpression = mutateToMemberExpression;
const logicalExpression = (operator, left, right, loc) => ({
    type: 'LogicalExpression',
    operator,
    left,
    right,
    loc
});
exports.logicalExpression = logicalExpression;
const mutateToConditionalExpression = (node, test, consequent, alternate) => {
    node.type = 'ConditionalExpression';
    node = node;
    node.test = test;
    node.consequent = consequent;
    node.alternate = alternate;
};
exports.mutateToConditionalExpression = mutateToConditionalExpression;
const conditionalExpression = (test, consequent, alternate, loc) => ({
    type: 'ConditionalExpression',
    test,
    consequent,
    alternate,
    loc
});
exports.conditionalExpression = conditionalExpression;
const arrayExpression = (elements) => ({
    type: 'ArrayExpression',
    elements
});
exports.arrayExpression = arrayExpression;
const assignmentExpression = (left, right, loc) => ({
    type: 'AssignmentExpression',
    operator: '=',
    left,
    right,
    loc
});
exports.assignmentExpression = assignmentExpression;
const binaryExpression = (operator, left, right, loc) => ({
    type: 'BinaryExpression',
    operator,
    left,
    right,
    loc
});
exports.binaryExpression = binaryExpression;
const unaryExpression = (operator, argument, loc) => ({
    type: 'UnaryExpression',
    operator,
    prefix: true,
    argument,
    loc
});
exports.unaryExpression = unaryExpression;
// primitive: undefined is a possible value
const primitive = (value) => {
    return value === undefined ? (0, exports.identifier)('undefined') : (0, exports.literal)(value);
};
exports.primitive = primitive;
const functionDeclarationExpression = (id, params, body, loc) => ({
    type: 'FunctionExpression',
    id,
    params,
    body,
    loc
});
exports.functionDeclarationExpression = functionDeclarationExpression;
const functionDeclaration = (id, params, body, loc) => ({
    type: 'FunctionDeclaration',
    id,
    params,
    body,
    loc
});
exports.functionDeclaration = functionDeclaration;
const blockExpression = (body, loc) => ({
    type: 'BlockExpression',
    body,
    loc
});
exports.blockExpression = blockExpression;
const arrowFunctionExpression = (params, body, loc) => ({
    type: 'ArrowFunctionExpression',
    expression: body.type !== 'BlockStatement',
    generator: false,
    params,
    body,
    loc
});
exports.arrowFunctionExpression = arrowFunctionExpression;
const variableDeclaration = (declarations, loc) => ({
    type: 'VariableDeclaration',
    kind: 'const',
    declarations,
    loc
});
exports.variableDeclaration = variableDeclaration;
const variableDeclarator = (id, init, loc) => ({
    type: 'VariableDeclarator',
    id,
    init,
    loc
});
exports.variableDeclarator = variableDeclarator;
const ifStatement = (test, consequent, alternate, loc) => ({
    type: 'IfStatement',
    test,
    consequent,
    alternate,
    loc
});
exports.ifStatement = ifStatement;
const whileStatement = (body, test, loc) => ({
    type: 'WhileStatement',
    test,
    body,
    loc
});
exports.whileStatement = whileStatement;
const forStatement = (init, test, update, body, loc) => ({
    type: 'ForStatement',
    init,
    test,
    update,
    body,
    loc
});
exports.forStatement = forStatement;
//# sourceMappingURL=astCreator.js.map