"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.arrayMapFrom = void 0;
/**
 * Convenience class for maps that store an array of values
 */
class ArrayMap {
    constructor(map = new Map()) {
        this.map = map;
    }
    get(key) {
        return this.map.get(key);
    }
    add(key, item) {
        if (!this.map.has(key)) {
            this.map.set(key, []);
        }
        this.map.get(key).push(item);
    }
    entries() {
        return Array.from(this.map.entries());
    }
    keys() {
        return new Set(this.map.keys());
    }
    /**
     * Similar to `mapAsync`, but for an async mapping function that does not return any value
     */
    forEachAsync(forEach) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(this.entries().map(([key, value]) => forEach(key, value)));
        });
    }
    /**
     * Using a mapping function that returns a promise, transform an array map
     * to another array map with different keys and values. All calls to the mapping function
     * execute asynchronously
     */
    mapAsync(mapper) {
        return __awaiter(this, void 0, void 0, function* () {
            const pairs = yield Promise.all(this.entries().map(([key, value]) => mapper(key, value)));
            const tempMap = new Map(pairs);
            return new ArrayMap(tempMap);
        });
    }
    [Symbol.toStringTag]() {
        return this.entries().map(([key, value]) => `${key}: ${value}`);
    }
}
exports.default = ArrayMap;
function arrayMapFrom(pairs) {
    const res = new ArrayMap();
    for (const [k, v] of pairs) {
        if (Array.isArray(v)) {
            for (const each of v) {
                res.add(k, each);
            }
        }
        else {
            res.add(k, v);
        }
    }
    return res;
}
exports.arrayMapFrom = arrayMapFrom;
//# sourceMappingURL=arrayMap.js.map