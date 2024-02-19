export declare type ThreadId = number;
export interface Scheduler {
    numCurrent(): number;
    currentThreads(): Iterator<ThreadId>;
    numIdle(): number;
    idleThreads(): Iterator<ThreadId>;
    newThread(): ThreadId;
    deleteCurrentThread(id: ThreadId): void;
    runThread(): [ThreadId, number] | null;
    pauseThread(id: ThreadId): void;
}
export declare class RoundRobinScheduler implements Scheduler {
    private _currentThreads;
    private _idleThreads;
    private _maxThreadId;
    private _maxTimeQuanta;
    numCurrent(): number;
    currentThreads(): Iterator<ThreadId>;
    numIdle(): number;
    idleThreads(): Iterator<ThreadId>;
    newThread(): ThreadId;
    deleteCurrentThread(id: ThreadId): void;
    runThread(): [ThreadId, number] | null;
    pauseThread(id: ThreadId): void;
}
