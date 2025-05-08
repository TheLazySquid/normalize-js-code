export const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$";
// if we get beyond 3 characters something has gone seriously wrong
export const reserved = ["in", "if", "of", "do", "for", "try", "int", "new", "var"];
export const scopeChanges = ["Program", "IfStatement", "SwitchStatement", "TryStatement", "FunctionDeclaration", "FunctionExpression",
    "ArrowFunctionExpression", "BlockStatement"];
export const declarationNodes = ["ObjectPattern", "VariableDeclarator"];
export const functionNodes = ["FunctionExpression", "ArrowFunctionExpression", "Program"];