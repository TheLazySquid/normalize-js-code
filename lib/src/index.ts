import { chars, declarationNodes, functionNodes, reserved, scopeChanges } from "./consts";
import * as acorn from "acorn";
import * as walk from "acorn-walk";
import { generate } from "escodegen";

export function normalizeJs(code: string) {
    let ast = acorn.parse(code, {
		ecmaVersion: "latest",
		sourceType: "module"
	});	

    normalizeAst(ast);
	
	return generate(ast);
}

export function normalizeAst(ast: acorn.Program) {
	let names: string[] = [];
	let nameNumber = 0;

	const nextName = () => {
		let number = nameNumber++;
		let name = "";

		let characters: number;
		if(number === 0) characters = 1;
		else characters = Math.floor(Math.log(number) / Math.log(chars.length)) + 1;

		for(let i = 0; i < characters; i++) {
			let index = number % chars.length;
			number = Math.floor(number / chars.length);
			name += chars[index];
		}

		if(reserved.includes(name)) nextName();
		else names.push(name);
	}

	interface Scope {
		names: Map<string, string>;
		nameIndex: number;
		node: acorn.Node;
		unassignedIdentifiers: Map<string, acorn.Identifier[]>;
	}

	let scopes: Scope[] = [{ node: ast, nameIndex: 0, names: new Map(), unassignedIdentifiers: new Map() }];
	
	const Identifier = (node: acorn.Identifier, _: never, ancestors: acorn.Node[]) => {
		let declaration = false;

		// Find the first shared ancestor
		let ancestor = ancestors[0];
		let scopesIndex = 0;
		let ancestorIndex = 0;
		for(let i = ancestors.length - 1; i >= 1; i--) {
			let node = ancestors[i];
			if(!scopeChanges.includes(node.type)) continue;

			let index = scopes.findIndex(s => s.node === node);
			if(index === -1) continue;
			
			ancestor = node;
			scopesIndex = index;
			ancestorIndex = i;
			break;
		}

		// Remove all the unnecessary scopes
		scopes = scopes.slice(0, scopesIndex + 1);

		// Add on the new ones
		for(let i = ancestorIndex + 1; i < ancestors.length; i++) {
			let node = ancestors[i];
			if(!scopeChanges.includes(node.type)) continue;

			scopes.push({ node, nameIndex: 0, names: new Map(), unassignedIdentifiers: new Map() });
		}

		let parent = ancestors[ancestors.length - 2];
		
		// Disable shorthand for destructuring
		if(parent.type === "ObjectPattern") {
			for(let prop of (parent as acorn.ObjectPattern).properties) {
				(prop as acorn.Property).shorthand = false;
			}
		}

		if(
			(parent.type.endsWith("Pattern")) ||
			(parent.type === "VariableDeclarator" && (parent as acorn.VariableDeclarator).id === node) ||
			(parent.type === "FunctionDeclaration" && (parent as acorn.FunctionDeclaration).id === node) ||
			(parent.type === "FunctionDeclaration" && (parent as acorn.FunctionDeclaration).params.includes(node)) ||
			(parent.type === "FunctionExpression" && (parent as acorn.FunctionExpression).params.includes(node)) ||
			(parent.type === "ArrowFunctionExpression" && (parent as acorn.ArrowFunctionExpression).params.includes(node)) ||
			(parent.type === "ClassDeclaration" && (parent as acorn.ClassDeclaration).id === node)
		) {
			declaration = true;
		}

		let scope = scopes[scopes.length - 1];
		if(parent.type === "FunctionDeclaration" && (parent as acorn.FunctionDeclaration).id === node) {
			scope = scopes[scopes.length - 2];
		}
		
		if(declaration) {
			let functionScoped = false;

			// check if this variable is block-scoped or function-scoped
			for(let i = ancestors.length - 2; i >= 0; i--) {
				let node = ancestors[i];
				if(node.type === "VariableDeclaration") {
					functionScoped = (node as acorn.VariableDeclaration).kind !== "let";
					break;
				}
				if(!declarationNodes.includes(node.type)) break;
			}

			// move the variable to the top of the function/global scope
			if(functionScoped) {
				for(let i = ancestors.length - 1; i >= 0; i--) {
					if(functionNodes.includes(ancestors[i].type)) {
						scope = scopes.find(s => s.node === ancestors[i]);
						break;
					}
				}
			}

			// generate a new name to replace it with
			scope.nameIndex++;

			let number = scopes.reduce((a, b) => a + b.nameIndex, 0) - 1;
			if(!names[number]) nextName();

			let name = names[number];

			// rename all the unassigned ones
			let unassigned = scope.unassignedIdentifiers.get(node.name);
			if(unassigned) {
				name = "_" + name;
				for(let node of unassigned) node.name = name;

				// I have a suspicion that this doesn't work perfectly but this is so rare anyways
				// that I can't be bothered to figure out what the problem is
				for(let scope of scopes) {
					scope.unassignedIdentifiers.delete(node.name);
				}
			}

			scope.names.set(node.name, name);
			node.name = name;
		} else {
			// find the name to replace it with
			for(let i = scopes.length - 1; i >= 0; i--) {
				let scope = scopes[i];
				if(!scope.names.has(node.name)) continue;

				node.name = scope.names.get(node.name);
				return;
			}

			// make the node wait for an identifier to be created, if it ever is
			// Just add it to all scopes up to the function
			for(let i = scopes.length - 1; i >= 0; i--) {
				let uids = scopes[i].unassignedIdentifiers;
				if(!uids.has(node.name)) uids.set(node.name, []);
				uids.get(node.name).push(node);
			}
		}
	}

	walk.ancestor(ast, {
		Pattern(node, _, ancestors) {
			if(node.type !== "Identifier") return;
			Identifier(node, _, ancestors);
		},
		Identifier
	});
}