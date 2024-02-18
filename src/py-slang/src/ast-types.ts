// This file is autogenerated by generate-ast.ts. DO NOT EDIT THIS FILE DIRECTLY.
import {Token} from "./tokenizer";

export namespace ExprNS {
    export interface Visitor<T> {
        visitBinaryExpr(expr: Binary): T
        visitCompareExpr(expr: Compare): T
        visitBoolOpExpr(expr: BoolOp): T
        visitGroupingExpr(expr: Grouping): T
        visitLiteralExpr(expr: Literal): T
        visitUnaryExpr(expr: Unary): T
        visitTernaryExpr(expr: Ternary): T
        visitLambdaExpr(expr: Lambda): T
        visitMultiLambdaExpr(expr: MultiLambda): T
        visitVariableExpr(expr: Variable): T
        visitCallExpr(expr: Call): T
    }
    export abstract class Expr {
        startToken: Token;
        endToken: Token;
        protected constructor(startToken: Token, endToken: Token) {
            this.startToken = startToken;
            this.endToken = endToken;
        }
        abstract accept(visitor: Visitor<any>): any;
    }
    export class Binary extends Expr {
        left: Expr;
        operator: Token;
        right: Expr;
        constructor(startToken: Token, endToken: Token, left: Expr, operator: Token, right: Expr){
            super(startToken, endToken)
            this.left = left;
            this.operator = operator;
            this.right = right;
        }
        override accept(visitor: Visitor<any>): any {
            return visitor.visitBinaryExpr(this)
        }
    }
    export class Compare extends Expr {
        left: Expr;
        operator: Token;
        right: Expr;
        constructor(startToken: Token, endToken: Token, left: Expr, operator: Token, right: Expr){
            super(startToken, endToken)
            this.left = left;
            this.operator = operator;
            this.right = right;
        }
        override accept(visitor: Visitor<any>): any {
            return visitor.visitCompareExpr(this)
        }
    }
    export class BoolOp extends Expr {
        left: Expr;
        operator: Token;
        right: Expr;
        constructor(startToken: Token, endToken: Token, left: Expr, operator: Token, right: Expr){
            super(startToken, endToken)
            this.left = left;
            this.operator = operator;
            this.right = right;
        }
        override accept(visitor: Visitor<any>): any {
            return visitor.visitBoolOpExpr(this)
        }
    }
    export class Grouping extends Expr {
        expression: Expr;
        constructor(startToken: Token, endToken: Token, expression: Expr){
            super(startToken, endToken)
            this.expression = expression;
        }
        override accept(visitor: Visitor<any>): any {
            return visitor.visitGroupingExpr(this)
        }
    }
    export class Literal extends Expr {
        value: true | false | number | string | bigint;
        constructor(startToken: Token, endToken: Token, value: true | false | number | string | bigint){
            super(startToken, endToken)
            this.value = value;
        }
        override accept(visitor: Visitor<any>): any {
            return visitor.visitLiteralExpr(this)
        }
    }
    export class Unary extends Expr {
        operator: Token;
        right: Expr;
        constructor(startToken: Token, endToken: Token, operator: Token, right: Expr){
            super(startToken, endToken)
            this.operator = operator;
            this.right = right;
        }
        override accept(visitor: Visitor<any>): any {
            return visitor.visitUnaryExpr(this)
        }
    }
    export class Ternary extends Expr {
        predicate: Expr;
        consequent: Expr;
        alternative: Expr;
        constructor(startToken: Token, endToken: Token, predicate: Expr, consequent: Expr, alternative: Expr){
            super(startToken, endToken)
            this.predicate = predicate;
            this.consequent = consequent;
            this.alternative = alternative;
        }
        override accept(visitor: Visitor<any>): any {
            return visitor.visitTernaryExpr(this)
        }
    }
    export class Lambda extends Expr {
        parameters: Token[];
        body: Expr;
        constructor(startToken: Token, endToken: Token, parameters: Token[], body: Expr){
            super(startToken, endToken)
            this.parameters = parameters;
            this.body = body;
        }
        override accept(visitor: Visitor<any>): any {
            return visitor.visitLambdaExpr(this)
        }
    }
    export class MultiLambda extends Expr {
        parameters: Token[];
        body: StmtNS.Stmt[];
        varDecls: Token[];
        constructor(startToken: Token, endToken: Token, parameters: Token[], body: StmtNS.Stmt[], varDecls: Token[]){
            super(startToken, endToken)
            this.parameters = parameters;
            this.body = body;
            this.varDecls = varDecls;
        }
        override accept(visitor: Visitor<any>): any {
            return visitor.visitMultiLambdaExpr(this)
        }
    }
    export class Variable extends Expr {
        name: Token;
        constructor(startToken: Token, endToken: Token, name: Token){
            super(startToken, endToken)
            this.name = name;
        }
        override accept(visitor: Visitor<any>): any {
            return visitor.visitVariableExpr(this)
        }
    }
    export class Call extends Expr {
        callee: Expr;
        args: Expr[];
        constructor(startToken: Token, endToken: Token, callee: Expr, args: Expr[]){
            super(startToken, endToken)
            this.callee = callee;
            this.args = args;
        }
        override accept(visitor: Visitor<any>): any {
            return visitor.visitCallExpr(this)
        }
    }
    
    
}
export namespace StmtNS {
    export interface Visitor<T> {
        visitPassStmt(stmt: Pass): T
        visitAssignStmt(stmt: Assign): T
        visitAnnAssignStmt(stmt: AnnAssign): T
        visitBreakStmt(stmt: Break): T
        visitContinueStmt(stmt: Continue): T
        visitReturnStmt(stmt: Return): T
        visitFromImportStmt(stmt: FromImport): T
        visitGlobalStmt(stmt: Global): T
        visitNonLocalStmt(stmt: NonLocal): T
        visitAssertStmt(stmt: Assert): T
        visitIfStmt(stmt: If): T
        visitWhileStmt(stmt: While): T
        visitForStmt(stmt: For): T
        visitFunctionDefStmt(stmt: FunctionDef): T
        visitSimpleExprStmt(stmt: SimpleExpr): T
        visitFileInputStmt(stmt: FileInput): T
    }
    export abstract class Stmt {
        startToken: Token;
        endToken: Token;
        protected constructor(startToken: Token, endToken: Token) {
            this.startToken = startToken;
            this.endToken = endToken;
        }
        abstract accept(visitor: Visitor<any>): any;
    }
    export class Pass extends Stmt {
        constructor(startToken: Token, endToken: Token){
            super(startToken, endToken)
        }
        override accept(visitor: Visitor<any>): any {
            return visitor.visitPassStmt(this)
        }
    }
    export class Assign extends Stmt {
        name: Token;
        value: ExprNS.Expr;
        constructor(startToken: Token, endToken: Token, name: Token, value: ExprNS.Expr){
            super(startToken, endToken)
            this.name = name;
            this.value = value;
        }
        override accept(visitor: Visitor<any>): any {
            return visitor.visitAssignStmt(this)
        }
    }
    export class AnnAssign extends Stmt {
        name: Token;
        value: ExprNS.Expr;
        ann: ExprNS.Expr;
        constructor(startToken: Token, endToken: Token, name: Token, value: ExprNS.Expr, ann: ExprNS.Expr){
            super(startToken, endToken)
            this.name = name;
            this.value = value;
            this.ann = ann;
        }
        override accept(visitor: Visitor<any>): any {
            return visitor.visitAnnAssignStmt(this)
        }
    }
    export class Break extends Stmt {
        constructor(startToken: Token, endToken: Token){
            super(startToken, endToken)
        }
        override accept(visitor: Visitor<any>): any {
            return visitor.visitBreakStmt(this)
        }
    }
    export class Continue extends Stmt {
        constructor(startToken: Token, endToken: Token){
            super(startToken, endToken)
        }
        override accept(visitor: Visitor<any>): any {
            return visitor.visitContinueStmt(this)
        }
    }
    export class Return extends Stmt {
        value: ExprNS.Expr | null;
        constructor(startToken: Token, endToken: Token, value: ExprNS.Expr | null){
            super(startToken, endToken)
            this.value = value;
        }
        override accept(visitor: Visitor<any>): any {
            return visitor.visitReturnStmt(this)
        }
    }
    export class FromImport extends Stmt {
        module: Token;
        names: Token[];
        constructor(startToken: Token, endToken: Token, module: Token, names: Token[]){
            super(startToken, endToken)
            this.module = module;
            this.names = names;
        }
        override accept(visitor: Visitor<any>): any {
            return visitor.visitFromImportStmt(this)
        }
    }
    export class Global extends Stmt {
        name: Token;
        constructor(startToken: Token, endToken: Token, name: Token){
            super(startToken, endToken)
            this.name = name;
        }
        override accept(visitor: Visitor<any>): any {
            return visitor.visitGlobalStmt(this)
        }
    }
    export class NonLocal extends Stmt {
        name: Token;
        constructor(startToken: Token, endToken: Token, name: Token){
            super(startToken, endToken)
            this.name = name;
        }
        override accept(visitor: Visitor<any>): any {
            return visitor.visitNonLocalStmt(this)
        }
    }
    export class Assert extends Stmt {
        value: ExprNS.Expr;
        constructor(startToken: Token, endToken: Token, value: ExprNS.Expr){
            super(startToken, endToken)
            this.value = value;
        }
        override accept(visitor: Visitor<any>): any {
            return visitor.visitAssertStmt(this)
        }
    }
    export class If extends Stmt {
        condition: ExprNS.Expr;
        body: Stmt[];
        elseBlock: Stmt[] | null;
        constructor(startToken: Token, endToken: Token, condition: ExprNS.Expr, body: Stmt[], elseBlock: Stmt[] | null){
            super(startToken, endToken)
            this.condition = condition;
            this.body = body;
            this.elseBlock = elseBlock;
        }
        override accept(visitor: Visitor<any>): any {
            return visitor.visitIfStmt(this)
        }
    }
    export class While extends Stmt {
        condition: ExprNS.Expr;
        body: Stmt[];
        constructor(startToken: Token, endToken: Token, condition: ExprNS.Expr, body: Stmt[]){
            super(startToken, endToken)
            this.condition = condition;
            this.body = body;
        }
        override accept(visitor: Visitor<any>): any {
            return visitor.visitWhileStmt(this)
        }
    }
    export class For extends Stmt {
        target: Token;
        iter: ExprNS.Expr;
        body: Stmt[];
        constructor(startToken: Token, endToken: Token, target: Token, iter: ExprNS.Expr, body: Stmt[]){
            super(startToken, endToken)
            this.target = target;
            this.iter = iter;
            this.body = body;
        }
        override accept(visitor: Visitor<any>): any {
            return visitor.visitForStmt(this)
        }
    }
    export class FunctionDef extends Stmt {
        name: Token;
        parameters: Token[];
        body: Stmt[];
        varDecls: Token[];
        constructor(startToken: Token, endToken: Token, name: Token, parameters: Token[], body: Stmt[], varDecls: Token[]){
            super(startToken, endToken)
            this.name = name;
            this.parameters = parameters;
            this.body = body;
            this.varDecls = varDecls;
        }
        override accept(visitor: Visitor<any>): any {
            return visitor.visitFunctionDefStmt(this)
        }
    }
    export class SimpleExpr extends Stmt {
        expression: ExprNS.Expr;
        constructor(startToken: Token, endToken: Token, expression: ExprNS.Expr){
            super(startToken, endToken)
            this.expression = expression;
        }
        override accept(visitor: Visitor<any>): any {
            return visitor.visitSimpleExprStmt(this)
        }
    }
    export class FileInput extends Stmt {
        statements: Stmt[];
        varDecls: Token[];
        constructor(startToken: Token, endToken: Token, statements: Stmt[], varDecls: Token[]){
            super(startToken, endToken)
            this.statements = statements;
            this.varDecls = varDecls;
        }
        override accept(visitor: Visitor<any>): any {
            return visitor.visitFileInputStmt(this)
        }
    }
    
    
}
