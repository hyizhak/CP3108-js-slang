"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoundRobinScheduler = void 0;
class RoundRobinScheduler {
    constructor() {
        this._currentThreads = new Set();
        this._idleThreads = [];
        this._maxThreadId = -1;
        this._maxTimeQuanta = 15;
    }
    // Get number of currently executing threads
    numCurrent() {
        return this._currentThreads.size;
    }
    // Get currently executing threads
    // list might be empty (none executing) or have more than 1 thread (parallelism?)
    currentThreads() {
        return this._currentThreads.values();
    }
    // Get number of idle threads
    numIdle() {
        return this._idleThreads.length;
    }
    // Get idle thread list
    idleThreads() {
        return this._idleThreads.values();
    }
    // Register a new thread into the scheduler (thread has never run before)
    // Returns the thread id this new thread should be associated with
    newThread() {
        this._maxThreadId++;
        this._idleThreads.push(this._maxThreadId);
        return this._maxThreadId;
    }
    // Unregister a thread from the scheduler (end of life/killed)
    // Thread should be currently executing
    deleteCurrentThread(id) {
        this._currentThreads.delete(id);
    }
    // Get which thread should be executed next, and for how long
    // null means there are no idle threads to run
    runThread() {
        if (this._idleThreads.length === 0) {
            return null;
        }
        else {
            const nextThread = this._idleThreads.shift();
            const timeQuanta = Math.ceil((0.5 + Math.random() * 0.5) * this._maxTimeQuanta);
            this._currentThreads.add(nextThread);
            return [nextThread, timeQuanta];
        }
    }
    // Tell scheduler which thread should be paused and placed back into the idle threads.
    pauseThread(id) {
        this._currentThreads.delete(id);
        this._idleThreads.push(id);
    }
}
exports.RoundRobinScheduler = RoundRobinScheduler;
//# sourceMappingURL=svml-scheduler.js.map