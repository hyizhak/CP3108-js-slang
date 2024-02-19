/// <reference types="jest" />
import { ImportTransformOptions } from '../modules/moduleTypes';
import { Chapter, Context, SourceError, Value, Variant } from '../types';
export interface CodeSnippetTestCase {
    name: string;
    snippet: string;
    value: any;
    errors: SourceError[];
}
export interface TestContext extends Context {
    displayResult: string[];
    promptResult: string[];
    alertResult: string[];
    visualiseListResult: Value[];
}
interface TestBuiltins {
    [builtinName: string]: any;
}
interface TestResult {
    code: string;
    displayResult: string[];
    alertResult: string[];
    visualiseListResult: any[];
    errors?: SourceError[];
    numErrors: number;
    parsedErrors: string;
    resultStatus: string;
    result: Value;
}
interface TestOptions {
    context?: TestContext;
    chapter?: Chapter;
    variant?: Variant;
    testBuiltins?: TestBuiltins;
    native?: boolean;
    showTranspiledCode?: boolean;
    showErrorJSON?: boolean;
    importOptions?: Partial<ImportTransformOptions>;
}
export declare function createTestContext({ context, chapter, variant, testBuiltins }?: {
    context?: TestContext;
    chapter?: Chapter;
    variant?: Variant;
    testBuiltins?: TestBuiltins;
}): TestContext;
export declare function testSuccess(code: string, options?: TestOptions): Promise<TestResult>;
export declare function testSuccessWithErrors(code: string, options?: TestOptions): Promise<TestResult>;
export declare function testFailure(code: string, options?: TestOptions): Promise<TestResult>;
export declare function snapshot<T extends {
    [P in keyof TestResult]: any;
}>(propertyMatchers: Partial<T>, snapshotName?: string): (testResult: TestResult) => TestResult;
export declare function snapshot(snapshotName?: string, arg2?: string): (testResult: TestResult) => TestResult;
export declare function snapshotSuccess(code: string, options: TestOptions, snapshotName?: string): Promise<TestResult>;
export declare function snapshotWarning(code: string, options: TestOptions, snapshotName: string): Promise<TestResult>;
export declare function snapshotFailure(code: string, options: TestOptions, snapshotName: string): Promise<TestResult>;
export declare function expectDisplayResult(code: string, options?: TestOptions): jest.AndNot<jest.Matchers<Promise<void>, Promise<void | string[]>>>;
export declare function expectVisualiseListResult(code: string, options?: TestOptions): jest.AndNot<jest.Matchers<Promise<void>, Promise<void | any[]>>>;
export declare function getDisplayResult(code: string, options?: TestOptions): Promise<string[]>;
export declare function expectResult(code: string, options?: TestOptions): jest.AndNot<jest.Matchers<Promise<void>, Promise<any>>>;
export declare function expectParsedErrorNoErrorSnapshot(code: string, options?: TestOptions): jest.AndNot<jest.Matchers<Promise<void>, Promise<string>>>;
export declare function expectParsedError(code: string, options?: TestOptions): jest.AndNot<jest.Matchers<Promise<void>, Promise<string>>>;
export declare function expectDifferentParsedErrors(code1: string, code2: string, options?: TestOptions): jest.AndNot<jest.Matchers<Promise<void>, Promise<void>>>;
export declare function expectWarning(code: string, options?: TestOptions): jest.AndNot<jest.Matchers<Promise<void>, Promise<string>>>;
export declare function expectParsedErrorNoSnapshot(code: string, options?: TestOptions): jest.AndNot<jest.Matchers<Promise<void>, Promise<string>>>;
export declare function expectToMatchJS(code: string, options?: TestOptions): Promise<void>;
export declare function expectToLooselyMatchJS(code: string, options?: TestOptions): Promise<void>;
export declare function expectNativeToTimeoutAndError(code: string, timeout: number): Promise<string>;
export {};
