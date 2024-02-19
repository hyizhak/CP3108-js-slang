"use strict";
// =======================================
// Helper functions/constants for type checker and type error checker
// =======================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTypeOverrides = exports.createTypeEnvironment = exports.source4TypeOverrides = exports.source3TypeOverrides = exports.source2TypeOverrides = exports.source1TypeOverrides = exports.temporaryStreamFuncs = exports.postS3equalityFuncs = exports.preS3equalityFuncs = exports.primitiveFuncs = exports.listFuncs = exports.arrayFuncs = exports.mutatingPairFuncs = exports.pairFuncs = exports.predeclaredNames = exports.tStream = exports.tailType = exports.headType = exports.tPred = exports.tLiteral = exports.tUnion = exports.tFunc = exports.tNull = exports.tVoid = exports.tUndef = exports.tString = exports.tNumber = exports.tBool = exports.tAny = exports.tArray = exports.tForAll = exports.tList = exports.tPair = exports.tAddable = exports.tVar = exports.tPrimitive = exports.formatTypeString = exports.pushEnv = exports.setTypeAlias = exports.setDeclKind = exports.setType = exports.lookupTypeAlias = exports.lookupDeclKind = exports.lookupType = exports.typeAnnotationKeywordToBasicTypeMap = exports.RETURN_TYPE_IDENTIFIER = exports.NEGATIVE_OP = void 0;
// Name of Unary negative builtin operator
exports.NEGATIVE_OP = '-_1';
// Special name used for saving return type in type environment
exports.RETURN_TYPE_IDENTIFIER = '//RETURN_TYPE';
exports.typeAnnotationKeywordToBasicTypeMap = {
    TSAnyKeyword: 'any',
    TSBigIntKeyword: 'bigint',
    TSBooleanKeyword: 'boolean',
    TSNeverKeyword: 'never',
    TSNullKeyword: 'null',
    TSNumberKeyword: 'number',
    TSObjectKeyword: 'object',
    TSStringKeyword: 'string',
    TSSymbolKeyword: 'symbol',
    TSUndefinedKeyword: 'undefined',
    TSUnknownKeyword: 'unknown',
    TSVoidKeyword: 'void'
};
// Helper functions for dealing with type environment
function lookupType(name, env) {
    for (let i = env.length - 1; i >= 0; i--) {
        if (env[i].typeMap.has(name)) {
            return env[i].typeMap.get(name);
        }
    }
    return undefined;
}
exports.lookupType = lookupType;
function lookupDeclKind(name, env) {
    for (let i = env.length - 1; i >= 0; i--) {
        if (env[i].declKindMap.has(name)) {
            return env[i].declKindMap.get(name);
        }
    }
    return undefined;
}
exports.lookupDeclKind = lookupDeclKind;
function lookupTypeAlias(name, env) {
    for (let i = env.length - 1; i >= 0; i--) {
        if (env[i].typeAliasMap.has(name)) {
            return env[i].typeAliasMap.get(name);
        }
    }
    return undefined;
}
exports.lookupTypeAlias = lookupTypeAlias;
function setType(name, type, env) {
    env[env.length - 1].typeMap.set(name, type);
}
exports.setType = setType;
function setDeclKind(name, kind, env) {
    env[env.length - 1].declKindMap.set(name, kind);
}
exports.setDeclKind = setDeclKind;
function setTypeAlias(name, type, env) {
    env[env.length - 1].typeAliasMap.set(name, type);
}
exports.setTypeAlias = setTypeAlias;
function pushEnv(env) {
    env.push({ typeMap: new Map(), declKindMap: new Map(), typeAliasMap: new Map() });
}
exports.pushEnv = pushEnv;
// Helper functions for formatting types
function formatTypeString(type, formatAsLiteral) {
    switch (type.kind) {
        case 'function':
            const paramTypes = type.parameterTypes;
            const paramTypeString = paramTypes
                .map(type => formatTypeString(type, formatAsLiteral))
                .join(', ');
            return `(${paramTypeString}) => ${formatTypeString(type.returnType, formatAsLiteral)}`;
        case 'union':
            // Remove duplicates
            const typeSet = new Set(type.types.map(type => formatTypeString(type, formatAsLiteral)));
            return Array.from(typeSet).join(' | ');
        case 'literal':
            if (typeof type.value === 'string') {
                return `"${type.value.toString()}"`;
            }
            return type.value.toString();
        case 'primitive':
            if (!formatAsLiteral || type.value === undefined) {
                return type.name;
            }
            if (typeof type.value === 'string') {
                return `"${type.value.toString()}"`;
            }
            return type.value.toString();
        case 'pair':
            return `Pair<${formatTypeString(type.headType, formatAsLiteral)}, ${formatTypeString(type.tailType, formatAsLiteral)}>`;
        case 'list':
            return `List<${formatTypeString(type.elementType, formatAsLiteral)}>`;
        case 'array':
            const elementTypeString = formatTypeString(type.elementType, formatAsLiteral);
            return elementTypeString.includes('|') || elementTypeString.includes('=>')
                ? `(${elementTypeString})[]`
                : `${elementTypeString}[]`;
        case 'variable':
            if (type.typeArgs !== undefined && type.typeArgs.length > 0) {
                return `${type.name}<${type.typeArgs
                    .map(param => formatTypeString(param, formatAsLiteral))
                    .join(', ')}>`;
            }
            return type.name;
        default:
            return type;
    }
}
exports.formatTypeString = formatTypeString;
// Helper functions and constants for parsing types
function tPrimitive(name, value) {
    return {
        kind: 'primitive',
        name,
        value
    };
}
exports.tPrimitive = tPrimitive;
function tVar(name, typeArgs) {
    return {
        kind: 'variable',
        name,
        constraint: 'none',
        typeArgs
    };
}
exports.tVar = tVar;
function tAddable(name) {
    return {
        kind: 'variable',
        name,
        constraint: 'addable'
    };
}
exports.tAddable = tAddable;
function tPair(headType, tailType) {
    return {
        kind: 'pair',
        headType,
        tailType
    };
}
exports.tPair = tPair;
function tList(elementType, typeAsPair) {
    return {
        kind: 'list',
        elementType,
        // Used in Source Typed variants to check for type mismatches against pairs
        typeAsPair
    };
}
exports.tList = tList;
function tForAll(polyType, typeParams) {
    return {
        kind: 'forall',
        polyType,
        typeParams
    };
}
exports.tForAll = tForAll;
function tArray(elementType) {
    return {
        kind: 'array',
        elementType
    };
}
exports.tArray = tArray;
exports.tAny = tPrimitive('any');
exports.tBool = tPrimitive('boolean');
exports.tNumber = tPrimitive('number');
exports.tString = tPrimitive('string');
exports.tUndef = tPrimitive('undefined');
exports.tVoid = tPrimitive('void');
exports.tNull = tPrimitive('null');
function tFunc(...types) {
    const parameterTypes = types.slice(0, -1);
    const returnType = types.slice(-1)[0];
    return {
        kind: 'function',
        parameterTypes,
        returnType
    };
}
exports.tFunc = tFunc;
function tUnion(...types) {
    return {
        kind: 'union',
        types
    };
}
exports.tUnion = tUnion;
function tLiteral(value) {
    return {
        kind: 'literal',
        value
    };
}
exports.tLiteral = tLiteral;
function tPred(ifTrueType) {
    return {
        kind: 'predicate',
        ifTrueType
    };
}
exports.tPred = tPred;
exports.headType = tVar('headType');
exports.tailType = tVar('tailType');
// Stream type used in Source Typed
function tStream(elementType) {
    return tFunc(tPair(elementType, tVar('Stream', [elementType])));
}
exports.tStream = tStream;
// Types for preludes
exports.predeclaredNames = [
    // constants
    ['Infinity', tPrimitive('number', Infinity)],
    ['NaN', tPrimitive('number', NaN)],
    ['undefined', exports.tUndef],
    ['math_E', tPrimitive('number', Math.E)],
    ['math_LN2', tPrimitive('number', Math.LN2)],
    ['math_LN10', tPrimitive('number', Math.LN10)],
    ['math_LOG2E', tPrimitive('number', Math.LOG2E)],
    ['math_LOG10E', tPrimitive('number', Math.LOG10E)],
    ['math_PI', tPrimitive('number', Math.PI)],
    ['math_SQRT1_2', tPrimitive('number', Math.SQRT1_2)],
    ['math_SQRT2', tPrimitive('number', Math.SQRT2)],
    // predicate functions
    ['is_boolean', tPred(exports.tBool)],
    ['is_number', tPred(exports.tNumber)],
    ['is_string', tPred(exports.tString)],
    ['is_undefined', tPred(exports.tUndef)],
    ['is_function', tPred(tForAll(tFunc(tVar('T'), tVar('U'))))],
    // math functions
    ['math_abs', tFunc(exports.tNumber, exports.tNumber)],
    ['math_acos', tFunc(exports.tNumber, exports.tNumber)],
    ['math_acosh', tFunc(exports.tNumber, exports.tNumber)],
    ['math_asin', tFunc(exports.tNumber, exports.tNumber)],
    ['math_asinh', tFunc(exports.tNumber, exports.tNumber)],
    ['math_atan', tFunc(exports.tNumber, exports.tNumber)],
    ['math_atan2', tFunc(exports.tNumber, exports.tNumber, exports.tNumber)],
    ['math_atanh', tFunc(exports.tNumber, exports.tNumber)],
    ['math_cbrt', tFunc(exports.tNumber, exports.tNumber)],
    ['math_ceil', tFunc(exports.tNumber, exports.tNumber)],
    ['math_clz32', tFunc(exports.tNumber, exports.tNumber)],
    ['math_cos', tFunc(exports.tNumber, exports.tNumber)],
    ['math_cosh', tFunc(exports.tNumber, exports.tNumber)],
    ['math_exp', tFunc(exports.tNumber, exports.tNumber)],
    ['math_expm1', tFunc(exports.tNumber, exports.tNumber)],
    ['math_floor', tFunc(exports.tNumber, exports.tNumber)],
    ['math_fround', tFunc(exports.tNumber, exports.tNumber)],
    ['math_hypot', tForAll(tVar('T'))],
    ['math_imul', tFunc(exports.tNumber, exports.tNumber, exports.tNumber)],
    ['math_log', tFunc(exports.tNumber, exports.tNumber)],
    ['math_log1p', tFunc(exports.tNumber, exports.tNumber)],
    ['math_log2', tFunc(exports.tNumber, exports.tNumber)],
    ['math_log10', tFunc(exports.tNumber, exports.tNumber)],
    ['math_max', tForAll(tVar('T'))],
    ['math_min', tForAll(tVar('T'))],
    ['math_pow', tFunc(exports.tNumber, exports.tNumber, exports.tNumber)],
    ['math_random', tFunc(exports.tNumber)],
    ['math_round', tFunc(exports.tNumber, exports.tNumber)],
    ['math_sign', tFunc(exports.tNumber, exports.tNumber)],
    ['math_sin', tFunc(exports.tNumber, exports.tNumber)],
    ['math_sinh', tFunc(exports.tNumber, exports.tNumber)],
    ['math_sqrt', tFunc(exports.tNumber, exports.tNumber)],
    ['math_tan', tFunc(exports.tNumber, exports.tNumber)],
    ['math_tanh', tFunc(exports.tNumber, exports.tNumber)],
    ['math_trunc', tFunc(exports.tNumber, exports.tNumber)],
    // misc functions
    ['parse_int', tFunc(exports.tString, exports.tNumber, exports.tNumber)],
    ['prompt', tFunc(exports.tString, exports.tString)],
    ['get_time', tFunc(exports.tNumber)],
    ['stringify', tForAll(tFunc(tVar('T'), exports.tString))],
    ['display', tForAll(tVar('T'))],
    ['error', tForAll(tVar('T'))]
];
exports.pairFuncs = [
    ['pair', tForAll(tFunc(exports.headType, exports.tailType, tPair(exports.headType, exports.tailType)))],
    ['head', tForAll(tFunc(tPair(exports.headType, exports.tailType), exports.headType))],
    ['tail', tForAll(tFunc(tPair(exports.headType, exports.tailType), exports.tailType))],
    ['is_pair', tPred(tForAll(tPair(exports.headType, exports.tailType)))],
    ['is_null', tPred(tForAll(tList(tVar('T'))))],
    ['is_list', tPred(tForAll(tList(tVar('T'))))]
];
exports.mutatingPairFuncs = [
    ['set_head', tForAll(tFunc(tPair(exports.headType, exports.tailType), exports.headType, exports.tUndef))],
    ['set_tail', tForAll(tFunc(tPair(exports.headType, exports.tailType), exports.tailType, exports.tUndef))]
];
exports.arrayFuncs = [
    ['is_array', tPred(tForAll(tArray(tVar('T'))))],
    ['array_length', tForAll(tFunc(tArray(tVar('T')), exports.tNumber))]
];
exports.listFuncs = [['list', tForAll(tVar('T1'))]];
exports.primitiveFuncs = [
    [exports.NEGATIVE_OP, tFunc(exports.tNumber, exports.tNumber)],
    ['!', tFunc(exports.tBool, exports.tBool)],
    ['&&', tForAll(tFunc(exports.tBool, tVar('T'), tVar('T')))],
    ['||', tForAll(tFunc(exports.tBool, tVar('T'), tVar('T')))],
    ['<', tForAll(tFunc(tAddable('A'), tAddable('A'), exports.tBool))],
    ['<=', tForAll(tFunc(tAddable('A'), tAddable('A'), exports.tBool))],
    ['>', tForAll(tFunc(tAddable('A'), tAddable('A'), exports.tBool))],
    ['>=', tForAll(tFunc(tAddable('A'), tAddable('A'), exports.tBool))],
    ['+', tForAll(tFunc(tAddable('A'), tAddable('A'), tAddable('A')))],
    ['%', tFunc(exports.tNumber, exports.tNumber, exports.tNumber)],
    ['-', tFunc(exports.tNumber, exports.tNumber, exports.tNumber)],
    ['*', tFunc(exports.tNumber, exports.tNumber, exports.tNumber)],
    ['/', tFunc(exports.tNumber, exports.tNumber, exports.tNumber)]
];
// Source 2 and below restricts === to addables
exports.preS3equalityFuncs = [
    ['===', tForAll(tFunc(tAddable('A'), tAddable('A'), exports.tBool))],
    ['!==', tForAll(tFunc(tAddable('A'), tAddable('A'), exports.tBool))]
];
// Source 3 and above allows any values as arguments for ===
exports.postS3equalityFuncs = [
    ['===', tForAll(tFunc(tVar('T1'), tVar('T2'), exports.tBool))],
    ['!==', tForAll(tFunc(tVar('T1'), tVar('T2'), exports.tBool))]
];
exports.temporaryStreamFuncs = [
    ['is_stream', tForAll(tFunc(tVar('T1'), exports.tBool))],
    ['list_to_stream', tForAll(tFunc(tList(tVar('T1')), tVar('T2')))],
    ['stream_to_list', tForAll(tFunc(tVar('T1'), tList(tVar('T2'))))],
    ['stream_length', tForAll(tFunc(tVar('T1'), exports.tNumber))],
    ['stream_map', tForAll(tFunc(tVar('T1'), tVar('T2')))],
    ['build_stream', tForAll(tFunc(exports.tNumber, tFunc(exports.tNumber, tVar('T1')), tVar('T2')))],
    ['stream_for_each', tForAll(tFunc(tFunc(tVar('T1'), tVar('T2')), exports.tBool))],
    ['stream_reverse', tForAll(tFunc(tVar('T1'), tVar('T1')))],
    ['stream_append', tForAll(tFunc(tVar('T1'), tVar('T1'), tVar('T1')))],
    ['stream_member', tForAll(tFunc(tVar('T1'), tVar('T2'), tVar('T2')))],
    ['stream_remove', tForAll(tFunc(tVar('T1'), tVar('T2'), tVar('T2')))],
    ['stream_remove_all', tForAll(tFunc(tVar('T1'), tVar('T2'), tVar('T2')))],
    ['stream_filter', tForAll(tFunc(tFunc(tVar('T1'), exports.tBool), tVar('T2'), tVar('T2')))],
    ['enum_stream', tForAll(tFunc(exports.tNumber, exports.tNumber, tVar('T1')))],
    ['integers_from', tForAll(tFunc(exports.tNumber, tVar('T1')))],
    ['eval_stream', tForAll(tFunc(tVar('T1'), exports.tNumber, tList(tVar('T2'))))],
    ['stream_ref', tForAll(tFunc(tVar('T1'), exports.tNumber, tVar('T2')))]
];
// Prelude function type overrides for Source Typed variant
// No need to override predicate functions as they are automatically handled by type checker
exports.source1TypeOverrides = [
    // math functions
    // TODO: Add support for type checking of functions with variable no. of args
    ['math_hypot', tForAll(exports.tNumber)],
    ['math_max', tForAll(exports.tNumber)],
    ['math_min', tForAll(exports.tNumber)],
    // misc functions
    ['stringify', tFunc(exports.tAny, exports.tString)],
    ['arity', tFunc(exports.tAny, exports.tNumber)],
    ['char_at', tFunc(exports.tString, exports.tNumber, tUnion(exports.tString, exports.tUndef))],
    // TODO: Add support for type checking of functions with variable no. of args
    ['display', tForAll(exports.tAny)],
    ['error', tForAll(exports.tAny)]
];
exports.source2TypeOverrides = [
    // list library functions
    [
        'accumulate',
        tForAll(tFunc(tFunc(tVar('T'), tVar('U'), tVar('U')), tVar('U'), tList(tVar('T')), tVar('U')))
    ],
    [
        'append',
        tForAll(tFunc(tList(tVar('T')), tList(tVar('U')), tList(tUnion(tVar('T'), tVar('U')))))
    ],
    ['build_list', tForAll(tFunc(tFunc(exports.tNumber, tVar('T')), exports.tNumber, tList(tVar('T'))))],
    ['enum_list', tFunc(exports.tNumber, exports.tNumber, tList(exports.tNumber))],
    ['filter', tForAll(tFunc(tFunc(tVar('T'), exports.tBool), tList(tVar('T')), tList(tVar('T'))))],
    ['for_each', tForAll(tFunc(tFunc(tVar('T'), exports.tAny), tList(tVar('T')), tLiteral(true)))],
    ['length', tFunc(tList(exports.tAny), exports.tNumber)],
    ['list_ref', tForAll(tFunc(tList(tVar('T')), exports.tNumber, tVar('T')))],
    ['list_to_string', tFunc(tList(exports.tAny), exports.tString)],
    ['map', tForAll(tFunc(tFunc(tVar('T'), tVar('U')), tList(tVar('T')), tList(tVar('U'))))],
    ['member', tForAll(tFunc(tVar('T'), tList(tVar('T')), tList(tVar('T'))))],
    ['remove', tForAll(tFunc(tVar('T'), tList(tVar('T')), tList(tVar('T'))))],
    ['remove_all', tForAll(tFunc(tVar('T'), tList(tVar('T')), tList(tVar('T'))))],
    ['reverse', tForAll(tFunc(tList(tVar('T')), tList(tVar('T'))))],
    // misc functions
    // TODO: Add support for type checking of functions with variable no. of args
    ['display_list', tForAll(exports.tAny)],
    ['draw_data', tForAll(exports.tAny)],
    ['equal', tFunc(exports.tAny, exports.tAny, exports.tBool)]
];
exports.source3TypeOverrides = [
    // array functions
    ['array_length', tFunc(tArray(exports.tAny), exports.tNumber)],
    // stream library functions
    ['build_stream', tForAll(tFunc(tFunc(exports.tNumber, tVar('T')), exports.tNumber, tStream(tVar('T'))))],
    ['enum_stream', tFunc(exports.tNumber, exports.tNumber, tStream(exports.tNumber))],
    ['eval_stream', tForAll(tFunc(tStream(tVar('T')), exports.tNumber, tList(tVar('T'))))],
    ['integers_from', tFunc(exports.tNumber, tStream(exports.tNumber))],
    ['is_stream', tFunc(exports.tAny, exports.tBool)],
    ['list_to_stream', tForAll(tFunc(tList(tVar('T')), tStream(tVar('T'))))],
    [
        'stream_append',
        tForAll(tFunc(tStream(tVar('T')), tStream(tVar('U')), tStream(tUnion(tVar('T'), tVar('U')))))
    ],
    [
        'stream_filter',
        tForAll(tFunc(tFunc(tVar('T'), exports.tBool), tStream(tVar('T')), tStream(tVar('T'))))
    ],
    ['stream_for_each', tForAll(tFunc(tFunc(tVar('T'), exports.tAny), tStream(tVar('T')), tLiteral(true)))],
    ['stream_length', tFunc(tStream(exports.tAny), exports.tNumber)],
    [
        'stream_map',
        tForAll(tFunc(tFunc(tVar('T'), tVar('U')), tStream(tVar('T')), tStream(tVar('U'))))
    ],
    ['stream_member', tForAll(tFunc(tVar('T'), tStream(tVar('T')), tStream(tVar('T'))))],
    ['stream_ref', tForAll(tFunc(tStream(tVar('T')), exports.tNumber, tVar('T')))],
    ['stream_remove', tForAll(tFunc(tVar('T'), tStream(tVar('T')), tStream(tVar('T'))))],
    ['stream_remove_all', tForAll(tFunc(tVar('T'), tStream(tVar('T')), tStream(tVar('T'))))],
    ['stream_reverse', tForAll(tFunc(tStream(tVar('T')), tStream(tVar('T'))))],
    ['stream_tail', tForAll(tFunc(tStream(tVar('T')), tStream(tVar('T'))))],
    ['stream_to_list', tForAll(tFunc(tStream(tVar('T')), tList(tVar('T'))))]
];
exports.source4TypeOverrides = [
    ['apply_in_underlying_javascript', tFunc(exports.tAny, tList(exports.tAny), exports.tAny)],
    ['tokenize', tFunc(exports.tString, tList(exports.tString))],
    // For parse tree types, see parseTreeTypes.prelude.ts
    ['parse', tFunc(exports.tString, tUnion(tVar('Program', []), tVar('Statement', [])))]
];
const predeclaredConstTypes = [
    ['Infinity', tLiteral(Infinity)],
    ['NaN', tLiteral(NaN)],
    ['math_E', tLiteral(Math.E)],
    ['math_LN2', tLiteral(Math.LN2)],
    ['math_LN10', tLiteral(Math.LN10)],
    ['math_LOG2E', tLiteral(Math.LOG2E)],
    ['math_LOG10E', tLiteral(Math.LOG10E)],
    ['math_PI', tLiteral(Math.PI)],
    ['math_SQRT1_2', tLiteral(Math.SQRT1_2)],
    ['math_SQRT2', tLiteral(Math.SQRT2)]
];
const pairTypeAlias = [
    'Pair',
    tForAll(tPair(exports.headType, exports.tailType), [exports.headType, exports.tailType])
];
const listTypeAlias = ['List', tForAll(tList(tVar('T')), [tVar('T')])];
const streamTypeAlias = ['Stream', tForAll(tStream(tVar('T')), [tVar('T')])];
// Creates type environment for the appropriate Source chapter
function createTypeEnvironment(chapter) {
    const initialTypeMappings = [...exports.predeclaredNames, ...exports.primitiveFuncs];
    const initialTypeAliasMappings = [...predeclaredConstTypes];
    if (chapter >= 2) {
        initialTypeMappings.push(...exports.pairFuncs, ...exports.listFuncs);
        initialTypeAliasMappings.push(pairTypeAlias, listTypeAlias);
    }
    if (chapter >= 3) {
        initialTypeMappings.push(...exports.postS3equalityFuncs, ...exports.mutatingPairFuncs, ...exports.arrayFuncs);
        initialTypeAliasMappings.push(streamTypeAlias);
    }
    else {
        initialTypeMappings.push(...exports.preS3equalityFuncs);
    }
    return [
        {
            typeMap: new Map(initialTypeMappings),
            declKindMap: new Map(initialTypeMappings.map(val => [val[0], 'const'])),
            typeAliasMap: new Map(initialTypeAliasMappings)
        }
    ];
}
exports.createTypeEnvironment = createTypeEnvironment;
function getTypeOverrides(chapter) {
    const typeOverrides = [...exports.source1TypeOverrides];
    if (chapter >= 2) {
        typeOverrides.push(...exports.source2TypeOverrides);
    }
    if (chapter >= 3) {
        typeOverrides.push(...exports.source3TypeOverrides);
    }
    if (chapter >= 4) {
        typeOverrides.push(...exports.source4TypeOverrides);
    }
    return typeOverrides;
}
exports.getTypeOverrides = getTypeOverrides;
//# sourceMappingURL=utils.js.map