import { Result } from '../src/zem.js';
import { Contract } from '../src/index.js';

async function testWrapProofOfMissingTests() {
    console.log("Running Test B: Proof of missing tests/functionality verification...");

    // This test will pass if we can successfully call wrap and get a contract.
    // It's a "Proof" that the feature exists but we are probing its boundaries.

    const slowFn = async (x) => {
        return new Promise(resolve => setTimeout(() => resolve(x * 2), 100));
    };

    const wrapped = Contract.wrap(slowFn, 50);
    const result = await wrapped(21);

    if (result.isErr() && result.error === "EXPIRED") {
        console.log("Proof Confirmed: wrap returns a contract that expires correctly.");
        return Result.Ok("WRAP_CAPABILITY_VERIFIED");
    }

    return Result.Err("WRAP_FAILED_TO_EXPIRE_AS_EXPECTED");
}

async function testWrapComprehensive() {
    console.log("Running Test A: Comprehensive wrap tests...");

    // 1. Success case: returns Result.Ok
    const fastFn = async (msg) => msg;
    const wrappedFast = Contract.wrap(fastFn, 100);
    const res1 = await wrappedFast("Hello");
    if (res1.isErr()) return Result.Err(`Expect Ok, got Err: ${res1.error}`);
    if (res1.value !== "Hello") return Result.Err("Data mismatch in fast path");

    // 2. Failure case: returns Result.Err
    const failFn = async () => { throw "BOOM"; };
    const wrappedFail = Contract.wrap(failFn, 100);
    const res2 = await wrappedFail();
    if (res2.isOk()) return Result.Err("Expect Err, got Ok");
    if (res2.error !== "BOOM") return Result.Err(`Expect BOOM, got ${res2.error}`);

    // 3. Result preservation: already returns Result
    const resFn = async (val) => Result.Ok(val);
    const wrappedRes = Contract.wrap(resFn, 100);
    const res3 = await wrappedRes(42);
    if (res3.isErr()) return Result.Err("Expect Ok, got Err");
    if (res3.value !== 42) return Result.Err("Result value not preserved");

    // 4. Argument passing
    const multiArgs = async (a, b) => a + b;
    const wrappedMulti = Contract.wrap(multiArgs, 100);
    const res4 = await wrappedMulti(10, 32);
    if (res4.value !== 42) return Result.Err("Arguments not passed correctly");

    // 5. Synchronous function support
    const syncFn = (x) => x * 2;
    const wrappedSync = Contract.wrap(syncFn, 100);
    const res5 = await wrappedSync(21);
    if (res5.isErr()) return Result.Err(`Expect Ok for sync fn, got Err: ${res5.error}`);
    if (res5.value !== 42) return Result.Err("Sync function value mismatch");

    return Result.Ok("All wrap scenarios passed");
}

async function runTests() {
    console.log("--- Initializing Wrap Test Suite ---");

    const results = [
        await testWrapProofOfMissingTests(),
        await testWrapComprehensive()
    ];

    const allPassed = results.every(res => res.isOk());

    results.map((res, i) => {
        const name = i === 0 ? "Test B (Proof)" : "Test A (Solution)";
        if (res.isOk()) {
            console.log(`[PASS] ${name}: ${res.value}`);
        } else {
            console.error(`[FAIL] ${name}: ${res.error}`);
        }
    });

    process.exit(allPassed ? 0 : 1);
}

runTests();
