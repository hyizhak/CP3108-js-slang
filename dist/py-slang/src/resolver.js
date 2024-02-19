"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Resolver = void 0;
const tokenizer_1 = require("./tokenizer");
const tokens_1 = require("./tokens");
const errors_1 = require("./errors");
const levenshtein = require('fast-levenshtein');
class Environment {
    constructor(source, enclosing, names) {
        this.source = source;
        this.enclosing = enclosing;
        this.names = names;
        this.functions = new Set();
        this.moduleBindings = new Set();
    }
    /*
    * Does a full lookup up the environment chain for a name.
    * Returns the distance of the name from the current environment.
    * If name isn't found, return -1.
    * */
    lookupName(identifier) {
        const name = identifier.lexeme;
        let distance = 0;
        let curr = this;
        while (curr !== null) {
            if (curr.names.has(name)) {
                break;
            }
            distance += 1;
            curr = curr.enclosing;
        }
        return (curr === null) ? -1 : distance;
    }
    /* Looks up the name but only for the current environment. */
    lookupNameCurrentEnv(identifier) {
        return this.names.get(identifier.lexeme);
    }
    lookupNameCurrentEnvWithError(identifier) {
        if (this.lookupName(identifier) < 0) {
            throw new errors_1.ResolverErrors.NameNotFoundError(identifier.line, identifier.col, this.source, identifier.indexInSource, identifier.indexInSource + identifier.lexeme.length, this.suggestName(identifier));
        }
    }
    lookupNameParentEnvWithError(identifier) {
        const name = identifier.lexeme;
        let parent = this.enclosing;
        if (parent === null || !parent.names.has(name)) {
            throw new errors_1.ResolverErrors.NameNotFoundError(identifier.line, identifier.col, this.source, identifier.indexInSource, identifier.indexInSource + name.length, this.suggestName(identifier));
        }
    }
    declareName(identifier) {
        const lookup = this.lookupNameCurrentEnv(identifier);
        if (lookup !== undefined) {
            throw new errors_1.ResolverErrors.NameReassignmentError(identifier.line, identifier.col, this.source, identifier.indexInSource, identifier.indexInSource + identifier.lexeme.length, lookup);
        }
        this.names.set(identifier.lexeme, identifier);
    }
    suggestNameCurrentEnv(identifier) {
        const name = identifier.lexeme;
        let minDistance = Infinity;
        let minName = null;
        for (const declName of this.names.keys()) {
            const dist = levenshtein.get(name, declName);
            if (dist < minDistance) {
                minDistance = dist;
                minName = declName;
            }
        }
        return minName;
    }
    /*
    * Finds name closest to name in all environments up to builtin environment.
    * Calculated using min levenshtein distance.
    * */
    suggestName(identifier) {
        const name = identifier.lexeme;
        let minDistance = Infinity;
        let minName = null;
        let curr = this;
        while (curr !== null) {
            for (const declName of curr.names.keys()) {
                const dist = levenshtein.get(name, declName);
                if (dist < minDistance) {
                    minDistance = dist;
                    minName = declName;
                }
            }
            curr = curr.enclosing;
        }
        if (minDistance >= 4) {
            // This is pretty far, so just return null
            return null;
        }
        return minName;
    }
}
class Resolver {
    constructor(source, ast) {
        this.source = source;
        this.ast = ast;
        // The global environment
        this.environment = new Environment(source, null, new Map([
            ["range", new tokenizer_1.Token(tokens_1.TokenType.NAME, "range", 0, 0, 0)],
            ["display", new tokenizer_1.Token(tokens_1.TokenType.NAME, "display", 0, 0, 0)],
            ["stringify", new tokenizer_1.Token(tokens_1.TokenType.NAME, "stringify", 0, 0, 0)],
            // @TODO add all the source pre-declared names here
        ]));
    }
    resolve(stmt) {
        if (stmt === null) {
            return;
        }
        if (stmt instanceof Array) {
            for (const st of stmt) {
                st.accept(this);
            }
        }
        else {
            stmt.accept(this);
        }
    }
    varDeclNames(names) {
        const res = Array.from(names.values())
            .filter(name => {
            var _a, _b;
            return (
            // Filter out functions and module bindings.
            // Those will be handled separately, so they don't
            // need to be hoisted.
            !((_a = this.environment) === null || _a === void 0 ? void 0 : _a.functions.has(name.lexeme))
                && !((_b = this.environment) === null || _b === void 0 ? void 0 : _b.moduleBindings.has(name.lexeme)));
        });
        return res.length === 0 ? null : res;
    }
    //// STATEMENTS
    visitFileInputStmt(stmt) {
        // Create a new environment.
        const oldEnv = this.environment;
        this.environment = new Environment(this.source, this.environment, new Map());
        this.resolve(stmt.statements);
        // Grab identifiers from that new environment. That are NOT functions.
        // stmt.varDecls = this.varDeclNames(this.environment.names)
        this.environment = oldEnv;
    }
    visitFunctionDefStmt(stmt) {
        var _a, _b;
        (_a = this.environment) === null || _a === void 0 ? void 0 : _a.declareName(stmt.name);
        (_b = this.environment) === null || _b === void 0 ? void 0 : _b.functions.add(stmt.name.lexeme);
        // Create a new environment.
        const oldEnv = this.environment;
        // Assign the parameters to the new environment.
        const newEnv = new Map(stmt.parameters.map(param => [param.lexeme, param]));
        this.environment = new Environment(this.source, this.environment, newEnv);
        this.resolve(stmt.body);
        // Grab identifiers from that new environment. That are NOT functions.
        // stmt.varDecls = this.varDeclNames(this.environment.names)
        // Restore old environment
        this.environment = oldEnv;
    }
    visitAnnAssignStmt(stmt) {
        var _a;
        this.resolve(stmt.ann);
        this.resolve(stmt.value);
        (_a = this.environment) === null || _a === void 0 ? void 0 : _a.declareName(stmt.name);
    }
    visitAssignStmt(stmt) {
        var _a;
        this.resolve(stmt.value);
        (_a = this.environment) === null || _a === void 0 ? void 0 : _a.declareName(stmt.name);
    }
    visitAssertStmt(stmt) {
        this.resolve(stmt.value);
    }
    visitForStmt(stmt) {
        var _a;
        (_a = this.environment) === null || _a === void 0 ? void 0 : _a.declareName(stmt.target);
        this.resolve(stmt.iter);
        this.resolve(stmt.body);
    }
    visitIfStmt(stmt) {
        this.resolve(stmt.condition);
        this.resolve(stmt.body);
        // if (stmt.elseBlock === null) {
        //     throw new Error("Error: 'if' statement without 'else' block is not allowed.");
        // }
        this.resolve(stmt.elseBlock);
    }
    // @TODO we need to treat all global statements as variable declarations in the global
    // scope.
    visitGlobalStmt(stmt) {
        // Do nothing because global can also be declared in our
        // own scope.
    }
    // @TODO nonlocals mean that any variable following that name in the current env
    // should not create a variable declaration, but instead point to an outer variable.
    visitNonLocalStmt(stmt) {
        var _a;
        (_a = this.environment) === null || _a === void 0 ? void 0 : _a.lookupNameParentEnvWithError(stmt.name);
    }
    visitReturnStmt(stmt) {
        if (stmt.value !== null) {
            this.resolve(stmt.value);
        }
    }
    visitWhileStmt(stmt) {
        this.resolve(stmt.condition);
        this.resolve(stmt.body);
    }
    visitSimpleExprStmt(stmt) {
        this.resolve(stmt.expression);
    }
    visitFromImportStmt(stmt) {
        var _a, _b;
        for (const name of stmt.names) {
            (_a = this.environment) === null || _a === void 0 ? void 0 : _a.declareName(name);
            (_b = this.environment) === null || _b === void 0 ? void 0 : _b.moduleBindings.add(name.lexeme);
        }
    }
    visitContinueStmt(stmt) {
    }
    visitBreakStmt(stmt) {
    }
    visitPassStmt(stmt) {
    }
    //// EXPRESSIONS
    visitVariableExpr(expr) {
        var _a;
        (_a = this.environment) === null || _a === void 0 ? void 0 : _a.lookupNameCurrentEnvWithError(expr.name);
    }
    visitLambdaExpr(expr) {
        // Create a new environment.
        const oldEnv = this.environment;
        // Assign the parameters to the new environment.
        const newEnv = new Map(expr.parameters.map(param => [param.lexeme, param]));
        this.environment = new Environment(this.source, this.environment, newEnv);
        this.resolve(expr.body);
        // Restore old environment
        this.environment = oldEnv;
    }
    visitMultiLambdaExpr(expr) {
        // Create a new environment.
        const oldEnv = this.environment;
        // Assign the parameters to the new environment.
        const newEnv = new Map(expr.parameters.map(param => [param.lexeme, param]));
        this.environment = new Environment(this.source, this.environment, newEnv);
        this.resolve(expr.body);
        // Grab identifiers from that new environment.
        expr.varDecls = Array.from(this.environment.names.values());
        // Restore old environment
        this.environment = oldEnv;
    }
    visitUnaryExpr(expr) {
        this.resolve(expr.right);
    }
    visitGroupingExpr(expr) {
        this.resolve(expr.expression);
    }
    visitBinaryExpr(expr) {
        this.resolve(expr.left);
        this.resolve(expr.right);
    }
    visitBoolOpExpr(expr) {
        this.resolve(expr.left);
        this.resolve(expr.right);
    }
    visitCompareExpr(expr) {
        this.resolve(expr.left);
        this.resolve(expr.right);
    }
    visitCallExpr(expr) {
        this.resolve(expr.callee);
        this.resolve(expr.args);
    }
    visitTernaryExpr(expr) {
        this.resolve(expr.predicate);
        this.resolve(expr.consequent);
        this.resolve(expr.alternative);
    }
    visitLiteralExpr(expr) {
    }
}
exports.Resolver = Resolver;
//# sourceMappingURL=resolver.js.map