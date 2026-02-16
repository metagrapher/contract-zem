import { Result } from '../src/zem.js';
// Contract and wrap are not implemented yet, so these imports will fail or be undefined.
// import { Contract, wrap } from '../src/index.js';

async function testProofOfMissingFeature() {
    console.log("Running Test B: Proof of missing feature (Mechanical Witness)...");

    const TARGET_BOUND = 50;
    const ACTUAL_LATENCY = 100;

    // Prove that a standard Promise cannot be easily bounded to 50ms natively.
    const p = new Promise(resolve => {
        setTimeout(() => resolve(Result.Ok("Success")), ACTUAL_LATENCY);
    });

    // Mechanical verification: Race against a manual timeout to show 
    // the complexity/messiness we are trying to solve.
    const start = Date.now();
    const result = await Promise.race([
        p,
        new Promise(r => setTimeout(() => r(Result.Err("MANUAL_RACE_TIMEOUT")), TARGET_BOUND))
    ]);

    // Proof: We should have manually timed out, proving the Promise 
    // itself didn't have the capability to expire at TARGET_BOUND.
    if (result.isErr() && result.error === "MANUAL_RACE_TIMEOUT") {
        console.log(`Proof Confirmed: Manual race required. Latency forced at ${Date.now() - start}ms.`);
        return Result.Ok("LATENCY_BOUNDED_SUCCESSFULLY");
    }

    return Result.Err("FAILURE_TO_DEMONSTRATE_UNBOUNDED_PROMISE");
}

async function testContractSolution() {
    console.log("Running Test A: The Solution (Contract with timeout)...");

    // Safety Watchdog: Test must complete in < 2s
    const watchdog = new Promise(r => setTimeout(() => r(Result.Err("TEST_WATCHDOG_TIMEOUT")), 2000));

    const testLogic = (async () => {
        // Dynamic import to handle gradual implementation if needed
        const { Contract } = await import('../src/index.js');

        // Scenario 1: Success within time
        const res1 = await new Contract(r => setTimeout(() => r(Result.Ok("Success")), 20), 50);
        if (res1.isErr()) return Result.Err(`Expect Success, got Error: ${res1.error}`);
        if (res1.value !== "Success") return Result.Err("Data mismatch on success path");

        // Scenario 2: Expiration logic
        const res2 = await new Contract(r => setTimeout(() => r(Result.Ok("Late")), 100), 50);
        if (res2.isOk()) return Result.Err("Expect EXPIRED, but got Ok");
        if (res2.error !== "EXPIRED") return Result.Err(`Expect EXPIRED, got ${res2.error}`);

        return Result.Ok("Contract verified successfully");
    })();

    return await Promise.race([testLogic, watchdog]);
}

async function runTests() {
    console.log("--- Initializing ZEM Test Suite ---");

    const results = [
        await testProofOfMissingFeature(),
        await testContractSolution()
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
