import type * as es from 'estree';
import { type IOptions } from '..';
import { Context, substituterNodes } from '../types';
export declare const codify: (node: substituterNodes) => string;
export declare const javascriptify: (node: substituterNodes) => string;
export declare const redexify: (node: substituterNodes, path: string[][]) => [string, string];
export declare const getRedex: (node: substituterNodes, path: string[][]) => substituterNodes;
export declare function getEvaluationSteps(program: es.Program, context: Context, { importOptions, stepLimit }: Pick<IOptions, 'importOptions' | 'stepLimit'>): Promise<[es.Program, string[][], string][]>;
export interface IStepperPropContents {
    code: string;
    redex: string;
    explanation: string;
    function: es.Expression | undefined | es.Super;
}
export declare function isStepperOutput(output: any): output is IStepperPropContents;
export declare function callee(content: substituterNodes, context: Context): es.Expression | undefined | es.Super;
