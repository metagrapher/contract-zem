import { Contract } from '../src/index.js';
import { Result } from '../src/zem.js';

async function testInheritanceIdentity() {
    console.log("Running Test 1: Verifying Contract identity persistence...");

    const c = new Contract((resolve) => resolve(Result.Ok("Base")), 100);
    const chained = c.then(res => res);

    if (!(chained instanceof Contract)) {
        return Result.Err("Regression: Chained promise lost Contract identity");
    }

    const val = await chained;
    if (val.isErr()) {
        return Result.Err(`Chained contract should NOT have expired: ${val.error}`);
    }

    return Result.Ok("Inheritance verified: chains remain Contracts.");
}

async function testRelativeTimeoutBehavior() {
    console.log("Running Test 2: Verifying relative (resetting) timeouts...");

    const TIMEOUT = 100;
    // Step 1: Takes 80ms of a 100ms contract.
    const c = new Contract((resolve) => {
        setTimeout(() => resolve(Result.Ok("First")), 80);
    }, TIMEOUT);

    // Step 2: Also takes 80ms. 
    // In an "Absolute" world, this would EXPIRE because 80+80 > 100.
    // In a "Relative" world, this succeeds because the second Contract gets its own fresh DEFAULT_TIMEOUT.
    const chained = c.then(async (res) => {
        // Contract Sleep: resolves on its own expiration
        await new Contract(r => { }, 80);
        return res;
    });

    const val = await chained;
    if (val.isErr()) {
        return Result.Err(`Expected Success (Relative), but got Err: ${val.error}`);
    }

    return Result.Ok("Relative timeout verified: each .then() link gets a fresh clock.");
}

async function testExplicitChainTimeout() {
    console.log("Running Test 3: Verifying explicit timeout on chain link...");

    const c = new Contract((resolve) => resolve(Result.Ok("Done")), 100);

    // Explicitly set a very short timeout for the NEXT link.
    const chained = c.then(async (res) => {
        await new Contract(r => { }, 80);
        return res;
    }, 20); // 20ms timeout should be hit since we wait 80ms.

    const result = await chained;
    if (result.isOk()) {
        return Result.Err("Chain should have expired due to explicit short timeout.");
    }

    if (result.error !== "EXPIRED") {
        return Result.Err(`Expected EXPIRED, got ${result.error}`);
    }

    return Result.Ok("Explicit chain timeout correctly applied.");
}

async function runTests() {
    console.log("--- Initializing Inheritance & Chaining Test Suite ---");

    const results = [
        await testInheritanceIdentity(),
        await testRelativeTimeoutBehavior(),
        await testExplicitChainTimeout()
    ];

    const allPassed = results.every(res => res.isOk());

    results.forEach((res, i) => {
        const names = ["Identity", "Relative Behavior", "Explicit Timeout"];
        if (res.isOk()) {
            console.log(`[PASS] ${names[i]}: ${res.value}`);
        } else {
            console.error(`[FAIL] ${names[i]}: ${res.error}`);
        }
    });

    process.exit(allPassed ? 0 : 1);
}

runTests();
