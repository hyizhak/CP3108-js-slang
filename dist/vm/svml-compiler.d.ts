import * as es from 'estree';
import { Context } from '../types';
export declare type Offset = number;
export declare type Address = [
    number,
    number?
];
export declare type Instruction = [
    number,
    Argument?,
    Argument?
];
export declare type Argument = number | boolean | string | Offset | Address;
export declare type SVMFunction = [
    number,
    number,
    number,
    Instruction[]
];
export declare type Program = [
    number,
    SVMFunction[]
];
export declare function compileForConcurrent(program: es.Program, context: Context): Program;
export declare function compilePreludeToIns(program: es.Program): Program;
export declare function compileToIns(program: es.Program, prelude?: Program, vmInternalFunctions?: string[]): Program;
