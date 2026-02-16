import { Result } from './zem.js';

const DEFAULT_TIMEOUT = 5000;

/**
 * A Contract is a Promise with a guaranteed expiration time.
 * It returns a Result<T, E>.
 */
export class Contract extends Promise {
    /**
     * @param {Function} executor - (resolve, reject) => void
     * @param {number|Date} timeoutOrDeadline - expiration time or specific deadline
     */
    constructor(executor, timeoutOrDeadline) {
        let deadline;
        if (timeoutOrDeadline instanceof Date) {
            deadline = timeoutOrDeadline;
        } else {
            deadline = new Date(Date.now() + (timeoutOrDeadline ?? DEFAULT_TIMEOUT));
        }

        let timeoutId;

        // We wrap the executor to handle the timeout logic
        const wrappedExecutor = (resolve, reject) => {
            const now = Date.now();
            const delay = Math.max(0, deadline.getTime() - now);

            // Setup the timeout
            timeoutId = setTimeout(() => {
                resolve(Result.Err("EXPIRED"));
            }, delay);

            // Call the original executor
            executor(
                (value) => {
                    clearTimeout(timeoutId);
                    resolve(value);
                },
                (err) => {
                    clearTimeout(timeoutId);
                    // In ZEM, we prefer resolving with Err than rejecting
                    resolve(Result.Err(err));
                }
            );
        };

        super(wrappedExecutor);
        this.deadline = deadline;
    }

    get [Symbol.toStringTag]() {
        return 'Contract';
    }

    /**
     * Chains a decoration to the contract, propagating the same deadline.
     */
    then(onFulfilled, onRejected, timeoutMs) {
        return new Contract((resolve) => {
            super.then(
                async (result) => {
                    try {
                        const nextValue = onFulfilled ? await onFulfilled(result) : result;
                        const finalResult = nextValue instanceof Result ? nextValue : Result.Ok(nextValue);
                        resolve(finalResult);
                    } catch (err) {
                        resolve(Result.Err(err));
                    }
                },
                async (err) => {
                    try {
                        const nextValue = onRejected ? await onRejected(err) : Result.Err(err);
                        const finalResult = nextValue instanceof Result ? nextValue : Result.Ok(nextValue);
                        resolve(finalResult);
                    } catch (e) {
                        resolve(Result.Err(e));
                    }
                }
            );
        }, timeoutMs ?? this.deadline);
    }

    /**
     * Standard catch wrapper that returns a Contract.
     */
    catch(onRejected, timeoutMs) {
        return this.then(null, onRejected, timeoutMs);
    }

    /**
     * Wraps an async function to return a Contract.
     * @param {Function} asyncFn 
     * @param {number} timeoutMs 
     * @returns {Function}
     */
    static wrap(asyncFn, timeoutMs) {
        return (...args) => {
            return new Contract((resolve) => {
                Promise.resolve()
                    .then(() => asyncFn(...args))
                    .then((value) => {
                        const result = value instanceof Result ? value : Result.Ok(value);
                        resolve(result);
                    })
                    .catch((err) => {
                        resolve(Result.Err(err));
                    });
            }, timeoutMs);
        };
    }
}

