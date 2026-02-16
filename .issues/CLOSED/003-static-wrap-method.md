# Issue #003: Refactor `wrap` to `Contract.wrap` static method

## Description
Move the standalone `wrap` function in `src/index.js` to be a static method of the `Contract` class. This aligns with the ZEM philosophy of treating the `Contract` class as the primary entry point for duration-based results.

## Status
- [ ] Test A (The Solution): Update tests to use `Contract.wrap` and confirm identical behavior.
- [ ] Test B (The Proof): The current standalone `wrap` will be deprecated/removed.
- [ ] Fix: Move the function inside the `Contract` class and update exports.

## Metadata
- branch: feat/003-static-wrap-method
- test_ref: tests/wrap.test.js
