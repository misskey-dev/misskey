export type Block = {
	type: string;
	args: Block[];
	value: any;
};

export type Variable = Block & {
	id: string;
	name: string;
};

export const blockDefs = [{
	type: 'if', out: null
}, {
	type: 'eq', out: 'boolean'
}, {
	type: 'notEq', out: 'boolean'
}, {
	type: 'and', out: 'boolean'
}, {
	type: 'or', out: 'boolean'
}, {
	type: 'gt', out: 'boolean'
}, {
	type: 'lt', out: 'boolean'
}, {
	type: 'gtOrEq', out: 'boolean'
}, {
	type: 'ltOrEq', out: 'boolean'
}, {
	type: 'not', out: 'boolean'
}, {
	type: 'text', out: 'string'
}, {
	type: 'multiLineText', out: 'string'
}, {
	type: 'textList', out: 'stringArray'
}, {
	type: 'expression', out: null
}, {
	type: 'random', out: 'number'
}, {
	type: 'number', out: 'number'
}, {
	type: 'ref', out: null
}];

export const funcDefs = {
	not: {
		in: ['boolean'],
		out: 'boolean'
	},
	eq: {
		in: [0, 0],
		out: 'boolean'
	},
	gt: {
		in: ['number', 'number'],
		out: 'boolean'
	},
	lt: {
		in: ['number', 'number'],
		out: 'boolean'
	},
	gtEq: {
		in: ['number', 'number'],
		out: 'boolean'
	},
	ltEq: {
		in: ['number', 'number'],
		out: 'boolean'
	},
	if: {
		in: ['boolean', 0, 0],
		out: 0
	},
	random: {
		in: ['number', 'number'],
		out: 'number'
	}
};

export function isLiteralBlock(v: Block) {
	if (v.type === null) return true;
	if (v.type === 'text') return true;
	if (v.type === 'multiLineText') return true;
	if (v.type === 'number') return true;
	if (v.type === 'expression') return true;
	if (v.type === 'ref') return true;
	return false;
}

export function typeCheck(v: Block, variables: Variable[] = []) {
	if (isLiteralBlock(v)) return null;

	const generic: string[] = [];
	const def = funcDefs[v.type];
	if (def == null) {
		console.warn('Unknown type', v.type);
		return;
	}

	for (let i = 0; i < def.in.length; i++) {
		const arg = def.in[i];
		const type = typeInference(v.args[i], variables);
		if (type === null) continue;

		if (typeof arg === 'number') {
			if (generic[arg] === undefined) {
				generic[arg] = type;
			} else {
				if (type !== generic[arg]) {
					return {
						arg: i,
						expect: generic[arg],
						actual: type
					};
				}
			}
		} else {
			if (type !== arg) {
				return {
					arg: i,
					expect: arg,
					actual: type
				};
			}
		}
	}
}

export function getExpectedType(v: Block, slot: number, variables: Variable[] = []) {
	const generic: string[] = [];
	const def = funcDefs[v.type];
	if (def == null) {
		console.warn('Unknown type', v.type);
		return;
	}

	for (let i = 0; i < def.in.length; i++) {
		const arg = def.in[i];
		const type = typeInference(v.args[i], variables);
		if (type === null) continue;

		if (typeof arg === 'number') {
			if (generic[arg] === undefined) {
				generic[arg] = type;
			}
		}
	}

	if (typeof def.in[slot] === 'number') {
		return generic[def.in[slot]] || null;
	} else {
		return def.in[slot];
	}
}

export function typeInference(v: Block, variables: Variable[] = []) {
	if (v.type === null) return null;
	if (v.type === 'text') return 'string';
	if (v.type === 'multiLineText') return 'string';
	if (v.type === 'number') return 'number';
	if (v.type === 'expression') return null;
	if (v.type === 'ref') {
		const variable = variables.find(va => va.id === v.value);
		if (variable == null) return null;
		return typeInference(variable, variables);
	}

	const generic: string[] = [];

	const def = funcDefs[v.type];

	for (let i = 0; i < def.in.length; i++) {
		const arg = def.in[i];
		if (typeof arg === 'number') {
			const type = typeInference(v.args[i], variables);

			if (generic[arg] === undefined) {
				generic[arg] = type;
			} else {
				if (type !== generic[arg]) {
					generic[arg] = null;
				}
			}
		}
	}

	if (typeof def.out === 'number') {
		return generic[def.out];
	} else {
		return def.out;
	}
}
