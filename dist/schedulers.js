"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreemptiveScheduler = exports.NonDetScheduler = exports.AsyncScheduler = void 0;
/* tslint:disable:max-classes-per-file */
const errors_1 = require("./errors/errors");
const inspector_1 = require("./stdlib/inspector");
class AsyncScheduler {
    run(it, context) {
        return new Promise((resolve, _reject) => {
            context.runtime.isRunning = true;
            let itValue = it.next();
            try {
                while (!itValue.done) {
                    itValue = it.next();
                    if (context.runtime.break) {
                        (0, inspector_1.saveState)(context, it, this);
                        itValue.done = true;
                    }
                }
            }
            catch (e) {
                resolve({ status: 'error' });
            }
            finally {
                context.runtime.isRunning = false;
            }
            if (context.runtime.break) {
                resolve({
                    status: 'suspended',
                    it,
                    scheduler: this,
                    context
                });
            }
            else {
                resolve({ status: 'finished', context, value: itValue.value });
            }
        });
    }
}
exports.AsyncScheduler = AsyncScheduler;
class NonDetScheduler {
    run(it, context) {
        return new Promise((resolve, _reject) => {
            try {
                const itValue = it.next();
                if (itValue.done) {
                    resolve({ status: 'finished', context, value: itValue.value });
                }
                else {
                    resolve({
                        status: 'suspended-non-det',
                        it,
                        scheduler: this,
                        context,
                        value: itValue.value
                    });
                }
            }
            catch (e) {
                checkForStackOverflow(e, context);
                resolve({ status: 'error' });
            }
            finally {
                context.runtime.isRunning = false;
            }
        });
    }
}
exports.NonDetScheduler = NonDetScheduler;
class PreemptiveScheduler {
    constructor(steps) {
        this.steps = steps;
    }
    run(it, context) {
        return new Promise((resolve, _reject) => {
            context.runtime.isRunning = true;
            // This is used in the evaluation of the REPL during a paused state.
            // The debugger is turned off while the code evaluates just above the debugger statement.
            let actuallyBreak = false;
            let itValue = it.next();
            const interval = setInterval(() => {
                let step = 0;
                try {
                    while (!itValue.done && step < this.steps) {
                        step++;
                        itValue = it.next();
                        actuallyBreak = context.runtime.break && context.runtime.debuggerOn;
                        if (actuallyBreak) {
                            itValue.done = true;
                        }
                    }
                    (0, inspector_1.saveState)(context, it, this);
                }
                catch (e) {
                    checkForStackOverflow(e, context);
                    context.runtime.isRunning = false;
                    clearInterval(interval);
                    resolve({ status: 'error' });
                }
                if (itValue.done) {
                    context.runtime.isRunning = false;
                    clearInterval(interval);
                    if (actuallyBreak) {
                        resolve({
                            status: 'suspended',
                            it,
                            scheduler: this,
                            context
                        });
                    }
                    else {
                        resolve({ status: 'finished', context, value: itValue.value });
                    }
                }
            });
        });
    }
}
exports.PreemptiveScheduler = PreemptiveScheduler;
/* Checks if the error is a stackoverflow error, and captures it in the
   context if this is the case */
function checkForStackOverflow(error, context) {
    if (/Maximum call stack/.test(error.toString())) {
        const environments = context.runtime.environments;
        const stacks = [];
        let counter = 0;
        for (let i = 0; counter < errors_1.MaximumStackLimitExceeded.MAX_CALLS_TO_SHOW && i < environments.length; i++) {
            if (environments[i].callExpression) {
                stacks.unshift(environments[i].callExpression);
                counter++;
            }
        }
        context.errors.push(new errors_1.MaximumStackLimitExceeded(context.runtime.nodes[0], stacks));
    }
}
//# sourceMappingURL=schedulers.js.map