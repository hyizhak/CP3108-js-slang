"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transpileToGPU = void 0;
const create = require("../utils/astCreator");
const uniqueIds_1 = require("../utils/uniqueIds");
const transfomer_1 = require("./transfomer");
// top-level gpu functions that call our code
// transpiles if possible and modifies program to a Source program that makes use of the GPU primitives
function transpileToGPU(program) {
    const identifiers = (0, uniqueIds_1.getIdentifiersInProgram)(program);
    if (identifiers.has('__createKernelSource') || identifiers.has('__clearKernelCache')) {
        program.body.unshift(create.expressionStatement(create.callExpression(create.identifier('display'), [
            create.literal('Manual use of GPU library symbols detected, turning off automatic GPU optimizations.')
        ], {
            start: { line: 0, column: 0 },
            end: { line: 0, column: 0 }
        })));
        return;
    }
    const transformer = new transfomer_1.default(program, create.identifier('__createKernelSource'));
    const res = transformer.transform();
    const gpuDisplayStatements = [];
    // add some display statements to program
    if (res.length > 0) {
        for (const arr of res) {
            let debug = `Attempting to optimize ${arr[1]} levels of nested loops starting on line ${arr[0]}`;
            if (arr[1] === 1) {
                debug = `Attempting to optimize the loop on line ${arr[0]}`;
            }
            gpuDisplayStatements.push(create.expressionStatement(create.callExpression(create.identifier('display'), [create.literal(debug)], {
                start: { line: 0, column: 0 },
                end: { line: 0, column: 0 }
            })));
        }
    }
    const clearKernelCacheStatement = create.expressionStatement(create.callExpression(create.identifier('__clearKernelCache'), [], {
        start: { line: 0, column: 0 },
        end: { line: 0, column: 0 }
    }));
    program.body = [...gpuDisplayStatements, clearKernelCacheStatement, ...program.body];
}
exports.transpileToGPU = transpileToGPU;
//# sourceMappingURL=gpu.js.map