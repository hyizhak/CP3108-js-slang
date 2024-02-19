/**
 * Convenience class for maps that store an array of values
 */
export default class ArrayMap<K, V> {
    private readonly map;
    constructor(map?: Map<K, V[]>);
    get(key: K): V[] | undefined;
    add(key: K, item: V): void;
    entries(): [K, V[]][];
    keys(): Set<K>;
    /**
     * Similar to `mapAsync`, but for an async mapping function that does not return any value
     */
    forEachAsync<F extends (k: K, v: V[]) => Promise<void>>(forEach: F): Promise<void>;
    /**
     * Using a mapping function that returns a promise, transform an array map
     * to another array map with different keys and values. All calls to the mapping function
     * execute asynchronously
     */
    mapAsync<F extends (k: K, v: V[]) => Promise<[any, any[]]>>(mapper: F): Promise<ArrayMap<Awaited<ReturnType<F>>[0], Awaited<ReturnType<F>>[1][number]>>;
    [Symbol.toStringTag](): string[];
}
/**
 * Create an ArrayMap from an iterable of key value pairs
 */
export declare function arrayMapFrom<K, V extends Array<any>>(pairs: Iterable<[K, V]>): ArrayMap<K, V[number]>;
export declare function arrayMapFrom<K, V>(pairs: Iterable<[K, V]>): ArrayMap<K, V>;
