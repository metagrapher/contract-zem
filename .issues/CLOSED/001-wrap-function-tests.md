# Issue #001: Comprehensive Tests for `wrap` function

## Description
Write comprehensive tests for the `wrap` function in `src/index.js`. 
The `wrap` function converts an async function into a `Contract` returning function.
We need to cover:
- Success cases (returning `Result.Ok`)
- Failure cases (returning `Result.Err` on rejection)
- Timeout cases (returning `Result.Err("EXPIRED")`)
- Handling functions that already return `Result`
- Argument passing integrity

## Status
- [ ] Test A (The Solution): Regression tests for `wrap`.
- [ ] Test B (The Proof): Missing feature proof (currently no tests for `wrap`).

## Metadata
- branch: feat/001-wrap-function-tests
- test_ref: tests/wrap.test.js
