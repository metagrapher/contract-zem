import { Result } from './zem.js';

const DEFAULT_TIMEOUT = 5000;

/**
 * A Contract is a Promise with a guaranteed expiration time.
 * It returns a Result<T, E>.
 */
export class Contract extends Promise {
    /**
     * @param {Function} executor - (resolve, reject) => void
     * @param {number} [timeoutMs] - expiration time in milliseconds
     */
    constructor(executor, timeoutMs) {
        let timeoutId;

        // We wrap the executor to handle the timeout logic
        const wrappedExecutor = (resolve, reject) => {
            const delay = timeoutMs ?? DEFAULT_TIMEOUT;

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
    }

    get [Symbol.toStringTag]() {
        return 'Contract';
    }

    /**
     * Chains a decoration to the contract with a fresh timeout.
     */
    then(onFulfilled, onRejected, timeoutMs) {
        // Handle (onFulfilled, timeoutMs) signature
        if (typeof onRejected === 'number' && timeoutMs === undefined) {
            timeoutMs = onRejected;
            onRejected = null;
        }

        return new Contract((resolve) => {
            super.then(
                (result) => {
                    // We wrap the callback in a Promise to safely capture any throws
                    // into a Result.Err, ensuring no exceptions escape the monad.
                    Promise.resolve()
                        .then(() => (onFulfilled ? onFulfilled(result) : result))
                        .then(
                            (nextValue) => {
                                const finalResult = nextValue instanceof Result ? nextValue : Result.Ok(nextValue);
                                resolve(finalResult);
                            },
                            (err) => resolve(Result.Err(err))
                        );
                },
                (err) => {
                    Promise.resolve()
                        .then(() => (onRejected ? onRejected(err) : Result.Err(err)))
                        .then(
                            (nextValue) => {
                                const finalResult = nextValue instanceof Result ? nextValue : Result.Ok(nextValue);
                                resolve(finalResult);
                            },
                            (e) => resolve(Result.Err(e))
                        );
                }
            );
        }, timeoutMs);
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

