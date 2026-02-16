---
title: WASM Performance Kernel & Timer Pooling
status: OPEN
priority: MEDIUM
test_ref: tests/performance.test.js
---

## Problem
The current `Contract` implementation in JavaScript incurs a ~1.2µs overhead per chain link due to:
1. Subclassing `Promise` (V8 internal overhead).
2. Closure creation for executor wrapping.
3. Native `setTimeout` overhead (OS-level timer syscalls).

## Proposed Solution
Implement a **WASM Kernel** to manage contract state and timeouts.

### Objectives
1. **Timer Pooling**: Instead of millions of `setTimeout` calls, use a single WASM Binary Heap to track expiration times. A single JS-side `requestAnimationFrame` or `setTimeout(0)` will poll the kernel.
2. **Memory Efficiency**: Store `Result` states in a shared linear memory buffer to reduce GC pressure.
3. **FFI Strategy**: Minimize JS-WASM transitions. Batch contract resolutions where possible.

## Verification
- Run `tests/performance.test.js` and compare JS vs WASM.
- Target: < 100ns overhead per chain.
