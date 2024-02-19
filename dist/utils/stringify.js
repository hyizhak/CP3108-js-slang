"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lineTreeToString = exports.stringDagToSingleLine = exports.stringDagToLineTree = exports.valueToStringDag = exports.typeToString = exports.stringify = void 0;
const constants_1 = require("../constants");
const closure_1 = require("../interpreter/closure");
const operators_1 = require("./operators");
function isArrayLike(v) {
    return (typeof v.replPrefix === 'string' &&
        typeof v.replSuffix === 'string' &&
        typeof v.replArrayContents === 'function');
}
const stringify = (value, indent = 2, splitlineThreshold = 80) => {
    value = (0, operators_1.forceIt)(value);
    if (typeof indent === 'string') {
        throw 'stringify with arbitrary indent string not supported';
    }
    let indentN = indent;
    if (indent > 10) {
        indentN = 10;
    }
    return lineTreeToString(stringDagToLineTree(valueToStringDag(value), indentN, splitlineThreshold));
};
exports.stringify = stringify;
function typeToString(type) {
    return niceTypeToString(type);
}
exports.typeToString = typeToString;
function niceTypeToString(type, nameMap = { _next: 0 }) {
    function curriedTypeToString(t) {
        return niceTypeToString(t, nameMap);
    }
    switch (type.kind) {
        case 'primitive':
            return type.name;
        case 'variable':
            if (type.constraint && type.constraint !== 'none') {
                return type.constraint;
            }
            if (!(type.name in nameMap)) {
                // type name is not in map, so add it
                nameMap[type.name] = 'T' + nameMap._next++;
            }
            return nameMap[type.name];
        case 'list':
            return `List<${curriedTypeToString(type.elementType)}>`;
        case 'array':
            return `Array<${curriedTypeToString(type.elementType)}>`;
        case 'pair':
            const headType = curriedTypeToString(type.headType);
            // convert [T1 , List<T1>] back to List<T1>
            if (type.tailType.kind === 'list' &&
                headType === curriedTypeToString(type.tailType.elementType))
                return `List<${headType}>`;
            return `[${curriedTypeToString(type.headType)}, ${curriedTypeToString(type.tailType)}]`;
        case 'function':
            let parametersString = type.parameterTypes.map(curriedTypeToString).join(', ');
            if (type.parameterTypes.length !== 1 || type.parameterTypes[0].kind === 'function') {
                parametersString = `(${parametersString})`;
            }
            return `${parametersString} -> ${curriedTypeToString(type.returnType)}`;
        default:
            return 'Unable to infer type';
    }
}
function valueToStringDag(value) {
    const ancestors = new Map();
    const memo = new Map();
    function convertPair(value) {
        const memoResult = memo.get(value);
        if (memoResult !== undefined) {
            return [memoResult, false];
        }
        ancestors.set(value, ancestors.size);
        const elems = value;
        const [headDag, headIsCircular] = convert(elems[0]);
        const [tailDag, tailIsCircular] = convert(elems[1]);
        const isCircular = headIsCircular || tailIsCircular;
        ancestors.delete(value);
        const result = {
            type: 'pair',
            head: headDag,
            tail: tailDag,
            length: headDag.length + tailDag.length + 4
        };
        if (!isCircular) {
            memo.set(value, result);
        }
        return [result, isCircular];
    }
    function convertArrayLike(value, elems, prefix, suffix) {
        const memoResult = memo.get(value);
        if (memoResult !== undefined) {
            return [memoResult, false];
        }
        ancestors.set(value, ancestors.size);
        const converted = elems.map(convert);
        let length = prefix.length + suffix.length + Math.max(0, converted.length - 1) * 2;
        let isCircular = false;
        for (let i = 0; i < converted.length; i++) {
            if (converted[i] == null) {
                // the `elems.map` above preserves the sparseness of the array
                converted[i] = convert(undefined);
            }
            length += converted[i][0].length;
            isCircular || (isCircular = converted[i][1]);
        }
        ancestors.delete(value);
        const result = {
            type: 'arraylike',
            elems: converted.map(c => c[0]),
            prefix: prefix,
            suffix: suffix,
            length: length
        };
        if (!isCircular) {
            memo.set(value, result);
        }
        return [result, isCircular];
    }
    function convertObject(value) {
        const memoResult = memo.get(value);
        if (memoResult !== undefined) {
            return [memoResult, false];
        }
        ancestors.set(value, ancestors.size);
        const entries = Object.entries(value);
        const converted = entries.map(kv => convert(kv[1]));
        let length = 2 + Math.max(0, entries.length - 1) * 2 + entries.length * 2;
        let isCircular = false;
        const kvpairs = [];
        for (let i = 0; i < converted.length; i++) {
            length += entries[i][0].length;
            length += converted[i].length;
            isCircular || (isCircular = converted[i][1]);
            kvpairs.push({
                type: 'kvpair',
                key: entries[i][0],
                value: converted[i][0],
                length: converted[i][0].length + entries[i][0].length
            });
        }
        ancestors.delete(value);
        const result = {
            type: 'arraylike',
            elems: kvpairs,
            prefix: '{',
            suffix: '}',
            length: length
        };
        if (!isCircular) {
            memo.set(value, result);
        }
        return [result, isCircular];
    }
    function convertRepr(repr) {
        const lines = repr.split('\n');
        return lines.length === 1
            ? [{ type: 'terminal', str: lines[0], length: lines[0].length }, false]
            : [{ type: 'multiline', lines, length: Infinity }, false];
    }
    function convert(v) {
        if (v === null) {
            return [{ type: 'terminal', str: 'null', length: 4 }, false];
        }
        else if (v === undefined) {
            return [{ type: 'terminal', str: 'undefined', length: 9 }, false];
        }
        else if (ancestors.has(v)) {
            return [{ type: 'terminal', str: '...<circular>', length: 13 }, true];
        }
        else if (v instanceof closure_1.default) {
            return convertRepr(v.toString());
        }
        else if (typeof v === 'string') {
            const str = JSON.stringify(v);
            return [{ type: 'terminal', str: str, length: str.length }, false];
        }
        else if (typeof v !== 'object') {
            return convertRepr(v.toString());
        }
        else if (ancestors.size > constants_1.MAX_LIST_DISPLAY_LENGTH) {
            return [{ type: 'terminal', str: '...<truncated>', length: 14 }, false];
        }
        else if (typeof v.toReplString === 'function') {
            return convertRepr(v.toReplString());
        }
        else if (Array.isArray(v)) {
            if (v.length === 2) {
                return convertPair(v);
            }
            else {
                return convertArrayLike(v, v, '[', ']');
            }
        }
        else if (isArrayLike(v)) {
            return convertArrayLike(v, v.replArrayContents(), v.replPrefix, v.replSuffix);
        }
        else {
            // use prototype chain to check if it is literal object
            return Object.getPrototypeOf(v) === Object.prototype
                ? convertObject(v)
                : convertRepr(v.toString());
        }
    }
    return convert(value)[0];
}
exports.valueToStringDag = valueToStringDag;
function stringDagToLineTree(dag, indent, splitlineThreshold) {
    // precompute some useful strings
    const indentSpacesMinusOne = ' '.repeat(Math.max(0, indent - 1));
    const bracketAndIndentSpacesMinusOne = '[' + indentSpacesMinusOne;
    const memo = new Map();
    function format(dag) {
        const memoResult = memo.get(dag);
        if (memoResult !== undefined) {
            return memoResult;
        }
        let result;
        if (dag.type === 'terminal') {
            result = { type: 'line', line: dag };
        }
        else if (dag.type === 'multiline') {
            result = {
                type: 'block',
                prefixFirst: '',
                prefixRest: '',
                block: dag.lines.map(s => ({
                    type: 'line',
                    line: { type: 'terminal', str: s, length: s.length }
                })),
                suffixRest: '',
                suffixLast: ''
            };
        }
        else if (dag.type === 'pair') {
            const headTree = format(dag.head);
            const tailTree = format(dag.tail);
            // - 2 is there for backward compatibility
            if (dag.length - 2 > splitlineThreshold ||
                headTree.type !== 'line' ||
                tailTree.type !== 'line') {
                result = {
                    type: 'block',
                    prefixFirst: bracketAndIndentSpacesMinusOne,
                    prefixRest: '',
                    block: [headTree, tailTree],
                    suffixRest: ',',
                    suffixLast: ']'
                };
            }
            else {
                result = {
                    type: 'line',
                    line: dag
                };
            }
        }
        else if (dag.type === 'arraylike') {
            const elemTrees = dag.elems.map(format);
            if (dag.length - dag.prefix.length - dag.suffix.length > splitlineThreshold ||
                elemTrees.some(t => t.type !== 'line')) {
                result = {
                    type: 'block',
                    prefixFirst: dag.prefix + ' '.repeat(Math.max(0, indent - dag.prefix.length)),
                    prefixRest: ' '.repeat(Math.max(dag.prefix.length, indent)),
                    block: elemTrees,
                    suffixRest: ',',
                    suffixLast: dag.suffix
                };
            }
            else {
                result = {
                    type: 'line',
                    line: dag
                };
            }
        }
        else if (dag.type === 'kvpair') {
            const valueTree = format(dag.value);
            if (dag.length > splitlineThreshold || valueTree.type !== 'line') {
                result = {
                    type: 'block',
                    prefixFirst: '',
                    prefixRest: '',
                    block: [
                        { type: 'line', line: { type: 'terminal', str: JSON.stringify(dag.key), length: 0 } },
                        valueTree
                    ],
                    suffixRest: ':',
                    suffixLast: ''
                };
            }
            else {
                result = {
                    type: 'line',
                    line: dag
                };
            }
        }
        else {
            throw 'up';
        }
        memo.set(dag, result);
        return result;
    }
    return format(dag);
}
exports.stringDagToLineTree = stringDagToLineTree;
function stringDagToSingleLine(dag) {
    function print(dag, total) {
        if (dag.type === 'multiline') {
            throw 'Tried to format multiline string as single line string';
        }
        else if (dag.type === 'terminal') {
            total.push(dag.str);
        }
        else if (dag.type === 'pair') {
            total.push('[');
            print(dag.head, total);
            total.push(', ');
            print(dag.tail, total);
            total.push(']');
        }
        else if (dag.type === 'kvpair') {
            total.push(JSON.stringify(dag.key));
            total.push(': ');
            print(dag.value, total);
        }
        else if (dag.type === 'arraylike') {
            total.push(dag.prefix);
            if (dag.elems.length > 0) {
                print(dag.elems[0], total);
            }
            for (let i = 1; i < dag.elems.length; i++) {
                total.push(', ');
                print(dag.elems[i], total);
            }
            total.push(dag.suffix);
        }
        return total;
    }
    return print(dag, []).join('');
}
exports.stringDagToSingleLine = stringDagToSingleLine;
function lineTreeToString(tree) {
    let total = '';
    const stringDagToLineMemo = new Map();
    const stringDagToMultilineMemo = new Map();
    function print(tree, lineSep) {
        const multilineMemoResult = stringDagToMultilineMemo.get(tree);
        if (multilineMemoResult !== undefined) {
            const startEnd = multilineMemoResult.get(lineSep.length);
            if (startEnd !== undefined) {
                total += total.substring(startEnd[0], startEnd[1]);
                return;
            }
        }
        const start = total.length;
        if (tree.type === 'line') {
            if (!stringDagToLineMemo.has(tree.line)) {
                stringDagToLineMemo.set(tree.line, stringDagToSingleLine(tree.line));
            }
            total += stringDagToLineMemo.get(tree.line);
        }
        else if (tree.type === 'block') {
            total += tree.prefixFirst;
            const indentedLineSepFirst = lineSep + ' '.repeat(tree.prefixFirst.length);
            const indentedLineSepRest = lineSep + tree.prefixRest;
            print(tree.block[0], indentedLineSepFirst);
            for (let i = 1; i < tree.block.length; i++) {
                total += tree.suffixRest;
                total += indentedLineSepRest;
                print(tree.block[i], indentedLineSepRest);
            }
            total += tree.suffixLast;
        }
        const end = total.length;
        if (multilineMemoResult === undefined) {
            const newmap = new Map();
            newmap.set(lineSep.length, [start, end]);
            stringDagToMultilineMemo.set(tree, newmap);
        }
        else {
            multilineMemoResult.set(lineSep.length, [start, end]);
        }
    }
    print(tree, '\n');
    return total;
}
exports.lineTreeToString = lineTreeToString;
//# sourceMappingURL=stringify.js.map