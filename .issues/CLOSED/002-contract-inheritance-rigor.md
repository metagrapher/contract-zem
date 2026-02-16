# Issue #002: Contract Inheritance and Chaining Rigor

## Description
A `Contract` inherits from `Promise`. When `.then()` is called on a `Contract`, JavaScript attempts to return a new `Contract`. However, the `Contract` constructor requires a `timeoutMs` argument which is not provided by the native `.then()` implementation. This results in chained contracts having an `undefined` timeout, causing them to expire instantly.

## Proof
See `test-species.js`. Chaining a contract via `.then()` returns an object that reports being a `Contract` but resolves to `null`/Error immediately due to `undefined` timeout.

## Targeted Solutions
1. **Species Fix**: Use `static get [Symbol.species]() { return Promise; }` to force chains to return naive Promises.
2. **Default Timeout**: Implement a default timeout (e.g., 5000ms) if `timeoutMs` is missing.
3. **Propagated Timeout**: Find a way to propagate the remaining time to the next link in the chain (Complex/Potentially overkill).

## Status
- [ ] Research: Determine if `Contract` should be chainable or if it should act as an atomic "leaf" of a chain.
- [ ] Fix: Implement chosen solution.
