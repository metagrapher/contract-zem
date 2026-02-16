import { Contract } from './src/index.js';
import { Result } from './src/zem.js';

async function testSpecies() {
    console.log("Testing Contract inheritance behavior...");

    const c = new Contract((resolve) => {
        setTimeout(() => resolve(Result.Ok("Original")), 10);
    }, 100);

    // What does .then() return?
    const chained = c.then(res => res);

    console.log("Is original a Contract?", c instanceof Contract);
    console.log("Is chained a Contract?", chained instanceof Contract);
    console.log("Chained constructor name:", chained.constructor.name);

    try {
        const value = await chained;
        console.log("Chained value:", value.value);
    } catch (e) {
        console.error("Chaining failed:", e);
    }
}

testSpecies();
