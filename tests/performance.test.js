
import { Contract } from '../src/index.js';
import { Result } from '../src/zem.js';

async function runBenchmark() {
    console.log("--- Performance Benchmark ---");
    const iterations = 100000;

    // Benchmark 1: Raw Promise Creation
    console.time("Raw Promise x100k");
    for (let i = 0; i < iterations; i++) {
        new Promise((resolve) => resolve("done"));
    }
    console.timeEnd("Raw Promise x100k");

    // Benchmark 2: Contract Creation (with Date math)
    console.time("Contract x100k");
    for (let i = 0; i < iterations; i++) {
        new Contract((resolve) => resolve(Result.Ok("done")), 1000);
    }
    console.timeEnd("Contract x100k");

    // Benchmark 3: Promise Chaining
    const p = Promise.resolve("done");
    console.time("Promise.then x100k");
    for (let i = 0; i < iterations; i++) {
        p.then(v => v);
    }
    console.timeEnd("Promise.then x100k");

    // Benchmark 4: Contract Chaining (with Deadline Propagation)
    const c = new Contract((resolve) => resolve(Result.Ok("done")), 1000);
    console.time("Contract.then x100k");
    for (let i = 0; i < iterations; i++) {
        c.then(v => v);
    }
    console.timeEnd("Contract.then x100k");

    // Benchmark 5: Date.now() overhead
    console.time("Date.now() x100k");
    for (let i = 0; i < iterations; i++) {
        Date.now();
    }
    console.timeEnd("Date.now() x100k");
}

runBenchmark().catch(console.error);
