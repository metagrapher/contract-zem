import { Contract } from '../src/index.js';
import { Result } from '../src/zem.js';

async function testInheritanceIdentity() {
    console.log("Running Test B: Verifying Contract identity persistence...");

    const c = new Contract((resolve) => resolve(Result.Ok("Base")), 100);
    const chained = c.then(res => res);

    if (!(chained instanceof Contract)) {
        return Result.Err("Regression: Chained promise lost Contract identity");
    }

    const val = await chained;
    if (val.isErr()) {
        return Result.Err(`Chained contract should NOT have expired: ${val.error}`);
    }

    return Result.Ok("Inheritance verified: chains remain Contracts with valid timeouts.");
}

async function testDeadlinePropagation() {
    console.log("Running Test A: Verifying shared deadline propagation...");

    const TIMEOUT = 100;
    const c = new Contract((resolve) => {
        // Resolve exactly halfway through the timeout
        setTimeout(() => resolve(Result.Ok("First")), 50);
    }, TIMEOUT);

    const start = Date.now();
    const chained = c.then(async (res) => {
        // The chain should still share the ORIGINAL deadline.
        // If we wait another 60ms, the chain should expire because 50 + 60 > 100.
        await new Promise(r => setTimeout(r, 60));
        return res;
    });

    const result = await chained;
    const elapsed = Date.now() - start;

    if (result.isOk()) {
        return Result.Err(`Expect EXPIRED, but got Ok (elapsed: ${elapsed}ms). The deadline was likely reset.`);
    }

    if (result.error !== "EXPIRED") {
        return Result.Err(`Expect EXPIRED, got ${result.error}`);
    }

    console.log(`Verified: Chain expired correctly at ${elapsed}ms based on original deadline.`);
    return Result.Ok("Deadline successfully shared across the chain.");
}

async function testDefaultTimeout() {
    console.log("Running Test A: Verifying default timeout on chains...");

    // Create a contract, chain it, and ensure the chain doesn't die at 0ms.
    const start = Date.now();
    const c = new Contract((resolve) => setTimeout(() => resolve(Result.Ok("Done")), 50), 100);

    // This chain will call `new Contract(exec, undefined)` internally.
    // It should use the DEFAULT_TIMEOUT (5000ms).
    const chained = c.then(res => res);

    const result = await chained;
    const elapsed = Date.now() - start;

    if (result.isErr()) {
        return Result.Err(`Expect Ok, got Err: ${result.error} after ${elapsed}ms`);
    }

    if (result.value !== "Done") {
        return Result.Err("Data mismatch in chain");
    }

    return Result.Ok("Default timeout correctly prevents instant expiration in chains.");
}

async function runTests() {
    console.log("--- Initializing Inheritance Test Suite ---");

    const results = [
        await testInheritanceIdentity(),
        await testDeadlinePropagation()
    ];

    const allPassed = results.every(res => res.isOk());

    results.map((res, i) => {
        const name = i === 0 ? "Test B (Identity)" : "Test A (DeadlinePropagation)";
        if (res.isOk()) {
            console.log(`[PASS] ${name}: ${res.value}`);
        } else {
            console.error(`[FAIL] ${name}: ${res.error}`);
        }
    });

    process.exit(allPassed ? 0 : 1);
}

runTests();
