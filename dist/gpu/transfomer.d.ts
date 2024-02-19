import * as es from 'estree';
declare class GPUTransformer {
    program: es.Program;
    globalIds: {
        __createKernelSource: es.Identifier;
    };
    outputArray: es.Identifier;
    innerBody: any;
    counters: string[];
    end: es.Expression[];
    state: number;
    localVar: Set<string>;
    outerVariables: any;
    targetBody: any;
    constructor(program: es.Program, createKernelSource: es.Identifier);
    transform: () => number[][];
    gpuTranspile: (node: es.ForStatement) => number;
    checkOuterLoops: (node: es.ForStatement) => void;
    getTargetBody(node: es.ForStatement): void;
    getOuterVariables(): void;
}
export declare function gpuRuntimeTranspile(node: es.ArrowFunctionExpression, localNames: Set<string>): es.BlockStatement;
export default GPUTransformer;
