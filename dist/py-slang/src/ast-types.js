"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StmtNS = exports.ExprNS = void 0;
var ExprNS;
(function (ExprNS) {
    class Expr {
        constructor(startToken, endToken) {
            this.startToken = startToken;
            this.endToken = endToken;
        }
    }
    ExprNS.Expr = Expr;
    class Binary extends Expr {
        constructor(startToken, endToken, left, operator, right) {
            super(startToken, endToken);
            this.left = left;
            this.operator = operator;
            this.right = right;
        }
        accept(visitor) {
            return visitor.visitBinaryExpr(this);
        }
    }
    ExprNS.Binary = Binary;
    class Compare extends Expr {
        constructor(startToken, endToken, left, operator, right) {
            super(startToken, endToken);
            this.left = left;
            this.operator = operator;
            this.right = right;
        }
        accept(visitor) {
            return visitor.visitCompareExpr(this);
        }
    }
    ExprNS.Compare = Compare;
    class BoolOp extends Expr {
        constructor(startToken, endToken, left, operator, right) {
            super(startToken, endToken);
            this.left = left;
            this.operator = operator;
            this.right = right;
        }
        accept(visitor) {
            return visitor.visitBoolOpExpr(this);
        }
    }
    ExprNS.BoolOp = BoolOp;
    class Grouping extends Expr {
        constructor(startToken, endToken, expression) {
            super(startToken, endToken);
            this.expression = expression;
        }
        accept(visitor) {
            return visitor.visitGroupingExpr(this);
        }
    }
    ExprNS.Grouping = Grouping;
    class Literal extends Expr {
        constructor(startToken, endToken, value) {
            super(startToken, endToken);
            this.value = value;
        }
        accept(visitor) {
            return visitor.visitLiteralExpr(this);
        }
    }
    ExprNS.Literal = Literal;
    class Unary extends Expr {
        constructor(startToken, endToken, operator, right) {
            super(startToken, endToken);
            this.operator = operator;
            this.right = right;
        }
        accept(visitor) {
            return visitor.visitUnaryExpr(this);
        }
    }
    ExprNS.Unary = Unary;
    class Ternary extends Expr {
        constructor(startToken, endToken, predicate, consequent, alternative) {
            super(startToken, endToken);
            this.predicate = predicate;
            this.consequent = consequent;
            this.alternative = alternative;
        }
        accept(visitor) {
            return visitor.visitTernaryExpr(this);
        }
    }
    ExprNS.Ternary = Ternary;
    class Lambda extends Expr {
        constructor(startToken, endToken, parameters, body) {
            super(startToken, endToken);
            this.parameters = parameters;
            this.body = body;
        }
        accept(visitor) {
            return visitor.visitLambdaExpr(this);
        }
    }
    ExprNS.Lambda = Lambda;
    class MultiLambda extends Expr {
        constructor(startToken, endToken, parameters, body, varDecls) {
            super(startToken, endToken);
            this.parameters = parameters;
            this.body = body;
            this.varDecls = varDecls;
        }
        accept(visitor) {
            return visitor.visitMultiLambdaExpr(this);
        }
    }
    ExprNS.MultiLambda = MultiLambda;
    class Variable extends Expr {
        constructor(startToken, endToken, name) {
            super(startToken, endToken);
            this.name = name;
        }
        accept(visitor) {
            return visitor.visitVariableExpr(this);
        }
    }
    ExprNS.Variable = Variable;
    class Call extends Expr {
        constructor(startToken, endToken, callee, args) {
            super(startToken, endToken);
            this.callee = callee;
            this.args = args;
        }
        accept(visitor) {
            return visitor.visitCallExpr(this);
        }
    }
    ExprNS.Call = Call;
})(ExprNS = exports.ExprNS || (exports.ExprNS = {}));
var StmtNS;
(function (StmtNS) {
    class Stmt {
        constructor(startToken, endToken) {
            this.startToken = startToken;
            this.endToken = endToken;
        }
    }
    StmtNS.Stmt = Stmt;
    class Pass extends Stmt {
        constructor(startToken, endToken) {
            super(startToken, endToken);
        }
        accept(visitor) {
            return visitor.visitPassStmt(this);
        }
    }
    StmtNS.Pass = Pass;
    class Assign extends Stmt {
        constructor(startToken, endToken, name, value) {
            super(startToken, endToken);
            this.name = name;
            this.value = value;
        }
        accept(visitor) {
            return visitor.visitAssignStmt(this);
        }
    }
    StmtNS.Assign = Assign;
    class AnnAssign extends Stmt {
        constructor(startToken, endToken, name, value, ann) {
            super(startToken, endToken);
            this.name = name;
            this.value = value;
            this.ann = ann;
        }
        accept(visitor) {
            return visitor.visitAnnAssignStmt(this);
        }
    }
    StmtNS.AnnAssign = AnnAssign;
    class Break extends Stmt {
        constructor(startToken, endToken) {
            super(startToken, endToken);
        }
        accept(visitor) {
            return visitor.visitBreakStmt(this);
        }
    }
    StmtNS.Break = Break;
    class Continue extends Stmt {
        constructor(startToken, endToken) {
            super(startToken, endToken);
        }
        accept(visitor) {
            return visitor.visitContinueStmt(this);
        }
    }
    StmtNS.Continue = Continue;
    class Return extends Stmt {
        constructor(startToken, endToken, value) {
            super(startToken, endToken);
            this.value = value;
        }
        accept(visitor) {
            return visitor.visitReturnStmt(this);
        }
    }
    StmtNS.Return = Return;
    class FromImport extends Stmt {
        constructor(startToken, endToken, module, names) {
            super(startToken, endToken);
            this.module = module;
            this.names = names;
        }
        accept(visitor) {
            return visitor.visitFromImportStmt(this);
        }
    }
    StmtNS.FromImport = FromImport;
    class Global extends Stmt {
        constructor(startToken, endToken, name) {
            super(startToken, endToken);
            this.name = name;
        }
        accept(visitor) {
            return visitor.visitGlobalStmt(this);
        }
    }
    StmtNS.Global = Global;
    class NonLocal extends Stmt {
        constructor(startToken, endToken, name) {
            super(startToken, endToken);
            this.name = name;
        }
        accept(visitor) {
            return visitor.visitNonLocalStmt(this);
        }
    }
    StmtNS.NonLocal = NonLocal;
    class Assert extends Stmt {
        constructor(startToken, endToken, value) {
            super(startToken, endToken);
            this.value = value;
        }
        accept(visitor) {
            return visitor.visitAssertStmt(this);
        }
    }
    StmtNS.Assert = Assert;
    class If extends Stmt {
        constructor(startToken, endToken, condition, body, elseBlock) {
            super(startToken, endToken);
            this.condition = condition;
            this.body = body;
            this.elseBlock = elseBlock;
        }
        accept(visitor) {
            return visitor.visitIfStmt(this);
        }
    }
    StmtNS.If = If;
    class While extends Stmt {
        constructor(startToken, endToken, condition, body) {
            super(startToken, endToken);
            this.condition = condition;
            this.body = body;
        }
        accept(visitor) {
            return visitor.visitWhileStmt(this);
        }
    }
    StmtNS.While = While;
    class For extends Stmt {
        constructor(startToken, endToken, target, iter, body) {
            super(startToken, endToken);
            this.target = target;
            this.iter = iter;
            this.body = body;
        }
        accept(visitor) {
            return visitor.visitForStmt(this);
        }
    }
    StmtNS.For = For;
    class FunctionDef extends Stmt {
        constructor(startToken, endToken, name, parameters, body, varDecls) {
            super(startToken, endToken);
            this.name = name;
            this.parameters = parameters;
            this.body = body;
            this.varDecls = varDecls;
        }
        accept(visitor) {
            return visitor.visitFunctionDefStmt(this);
        }
    }
    StmtNS.FunctionDef = FunctionDef;
    class SimpleExpr extends Stmt {
        constructor(startToken, endToken, expression) {
            super(startToken, endToken);
            this.expression = expression;
        }
        accept(visitor) {
            return visitor.visitSimpleExprStmt(this);
        }
    }
    StmtNS.SimpleExpr = SimpleExpr;
    class FileInput extends Stmt {
        constructor(startToken, endToken, statements, varDecls) {
            super(startToken, endToken);
            this.statements = statements;
            this.varDecls = varDecls;
        }
        accept(visitor) {
            return visitor.visitFileInputStmt(this);
        }
    }
    StmtNS.FileInput = FileInput;
})(StmtNS = exports.StmtNS || (exports.StmtNS = {}));
//# sourceMappingURL=ast-types.js.map