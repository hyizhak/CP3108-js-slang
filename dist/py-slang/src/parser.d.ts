import { Token } from "./tokenizer";
import { StmtNS } from "./ast-types";
declare type Stmt = StmtNS.Stmt;
export declare class Parser {
    private readonly source;
    private readonly tokens;
    private current;
    constructor(source: string, tokens: Token[]);
    private match;
    private check;
    private advance;
    private isAtEnd;
    private peek;
    private previous;
    private consume;
    private synchronize;
    parse(): Stmt;
    private file_input;
    private stmt;
    private compound_stmt;
    private if_stmt;
    private while_stmt;
    private for_stmt;
    private funcdef;
    private simple_stmt;
    private assign_stmt;
    private import_from;
    private parameters;
    private test;
    private lambdef;
    private suite;
    private varparamslist;
    private or_test;
    private and_test;
    private not_test;
    private comparison;
    private arith_expr;
    private term;
    private factor;
    private power;
    private atom_expr;
    private arglist;
    private atom;
    private parse_invalid;
}
export {};