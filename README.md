# normalize-js-code

normalize-js-code takes javascript code and attempts to normalize it as much as possible by changing variable names in a predictable way. This is useful for comparing minified code, which has short, meaningless variable names that can change unpredictably between builds.

For example, take this code below:
```js
setTimeout(() => console.log(someVariable), 5);

if (true) {
    var someVar = 100;
    let someVariable = 5;
    console.log(someVariable);
}

let someVariable = 'apple';
console.log(someVar);
```
After normalization, this becomes:
```js
setTimeout(() => console.log(_b), 5);
if (true) {
    var a = 100;
    let b = 5;
    console.log(b);
}
let _b = 'apple';
console.log(a);
```

The code outputted will be the same regardless of the names of the variables that are inputted, or how it is formatted. If you want around to play with this normalization check out the [demo](https://thelazysquid.github.io/normalize-js-code).

## Usage

```js
import { normalizeJs } from "normalize-js-code";

const code = `let test = 'hello';`

console.log(normalizeJs(code)); // let a = 'hello';
```

There is also a `normalizeAst` function exported if you already have the ast to be normalized.