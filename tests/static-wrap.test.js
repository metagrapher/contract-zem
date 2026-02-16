import { Result } from '../src/zem.js';
import { Contract } from '../src/index.js';

async function testStaticWrapFailsNow() {
    console.log("Running Test A: Static method verification...");

    if (typeof Contract.wrap !== 'function') {
        return Result.Err("Contract.wrap is not defined");
    }

    const fastFn = async (msg) => msg;
    const wrappedFast = Contract.wrap(fastFn, 100);
    const res = await wrappedFast("Hello");

    if (res.isOk() && res.value === "Hello") {
        return Result.Ok("Static wrap works");
    }

    return Result.Err("Static wrap failed logic");
}

async function runTests() {
    const res = await testStaticWrapFailsNow();
    if (res.isOk()) {
        console.log(`[PASS] Test A: ${res.value}`);
        process.exit(0);
    } else {
        console.error(`[FAIL] Test A (Expected): ${res.error}`);
        process.exit(1);
    }
}

runTests();
