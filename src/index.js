import { Result } from './zem.js';

/**
 * A Contract is a Promise with a guaranteed expiration time.
 * It returns a Result<T, E>.
 */
export class Contract extends Promise {
    /**
     * @param {Function} executor - (resolve, reject) => void
     * @param {number} timeoutMs - expiration time in milliseconds
     */
    constructor(executor, timeoutMs) {
        let timeoutId;

        // We wrap the executor to handle the timeout logic
        const wrappedExecutor = (resolve, reject) => {
            // Setup the timeout
            timeoutId = setTimeout(() => {
                resolve(Result.Err("EXPIRED"));
            }, timeoutMs);

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
        this.timeoutMs = timeoutMs;
    }

    get [Symbol.toStringTag]() {
        return 'Contract';
    }
}


/**
 * Wraps an async function to return a Contract.
 * @param {Function} asyncFn 
 * @param {number} timeoutMs 
 * @returns {Function}
 */
export function wrap(asyncFn, timeoutMs) {
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

