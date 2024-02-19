"use strict";
/*
* Translate our AST to estree AST (Source's AST)
* */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Translator = void 0;
const tokens_1 = require("./tokens");
const errors_1 = require("./errors");
class Translator {
    constructor(source) {
        this.source = source;
    }
    tokenToEstreeLocation(token) {
        // Convert zero-based to one-based.
        const line = token.line + 1;
        const start = {
            line,
            column: token.col - token.lexeme.length
        };
        const end = {
            line,
            column: token.col
        };
        const source = token.lexeme;
        return { source, start, end };
    }
    toEstreeLocation(stmt) {
        const start = {
            // Convert zero-based to one-based.
            line: stmt.startToken.line + 1,
            column: stmt.startToken.col - stmt.startToken.lexeme.length
        };
        const end = {
            // Convert zero-based to one-based.
            line: stmt.endToken.line + 1,
            column: stmt.endToken.col
        };
        const source = this.source.slice(stmt.startToken.indexInSource, stmt.endToken.indexInSource + stmt.endToken.lexeme.length);
        return { source, start, end };
    }
    resolve(stmt) {
        return stmt.accept(this);
    }
    // Ugly, but just to support proper typing
    resolveStmt(stmt) {
        return stmt.accept(this);
    }
    resolveManyStmt(stmts) {
        const res = [];
        for (const stmt of stmts) {
            res.push(this.resolveStmt(stmt));
        }
        return res;
    }
    resolveExpr(expr) {
        return expr.accept(this);
    }
    resolveManyExpr(exprs) {
        const res = [];
        for (const expr of exprs) {
            res.push(this.resolveExpr(expr));
        }
        return res;
    }
    // Converts our internal identifier to estree identifier.
    rawStringToIdentifier(name, stmtOrExpr) {
        return {
            type: 'Identifier',
            name: name,
            loc: this.toEstreeLocation(stmtOrExpr),
        };
    }
    // Token to estree identifier.
    convertToIdentifier(name) {
        return {
            type: 'Identifier',
            name: name.lexeme,
            loc: this.tokenToEstreeLocation(name),
        };
    }
    convertToIdentifiers(names) {
        return names.map(name => this.convertToIdentifier(name));
    }
    // private convertToExpressionStatement(expr: Expression): ExpressionStatement {
    //     return {
    //         type: 'ExpressionStatement',
    //         expression: expr,
    //         // loc: this.toEstreeLocation(),
    //     }
    // }
    // private converTokenstoDecls(varDecls: Token[]): VariableDeclaration {
    //     return {
    //         type: 'VariableDeclaration',
    //         declarations: varDecls?.map((token): VariableDeclarator => {
    //             return {
    //                 type: 'VariableDeclarator',
    //                 id: this.convertToIdentifier(token),
    //                 loc: this.tokenToEstreeLocation(token),
    //             }
    //         }),
    //         kind: 'var',
    //         loc: this.toEstreeLocation(),
    //     };
    // }
    // Wraps an array of statements to a block.
    // WARNING: THIS CREATES A NEW BLOCK IN
    // JS AST. THIS ALSO MEANS A NEW NAMESPACE. BE CAREFUL!
    wrapInBlock(stmt, stmts) {
        return {
            type: 'BlockStatement',
            body: this.resolveManyStmt(stmts),
            loc: this.toEstreeLocation(stmt),
        };
    }
    //// STATEMENTS
    visitFileInputStmt(stmt) {
        const newBody = this.resolveManyStmt(stmt.statements);
        // if (stmt.varDecls !== null && stmt.varDecls.length > 0) {
        //     const decls = this.converTokenstoDecls(stmt.varDecls);
        //     newBody.unshift(decls);
        // }
        return {
            type: 'Program',
            sourceType: 'module',
            body: newBody,
            loc: this.toEstreeLocation(stmt),
        };
    }
    visitFunctionDefStmt(stmt) {
        const newBody = this.resolveManyStmt(stmt.body);
        // if (stmt.varDecls !== null && stmt.varDecls.length > 0) {
        //     const decls = this.converTokenstoDecls(stmt.varDecls);
        //     newBody.unshift(decls);
        // }
        return {
            type: 'FunctionDeclaration',
            id: this.convertToIdentifier(stmt.name),
            params: this.convertToIdentifiers(stmt.parameters),
            body: {
                type: 'BlockStatement',
                body: newBody,
            },
            loc: this.toEstreeLocation(stmt),
        };
    }
    visitAnnAssignStmt(stmt) {
        return {
            type: 'AssignmentExpression',
            // We only have one type of assignment in restricted Python.
            operator: '=',
            left: this.convertToIdentifier(stmt.name),
            right: this.resolveExpr(stmt.value),
            loc: this.toEstreeLocation(stmt),
        };
    }
    // Note: assignments are expressions in JS.
    visitAssignStmt(stmt) {
        // return this.convertToExpressionStatement({
        //     type: 'AssignmentExpression',
        //     // We only have one type of assignment in restricted Python.
        //     operator: '=',
        //     left: this.convertToIdentifier(stmt.name),
        //     right: this.resolveExpr(stmt.value),
        //     loc: this.toEstreeLocation(stmt),
        // })
        const declaration = {
            type: 'VariableDeclarator',
            id: this.convertToIdentifier(stmt.name),
            loc: this.tokenToEstreeLocation(stmt.name),
            init: this.resolveExpr(stmt.value),
        };
        return {
            type: 'VariableDeclaration',
            declarations: [declaration],
            // Note: we abuse the fact that var is function and module scoped
            // which is exactly the same as how Python assignments are scoped!
            kind: 'var',
            loc: this.toEstreeLocation(stmt),
        };
    }
    // Convert to source's built-in assert function.
    visitAssertStmt(stmt) {
        return {
            type: 'CallExpression',
            optional: false,
            callee: this.rawStringToIdentifier('assert', stmt),
            arguments: [this.resolveExpr(stmt.value)],
            // @TODO, this needs to come after callee
            loc: this.toEstreeLocation(stmt),
        };
    }
    // @TODO decide how to do for loops
    // For now, empty block
    visitForStmt(stmt) {
        return {
            type: 'EmptyStatement',
            loc: this.toEstreeLocation(stmt),
        };
    }
    visitIfStmt(stmt) {
        return {
            type: 'IfStatement',
            test: this.resolveExpr(stmt.condition),
            consequent: this.wrapInBlock(stmt, stmt.body),
            alternate: stmt.elseBlock !== null ? this.wrapInBlock(stmt, stmt.elseBlock) : null,
            loc: this.toEstreeLocation(stmt),
        };
    }
    visitGlobalStmt(stmt) {
        return {
            type: 'EmptyStatement',
            loc: this.toEstreeLocation(stmt),
        };
    }
    visitNonLocalStmt(stmt) {
        return {
            type: 'EmptyStatement',
            loc: this.toEstreeLocation(stmt),
        };
    }
    visitReturnStmt(stmt) {
        return {
            type: 'ReturnStatement',
            argument: stmt.value == null ? null : this.resolveExpr(stmt.value),
            loc: this.toEstreeLocation(stmt),
        };
    }
    visitWhileStmt(stmt) {
        return {
            type: 'WhileStatement',
            test: this.resolveExpr(stmt.condition),
            body: this.wrapInBlock(stmt, stmt.body),
            loc: this.toEstreeLocation(stmt),
        };
    }
    visitSimpleExprStmt(stmt) {
        return {
            type: 'ExpressionStatement',
            expression: this.resolveExpr(stmt.expression),
            loc: this.toEstreeLocation(stmt),
        };
    }
    // @TODO
    visitFromImportStmt(stmt) {
        const specifiers = stmt.names.map(name => {
            const ident = this.convertToIdentifier(name);
            return {
                type: 'ImportSpecifier',
                imported: ident,
                local: ident,
            };
        });
        return {
            type: 'ImportDeclaration',
            specifiers: specifiers,
            source: {
                type: 'Literal',
                value: stmt.module.lexeme,
                loc: this.tokenToEstreeLocation(stmt.module)
            }
        };
    }
    visitContinueStmt(stmt) {
        return {
            type: 'ContinueStatement',
            loc: this.toEstreeLocation(stmt),
        };
    }
    visitBreakStmt(stmt) {
        return {
            type: 'BreakStatement',
            loc: this.toEstreeLocation(stmt),
        };
    }
    visitPassStmt(stmt) {
        return {
            type: 'EmptyStatement',
            loc: this.toEstreeLocation(stmt),
        };
    }
    //// EXPRESSIONS
    visitVariableExpr(expr) {
        return this.convertToIdentifier(expr.name);
    }
    visitLambdaExpr(expr) {
        return {
            type: 'ArrowFunctionExpression',
            expression: true,
            params: this.convertToIdentifiers(expr.parameters),
            body: this.resolveExpr(expr.body),
            loc: this.toEstreeLocation(expr),
        };
    }
    // disabled for now
    visitMultiLambdaExpr(expr) {
        return {
            type: 'EmptyStatement',
            loc: this.toEstreeLocation(expr),
        };
    }
    visitUnaryExpr(expr) {
        const op = expr.operator.type;
        let res = '-';
        switch (op) {
            case tokens_1.TokenType.NOT:
                res = '!';
                break;
            case tokens_1.TokenType.PLUS:
                res = '+';
                break;
            case tokens_1.TokenType.MINUS:
                res = '-';
                break;
            default:
                throw new Error("Unreachable code path in translator");
        }
        return {
            type: 'UnaryExpression',
            // To satisfy the type checker.
            operator: res,
            prefix: true,
            argument: this.resolveExpr(expr.right),
            loc: this.toEstreeLocation(expr),
        };
    }
    visitGroupingExpr(expr) {
        return this.resolveExpr(expr.expression);
    }
    visitBinaryExpr(expr) {
        const op = expr.operator.type;
        let res = '+';
        // To make the type checker happy.
        switch (op) {
            case tokens_1.TokenType.PLUS:
                res = '+';
                break;
            case tokens_1.TokenType.MINUS:
                res = '-';
                break;
            case tokens_1.TokenType.STAR:
                res = '*';
                break;
            case tokens_1.TokenType.SLASH:
                res = '/';
                break;
            case tokens_1.TokenType.PERCENT:
                res = '%';
                break;
            // @TODO double slash and power needs to convert to math exponent/floor divide
            case tokens_1.TokenType.DOUBLESLASH:
            case tokens_1.TokenType.DOUBLESTAR:
                throw new errors_1.TranslatorErrors.UnsupportedOperator(expr.operator.line, expr.operator.col, this.source, expr.operator.indexInSource);
            default:
                throw new Error("Unreachable binary code path in translator");
        }
        return {
            type: 'BinaryExpression',
            operator: res,
            left: this.resolveExpr(expr.left),
            right: this.resolveExpr(expr.right),
            loc: this.toEstreeLocation(expr),
        };
    }
    visitCompareExpr(expr) {
        const op = expr.operator.type;
        let res = '+';
        // To make the type checker happy.
        switch (op) {
            case tokens_1.TokenType.LESS:
                res = '<';
                break;
            case tokens_1.TokenType.GREATER:
                res = '>';
                break;
            case tokens_1.TokenType.DOUBLEEQUAL:
                res = '===';
                break;
            case tokens_1.TokenType.GREATEREQUAL:
                res = '>=';
                break;
            case tokens_1.TokenType.LESSEQUAL:
                res = '<=';
                break;
            case tokens_1.TokenType.NOTEQUAL:
                res = '!==';
                break;
            // @TODO we need to convert these to builtin function applications.
            case tokens_1.TokenType.IS:
            case tokens_1.TokenType.ISNOT:
            case tokens_1.TokenType.IN:
            case tokens_1.TokenType.NOTIN:
                throw new errors_1.TranslatorErrors.UnsupportedOperator(expr.operator.line, expr.operator.col, this.source, expr.operator.indexInSource);
            default:
                throw new Error("Unreachable binary code path in translator");
        }
        return {
            type: 'BinaryExpression',
            operator: res,
            left: this.resolveExpr(expr.left),
            right: this.resolveExpr(expr.right),
            loc: this.toEstreeLocation(expr),
        };
    }
    visitBoolOpExpr(expr) {
        const op = expr.operator.type;
        let res = '||';
        // To make the type checker happy.
        switch (op) {
            case tokens_1.TokenType.AND:
                res = '&&';
                break;
            case tokens_1.TokenType.OR:
                res = '||';
                break;
            default:
                throw new Error("Unreachable binary code path in translator");
        }
        return {
            type: 'LogicalExpression',
            operator: res,
            left: this.resolveExpr(expr.left),
            right: this.resolveExpr(expr.right),
            loc: this.toEstreeLocation(expr),
        };
    }
    visitCallExpr(expr) {
        return {
            type: 'CallExpression',
            optional: false,
            callee: this.resolveExpr(expr.callee),
            arguments: this.resolveManyExpr(expr.args),
            loc: this.toEstreeLocation(expr),
        };
    }
    visitTernaryExpr(expr) {
        return {
            type: 'ConditionalExpression',
            test: this.resolveExpr(expr.predicate),
            alternate: this.resolveExpr(expr.alternative),
            consequent: this.resolveExpr(expr.consequent),
            loc: this.toEstreeLocation(expr),
        };
    }
    visitLiteralExpr(expr) {
        return {
            type: 'Literal',
            value: expr.value,
            loc: this.toEstreeLocation(expr),
        };
    }
}
exports.Translator = Translator;
//# sourceMappingURL=translator.js.map