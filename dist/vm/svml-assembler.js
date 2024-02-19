"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assemble = void 0;
const buffer_1 = require("../utils/buffer");
const opcodes_1 = require("./opcodes");
const SVM_MAGIC = 0x5005acad;
const MAJOR_VER = 0;
const MINOR_VER = 0;
let UTF8_ENCODER;
function writeHeader(b, entrypoint, constantCount) {
    b.cursor = 0;
    b.putU(32, SVM_MAGIC);
    b.putU(16, MAJOR_VER);
    b.putU(16, MINOR_VER);
    b.putU(32, entrypoint);
    b.putU(32, constantCount);
}
function writeStringConstant(b, s) {
    if (UTF8_ENCODER === undefined) {
        UTF8_ENCODER = new TextEncoder();
    }
    const sBytes = UTF8_ENCODER.encode(s);
    b.align(4);
    b.putU(16, 1);
    b.putU(32, sBytes.byteLength + 1);
    b.putA(sBytes);
    b.putU(8, 0);
}
function serialiseFunction(f) {
    const [stackSize, envSize, numArgs, code] = f;
    const holes = [];
    const b = new buffer_1.default();
    b.putU(8, stackSize);
    b.putU(8, envSize);
    b.putU(8, numArgs);
    b.putU(8, 0); // padding
    const instrOffsets = code
        .map(i => (0, opcodes_1.getInstructionSize)(i[0]))
        .reduce((ss, s) => (ss.push(ss[ss.length - 1] + s), ss), [0]);
    for (const [instr, index] of code.map((i1, i2) => [i1, i2])) {
        if (instr[0] < 0 || instr[0] > opcodes_1.OPCODE_MAX) {
            throw new Error(`Invalid opcode ${instr[0].toString()}`);
        }
        const opcode = instr[0];
        b.putU(8, opcode);
        switch (opcode) {
            case opcodes_1.default.LDCI:
            case opcodes_1.default.LGCI:
                if (!Number.isInteger(instr[1])) {
                    throw new Error(`Non-integral operand to LDCI/LDGI: ${instr[1]} (this is a compiler bug)`);
                }
                b.putI(32, instr[1]);
                break;
            case opcodes_1.default.LDCF32:
            case opcodes_1.default.LGCF32:
                b.putF(32, instr[1]);
                break;
            case opcodes_1.default.LDCF64:
            case opcodes_1.default.LGCF64:
                b.putF(64, instr[1]);
                break;
            case opcodes_1.default.LGCS:
                holes.push({
                    offset: b.cursor,
                    referent: ['string', instr[1]]
                });
                b.putU(32, 0);
                break;
            case opcodes_1.default.NEWC:
                holes.push({
                    offset: b.cursor,
                    referent: ['function', instr[1][0]]
                });
                b.putU(32, 0);
                break;
            case opcodes_1.default.LDLG:
            case opcodes_1.default.LDLF:
            case opcodes_1.default.LDLB:
            case opcodes_1.default.STLG:
            case opcodes_1.default.STLF:
            case opcodes_1.default.STLB:
            case opcodes_1.default.CALL:
            case opcodes_1.default.CALLT:
            case opcodes_1.default.NEWENV:
            case opcodes_1.default.NEWCP:
            case opcodes_1.default.NEWCV:
                b.putU(8, instr[1]);
                break;
            case opcodes_1.default.LDPG:
            case opcodes_1.default.LDPF:
            case opcodes_1.default.LDPB:
            case opcodes_1.default.STPG:
            case opcodes_1.default.STPF:
            case opcodes_1.default.STPB:
            case opcodes_1.default.CALLP:
            case opcodes_1.default.CALLTP:
            case opcodes_1.default.CALLV:
            case opcodes_1.default.CALLTV:
                b.putU(8, instr[1]);
                b.putU(8, instr[2]);
                break;
            case opcodes_1.default.BRF:
            case opcodes_1.default.BRT:
            case opcodes_1.default.BR:
                const offset = instrOffsets[index + instr[1]] - instrOffsets[index + 1];
                b.putI(32, offset);
                break;
            case opcodes_1.default.JMP:
                throw new Error('JMP assembling not implemented');
        }
    }
    const binary = b.asArray();
    if (binary.byteLength - 4 !== instrOffsets[instrOffsets.length - 1]) {
        throw new Error(`Assembler bug: calculated function length ${instrOffsets[instrOffsets.length - 1]} is different from actual length ${binary.byteLength - 4}`);
    }
    return {
        binary: b.asArray(),
        holes,
        finalOffset: null
    };
}
function assemble(p) {
    const [entrypointIndex, jsonFns] = p;
    // serialise all the functions
    const imFns = jsonFns.map(fn => serialiseFunction(fn));
    // collect all string constants
    const uniqueStrings = [
        ...new Set([].concat(...imFns.map(fn => fn.holes
            .filter(hole => hole.referent[0] === 'string')
            .map(hole => hole.referent[1]))))
    ];
    const bin = new buffer_1.default();
    // skip header for now
    bin.cursor = 0x10;
    // write all the strings, and store their positions
    const stringMap = new Map();
    for (const str of uniqueStrings) {
        bin.align(4);
        stringMap.set(str, bin.cursor);
        writeStringConstant(bin, str);
    }
    // layout the functions, but don't actually write them yet
    const fnStartOffset = bin.cursor;
    for (const fn of imFns) {
        bin.align(4);
        fn.finalOffset = bin.cursor;
        bin.cursor += fn.binary.byteLength;
    }
    // now fill in the holes
    for (const fn of imFns) {
        const view = new DataView(fn.binary.buffer);
        for (const hole of fn.holes) {
            let offset;
            if (hole.referent[0] === 'string') {
                offset = stringMap.get(hole.referent[1]);
            }
            else {
                offset = imFns[hole.referent[1]].finalOffset;
            }
            if (!offset) {
                throw new Error(`Assembler bug: missing string/function: ${JSON.stringify(hole)}`);
            }
            view.setUint32(hole.offset, offset, true);
        }
    }
    // now we write the functions
    bin.cursor = fnStartOffset;
    for (const fn of imFns) {
        bin.align(4);
        if (bin.cursor !== fn.finalOffset) {
            throw new Error('Assembler bug: function offset changed');
        }
        bin.putA(fn.binary);
    }
    bin.cursor = 0;
    writeHeader(bin, imFns[entrypointIndex].finalOffset, uniqueStrings.length);
    return bin.asArray();
}
exports.assemble = assemble;
//# sourceMappingURL=svml-assembler.js.map