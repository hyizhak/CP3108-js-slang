"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.__createKernelSource = exports.__clearKernelCache = exports.__createKernel = void 0;
const acorn_1 = require("acorn");
const astring_1 = require("astring");
const gpu_js_1 = require("gpu.js");
const constants_1 = require("../constants");
const rttc_1 = require("../utils/rttc");
const transfomer_1 = require("./transfomer");
// Heuristic : Only use GPU if array is bigger than this
const MAX_SIZE = 200;
// helper function to build 2D array output
function buildArray(arr, end, res) {
    for (let i = 0; i < end[0]; i++) {
        res[i] = prettyOutput(arr[i]);
    }
}
function build2DArray(arr, end, res) {
    for (let i = 0; i < end[0]; i++) {
        for (let j = 0; j < end[1]; j++) {
            res[i][j] = prettyOutput(arr[i][j]);
        }
    }
}
// helper function to build 3D array output
function build3DArray(arr, end, res) {
    for (let i = 0; i < end[0]; i++) {
        for (let j = 0; j < end[1]; j++) {
            for (let k = 0; k < end[2]; k++) {
                res[i][j][k] = prettyOutput(arr[i][j][k]);
            }
        }
    }
}
function prettyOutput(arr) {
    if (!(arr instanceof Float32Array)) {
        return arr;
    }
    const res = arr.map(x => prettyOutput(x));
    return Array.from(res);
}
// helper function to check array is initialized
function checkArray(arr) {
    return Array.isArray(arr);
}
// helper function to check 2D array is initialized
function checkArray2D(arr, end) {
    for (let i = 0; i < end[0]; i = i + 1) {
        if (!Array.isArray(arr[i]))
            return false;
    }
    return true;
}
// helper function to check 3D array is initialized
function checkArray3D(arr, end) {
    for (let i = 0; i < end[0]; i = i + 1) {
        if (!Array.isArray(arr[i]))
            return false;
        for (let j = 0; j < end[1]; j = j + 1) {
            if (!Array.isArray(arr[i][j]))
                return false;
        }
    }
    return true;
}
/*
 * we only use the gpu if:
 * 1. we are working with numbers
 * 2. we have a large array (> 100 elements)
 */
function checkValidGPU(f, end) {
    let res;
    if (end.length === 1)
        res = f(0);
    if (end.length === 2)
        res = f(0, 0);
    if (end.length === 3)
        res = f(0, 0, 0);
    // we do not allow array assignment
    // we expect the programmer break it down for us
    if (typeof res !== 'number') {
        return false;
    }
    let cnt = 1;
    for (const i of end) {
        cnt = cnt * i;
    }
    return cnt > MAX_SIZE;
}
// just run on js!
function manualRun(f, end, res) {
    function build() {
        for (let i = 0; i < end[0]; i++) {
            res[i] = f(i);
        }
        return;
    }
    function build2D() {
        for (let i = 0; i < end[0]; i = i + 1) {
            for (let j = 0; j < end[1]; j = j + 1) {
                res[i][j] = f(i, j);
            }
        }
        return;
    }
    function build3D() {
        for (let i = 0; i < end[0]; i = i + 1) {
            for (let j = 0; j < end[1]; j = j + 1) {
                for (let k = 0; k < end[2]; k = k + 1) {
                    res[i][j][k] = f(i, j, k);
                }
            }
        }
        return;
    }
    if (end.length === 1)
        return build();
    if (end.length === 2)
        return build2D();
    return build3D();
}
/* main function that runs code on the GPU (using gpu.js library)
 * @end : end bounds for array
 * @extern : external variable definitions {}
 * @f : function run as on GPU threads
 * @arr : array to be written to
 */
function __createKernel(end, extern, f, arr, f2) {
    const gpu = new gpu_js_1.GPU();
    // check array is initialized properly
    let ok = checkArray(arr);
    let err = '';
    if (!ok) {
        err = typeof arr;
    }
    // TODO: find a cleaner way to do this
    if (end.length > 1) {
        ok = ok && checkArray2D(arr, end);
        if (!ok) {
            err = 'undefined';
        }
    }
    if (end.length > 2) {
        ok = ok && checkArray3D(arr, end);
        if (!ok) {
            err = 'undefined';
        }
    }
    if (!ok) {
        throw new rttc_1.TypeError(arr, '', 'object or array', err);
    }
    // check if program is valid to run on GPU
    ok = checkValidGPU(f2, end);
    if (!ok) {
        manualRun(f2, end, arr);
        return;
    }
    const nend = [];
    for (let i = end.length - 1; i >= 0; i--) {
        nend.push(end[i]);
    }
    // external variables to be in the GPU
    const out = { constants: {} };
    out.constants = extern;
    const gpuFunction = gpu.createKernel(f, out).setOutput(nend);
    const res = gpuFunction();
    if (end.length === 1)
        buildArray(res, end, arr);
    if (end.length === 2)
        build2DArray(res, end, arr);
    if (end.length === 3)
        build3DArray(res, end, arr);
}
exports.__createKernel = __createKernel;
function entriesToObject(entries) {
    const res = {};
    entries.forEach(([key, value]) => (res[key] = value));
    return res;
}
/* tslint:disable-next-line:ban-types */
const kernels = new Map();
function __clearKernelCache() {
    kernels.clear();
}
exports.__clearKernelCache = __clearKernelCache;
function __createKernelSource(end, externSource, localNames, arr, f, kernelId) {
    const extern = entriesToObject(externSource);
    const memoizedf = kernels.get(kernelId);
    if (memoizedf !== undefined) {
        return __createKernel(end, extern, memoizedf, arr, f);
    }
    const code = f.toString();
    // We don't need the full source parser here because it's already validated at transpile time.
    const ast = (0, acorn_1.parse)(code, { ecmaVersion: constants_1.DEFAULT_ECMA_VERSION });
    const body = ast.body[0].expression;
    const newBody = (0, transfomer_1.gpuRuntimeTranspile)(body, new Set(localNames));
    const kernel = new Function((0, astring_1.generate)(newBody));
    kernels.set(kernelId, kernel);
    return __createKernel(end, extern, kernel, arr, f);
}
exports.__createKernelSource = __createKernelSource;
//# sourceMappingURL=lib.js.map