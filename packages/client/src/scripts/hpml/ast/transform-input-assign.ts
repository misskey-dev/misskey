import { Parser } from '@syuilo/aiscript';
import { Node, NCall, NFn } from '@syuilo/aiscript/built/node';
import { VariableInfo } from '../engine';

export function transformInputAssign(ast: Node[], variableInfos: Record<string, VariableInfo>) {
	const updated = {
		nameArg: 'name',
		valueArg: 'value'
	} as { call?: NCall, fn?: NFn, nameArg: string, valueArg: string };

	// find MkPages:updated() node
	for (const node of ast) {
		if (node.type == 'call' && node.name == 'MkPages:updated') {
			updated.call = node;
		}
	}

	// generate the fn node and the call node as needed
	if (updated.call != null) {
		updated.fn = updated.call.args[0] as NFn;
		updated.nameArg = updated.fn.args[0].name;
		updated.valueArg = updated.fn.args[1].name;
	} else {
		updated.call = Parser.parse(`MkPages:updated()`)[0] as NCall;
		updated.fn = Parser.parse(`@(name,value){}`)[0] as NFn;
		updated.call.args.push(updated.fn);
		ast.push(updated.call);
	}

	// generate assign statements for the input block varibables
	const statements: Node[] = [];
	for (const name of Object.keys(variableInfos)) {
		const info = variableInfos[name];
		if (info.inputAttr != null) {
			const ifNode = Parser.parse(`if ${updated.nameArg} == "${name}" { ${name} = ${updated.valueArg} }`)[0];
			statements.push(ifNode);
		}
	}
	updated.fn.children.splice(0, 0, ...statements);
}
