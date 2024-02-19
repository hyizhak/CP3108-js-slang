import type * as es from 'estree';
export declare const isImportDeclaration: (node: es.Program['body'][0]) => node is es.ImportDeclaration;
export declare const isDirective: (node: es.Node) => node is es.Directive;
export declare const isModuleDeclaration: (node: es.Node) => node is es.ModuleDeclaration;
export declare const isStatement: (node: es.Directive | es.Statement | es.ModuleDeclaration) => node is es.Statement;
export declare function isDeclaration(node: es.Node): node is es.Declaration;
