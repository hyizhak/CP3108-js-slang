import { Pair } from './scheme-base';
export declare let dotted_listQ: (list: Pair) => boolean;
export declare let filter: (predicate: (x: any) => boolean, list: Pair) => Pair | null;
export declare let fold: (f: Function, init: any, ...lists: Pair[]) => any;
export declare let fold_right: (f: Function, init: any, ...lists: Pair[]) => any;
export declare let reduce: (f: (a: any, b: any) => any, rIdentity: any, list: Pair) => any;
export declare let reduce_right: (f: (a: any, b: any) => any, rIdentity: any, list: Pair) => any;
