import { Expression, Statement } from "estree";
import { StmtNS } from "../ast-types";
import Stmt = StmtNS.Stmt;
export declare function toPythonAst(text: string): Stmt;
export declare function toPythonAstAndResolve(text: string): Stmt;
export declare function toEstreeAST(text: string): Expression | Statement;
export declare function toEstreeAstAndResolve(text: string): Expression | Statement;
