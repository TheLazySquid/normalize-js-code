import { test, expect } from "bun:test";
import { normalizeJs } from "../src";
import { join } from "node:path";
import { parse } from "acorn";

let text = await Bun.file(join(__dirname, "cases.txt")).text();
text = text.replaceAll("\r\n", "\n");
let cases = text.split("\n====\n");

for(let str of cases) {
    let parts = str.split("\n==\n");
    test(parts[0], () => {
        expect(normalizeJs(parts[1])).toBe(parts[2]);
    });
}

// run it on all of three.js, see what happens
test("Normalize Three.js", async () => {
    let threeFile = Bun.file(join(__dirname, "..", "..", "node_modules", ".test", "three.js"));
    let three: string;

    if(await threeFile.exists()) {
        three = await threeFile.text();
    } else {
        let res = await fetch("https://unpkg.com/three@0.176.0/build/three.cjs");
        three = await res.text();
        await threeFile.write(three);
    }

    let normalized = normalizeJs(three);
    
    // check whether the syntax is still valid
    parse(normalized, { ecmaVersion: "latest" });
});