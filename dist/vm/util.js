"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringifyProgram = exports.getName = void 0;
const opcodes_1 = require("./opcodes");
const OPCODES_STR = {
    [opcodes_1.OpCodes.NOP]: 'NOP   ',
    [opcodes_1.OpCodes.LDCI]: 'LDCI  ',
    [opcodes_1.OpCodes.LGCI]: 'LGCI  ',
    [opcodes_1.OpCodes.LDCF32]: 'LDCF32',
    [opcodes_1.OpCodes.LGCF32]: 'LGCF32',
    [opcodes_1.OpCodes.LDCF64]: 'LDCF64',
    [opcodes_1.OpCodes.LGCF64]: 'LGCF64',
    [opcodes_1.OpCodes.LDCB0]: 'LDCB0 ',
    [opcodes_1.OpCodes.LDCB1]: 'LDCB1 ',
    [opcodes_1.OpCodes.LGCB0]: 'LGCB0 ',
    [opcodes_1.OpCodes.LGCB1]: 'LGCB1 ',
    [opcodes_1.OpCodes.LGCU]: 'LGCU  ',
    [opcodes_1.OpCodes.LGCN]: 'LGCN  ',
    [opcodes_1.OpCodes.LGCS]: 'LGCS  ',
    [opcodes_1.OpCodes.POPG]: 'POPG  ',
    [opcodes_1.OpCodes.POPB]: 'POPB  ',
    [opcodes_1.OpCodes.POPF]: 'POPF  ',
    [opcodes_1.OpCodes.ADDG]: 'ADDG  ',
    [opcodes_1.OpCodes.ADDF]: 'ADDF  ',
    [opcodes_1.OpCodes.SUBG]: 'SUBG  ',
    [opcodes_1.OpCodes.SUBF]: 'SUBF  ',
    [opcodes_1.OpCodes.MULG]: 'MULG  ',
    [opcodes_1.OpCodes.MULF]: 'MULF  ',
    [opcodes_1.OpCodes.DIVG]: 'DIVG  ',
    [opcodes_1.OpCodes.DIVF]: 'DIVF  ',
    [opcodes_1.OpCodes.MODG]: 'MODG  ',
    [opcodes_1.OpCodes.MODF]: 'MODF  ',
    [opcodes_1.OpCodes.NEGG]: 'NEGG  ',
    [opcodes_1.OpCodes.NEGF]: 'NEGF  ',
    [opcodes_1.OpCodes.NOTG]: 'NOTG  ',
    [opcodes_1.OpCodes.NOTB]: 'NOTB  ',
    [opcodes_1.OpCodes.LTG]: 'LTG   ',
    [opcodes_1.OpCodes.LTF]: 'LTF   ',
    [opcodes_1.OpCodes.GTG]: 'GTG   ',
    [opcodes_1.OpCodes.GTF]: 'GTF   ',
    [opcodes_1.OpCodes.LEG]: 'LEG   ',
    [opcodes_1.OpCodes.LEF]: 'LEF   ',
    [opcodes_1.OpCodes.GEG]: 'GEG   ',
    [opcodes_1.OpCodes.GEF]: 'GEF   ',
    [opcodes_1.OpCodes.EQG]: 'EQG   ',
    [opcodes_1.OpCodes.EQF]: 'EQF   ',
    [opcodes_1.OpCodes.EQB]: 'EQB   ',
    [opcodes_1.OpCodes.NEQG]: 'NEQG  ',
    [opcodes_1.OpCodes.NEQF]: 'NEQF  ',
    [opcodes_1.OpCodes.NEQB]: 'NEQB  ',
    [opcodes_1.OpCodes.NEWC]: 'NEWC  ',
    [opcodes_1.OpCodes.NEWA]: 'NEWA  ',
    [opcodes_1.OpCodes.LDLG]: 'LDLG  ',
    [opcodes_1.OpCodes.LDLF]: 'LDLF  ',
    [opcodes_1.OpCodes.LDLB]: 'LDLB  ',
    [opcodes_1.OpCodes.STLG]: 'STLG  ',
    [opcodes_1.OpCodes.STLB]: 'STLB  ',
    [opcodes_1.OpCodes.STLF]: 'STLF  ',
    [opcodes_1.OpCodes.LDPG]: 'LDPG  ',
    [opcodes_1.OpCodes.LDPF]: 'LDPF  ',
    [opcodes_1.OpCodes.LDPB]: 'LDPB  ',
    [opcodes_1.OpCodes.STPG]: 'STPG  ',
    [opcodes_1.OpCodes.STPB]: 'STPB  ',
    [opcodes_1.OpCodes.STPF]: 'STPF  ',
    [opcodes_1.OpCodes.LDAG]: 'LDAG  ',
    [opcodes_1.OpCodes.LDAB]: 'LDAB  ',
    [opcodes_1.OpCodes.LDAF]: 'LDAF  ',
    [opcodes_1.OpCodes.STAG]: 'STAG  ',
    [opcodes_1.OpCodes.STAB]: 'STAB  ',
    [opcodes_1.OpCodes.STAF]: 'STAF  ',
    [opcodes_1.OpCodes.BRT]: 'BRT   ',
    [opcodes_1.OpCodes.BRF]: 'BRF   ',
    [opcodes_1.OpCodes.BR]: 'BR    ',
    [opcodes_1.OpCodes.JMP]: 'JMP   ',
    [opcodes_1.OpCodes.CALL]: 'CALL  ',
    [opcodes_1.OpCodes.CALLT]: 'CALLT ',
    [opcodes_1.OpCodes.CALLP]: 'CALLP ',
    [opcodes_1.OpCodes.CALLTP]: 'CALLTP',
    [opcodes_1.OpCodes.CALLV]: 'CALLV ',
    [opcodes_1.OpCodes.CALLTV]: 'CALLTV',
    [opcodes_1.OpCodes.RETG]: 'RETG  ',
    [opcodes_1.OpCodes.RETF]: 'RETF  ',
    [opcodes_1.OpCodes.RETB]: 'RETB  ',
    [opcodes_1.OpCodes.RETU]: 'RETU  ',
    [opcodes_1.OpCodes.RETN]: 'RETN  ',
    [opcodes_1.OpCodes.DUP]: 'DUP   ',
    [opcodes_1.OpCodes.NEWENV]: 'NEWENV',
    [opcodes_1.OpCodes.POPENV]: 'POPENV',
    [opcodes_1.OpCodes.NEWCP]: 'NEWCP ',
    [opcodes_1.OpCodes.NEWCV]: 'NEWCV ',
    [opcodes_1.OpCodes.NEGG]: 'NEGG  ',
    [opcodes_1.OpCodes.NEGF]: 'NEGF  ',
    [opcodes_1.OpCodes.NEQG]: 'NEQG  ',
    [opcodes_1.OpCodes.NEQF]: 'NEQF  ',
    [opcodes_1.OpCodes.NEQB]: 'NEQB  ',
    // custom opcodes
    [opcodes_1.OpCodes.ARRAY_LEN]: 'ARR_LEN',
    [opcodes_1.OpCodes.DISPLAY]: 'DISPLAY',
    [opcodes_1.OpCodes.DRAW_DATA]: 'DRAW_DATA',
    [opcodes_1.OpCodes.ERROR]: 'ERROR',
    [opcodes_1.OpCodes.IS_ARRAY]: 'IS_ARRAY',
    [opcodes_1.OpCodes.IS_BOOL]: 'IS_BOOL',
    [opcodes_1.OpCodes.IS_FUNC]: 'IS_FUNC',
    [opcodes_1.OpCodes.IS_NULL]: 'IS_NULL',
    [opcodes_1.OpCodes.IS_NUMBER]: 'IS_NUM',
    [opcodes_1.OpCodes.IS_STRING]: 'IS_STR',
    [opcodes_1.OpCodes.IS_UNDEFINED]: 'IS_UNDEF',
    [opcodes_1.OpCodes.MATH_ABS]: 'MATH_ABS',
    [opcodes_1.OpCodes.MATH_ACOS]: 'MATH_ACOS',
    [opcodes_1.OpCodes.MATH_ACOSH]: 'MATH_ACOSH',
    [opcodes_1.OpCodes.MATH_ASINH]: 'MATH_ASINH',
    [opcodes_1.OpCodes.MATH_ATAN]: 'MATH_ATAN',
    [opcodes_1.OpCodes.MATH_ATAN2]: 'MATH_ATAN2',
    [opcodes_1.OpCodes.MATH_ATANH]: 'MATH_ATANH',
    [opcodes_1.OpCodes.MATH_CBRT]: 'MATH_CBRT',
    [opcodes_1.OpCodes.MATH_CEIL]: 'MATH_CEIL',
    [opcodes_1.OpCodes.MATH_CLZ32]: 'MATH_CLZ32',
    [opcodes_1.OpCodes.MATH_COS]: 'MATH_COS',
    [opcodes_1.OpCodes.MATH_COSH]: 'MATH_COSH',
    [opcodes_1.OpCodes.MATH_EXP]: 'MATH_EXP',
    [opcodes_1.OpCodes.MATH_EXPM1]: 'MATH_EXPM1',
    [opcodes_1.OpCodes.MATH_FLOOR]: 'MATH_FLOOR',
    [opcodes_1.OpCodes.MATH_FROUND]: 'MATH_FROUND',
    [opcodes_1.OpCodes.MATH_HYPOT]: 'MATH_HYPOT',
    [opcodes_1.OpCodes.MATH_IMUL]: 'MATH_IMUL',
    [opcodes_1.OpCodes.MATH_LOG]: 'MATH_LOG',
    [opcodes_1.OpCodes.MATH_LOG1P]: 'MATH_LOG1P',
    [opcodes_1.OpCodes.MATH_LOG2]: 'MATH_LOG2',
    [opcodes_1.OpCodes.MATH_LOG10]: 'MATH_LOG10',
    [opcodes_1.OpCodes.MATH_MAX]: 'MATH_MAX',
    [opcodes_1.OpCodes.MATH_MIN]: 'MATH_MIN',
    [opcodes_1.OpCodes.MATH_POW]: 'MATH_POW',
    [opcodes_1.OpCodes.MATH_RANDOM]: 'MATH_RANDOM',
    [opcodes_1.OpCodes.MATH_ROUND]: 'MATH_ROUND',
    [opcodes_1.OpCodes.MATH_SIGN]: 'MATH_SIGN',
    [opcodes_1.OpCodes.MATH_SIN]: 'MATH_SIN',
    [opcodes_1.OpCodes.MATH_SINH]: 'MATH_SINH',
    [opcodes_1.OpCodes.MATH_SQRT]: 'MATH_SQRT',
    [opcodes_1.OpCodes.MATH_TAN]: 'MATH_TAN',
    [opcodes_1.OpCodes.MATH_TANH]: 'MATH_TANH',
    [opcodes_1.OpCodes.MATH_TRUNC]: 'MATH_TRUNC',
    [opcodes_1.OpCodes.PARSE_INT]: 'PARSE_INT',
    [opcodes_1.OpCodes.RUNTIME]: 'RUNTIME',
    [opcodes_1.OpCodes.STREAM]: 'STREAM',
    [opcodes_1.OpCodes.STRINGIFY]: 'STRINGIFY',
    [opcodes_1.OpCodes.PROMPT]: 'PROMPT',
    [opcodes_1.OpCodes.DISPLAY_LIST]: 'DISPLAY_LIST',
    [opcodes_1.OpCodes.CHAR_AT]: 'CHAR_AT',
    [opcodes_1.OpCodes.ARITY]: 'ARITY',
    // Concurrency Opcodes
    [opcodes_1.OpCodes.EXECUTE]: 'EXEC  ',
    [opcodes_1.OpCodes.TEST_AND_SET]: 'T&S   ',
    [opcodes_1.OpCodes.CLEAR]: 'CLEAR '
};
// get name of opcode for debugging
function getName(op) {
    return OPCODES_STR[op]; // need to add guard in case op does not exist
}
exports.getName = getName;
// pretty-print the program
function stringifyProgram(P) {
    const functions = P[1];
    let programStr = '';
    programStr += 'Entry function: ' + P[0] + '\n';
    for (let i = 0; i < functions.length; i++) {
        const f = functions[i];
        let s = '#' + i + ':\nStack Size: ' + f[0] + '\nEnv Size: ' + f[1] + '\nNum Args: ' + f[2] + '\n';
        for (let j = 0; j < f[3].length; j++) {
            s += j;
            const ins = f[3][j];
            s += ': ' + getName(ins[0]);
            for (let k = 1; k < ins.length; k++) {
                s += ' ' + ins[k];
            }
            s += '\n';
        }
        programStr += s + '\n';
    }
    return programStr;
}
exports.stringifyProgram = stringifyProgram;
//# sourceMappingURL=util.js.map