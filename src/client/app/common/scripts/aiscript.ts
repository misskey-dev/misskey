/**
 * AiScript
 * evaluator & type checker
 */

import autobind from 'autobind-decorator';
import * as seedrandom from 'seedrandom';

import {
	faSuperscript,
	faAlignLeft,
	faShareAlt,
	faSquareRootAlt,
	faPlus,
	faMinus,
	faTimes,
	faDivide,
	faList,
	faQuoteRight,
	faEquals,
	faGreaterThan,
	faLessThan,
	faGreaterThanEqual,
	faLessThanEqual,
	faExclamation,
	faNotEqual,
	faDice,
	faSortNumericUp,
} from '@fortawesome/free-solid-svg-icons';
import { faFlag } from '@fortawesome/free-regular-svg-icons';

export type Block = {
	id: string;
	type: string;
	args: Block[];
	value: any;
};

export type Variable = Block & {
	name: string;
};

type Type = 'string' | 'number' | 'boolean' | 'stringArray';

type TypeError = {
	arg: number;
	expect: Type;
	actual: Type;
};

const funcDefs = {
	if:              { in: ['boolean', 0, 0],      out: 0,         category: 'flow',       icon: faShareAlt, },
	not:             { in: ['boolean'],            out: 'boolean', category: 'logical',    icon: faFlag, },
	or:              { in: ['boolean', 'boolean'], out: 'boolean', category: 'logical',    icon: faFlag, },
	and:             { in: ['boolean', 'boolean'], out: 'boolean', category: 'logical',    icon: faFlag, },
	add:             { in: ['number', 'number'],   out: 'number',  category: 'operation',  icon: faPlus, },
	subtract:        { in: ['number', 'number'],   out: 'number',  category: 'operation',  icon: faMinus, },
	multiply:        { in: ['number', 'number'],   out: 'number',  category: 'operation',  icon: faTimes, },
	divide:          { in: ['number', 'number'],   out: 'number',  category: 'operation',  icon: faDivide, },
	eq:              { in: [0, 0],                 out: 'boolean', category: 'comparison', icon: faEquals, },
	notEq:           { in: [0, 0],                 out: 'boolean', category: 'comparison', icon: faNotEqual, },
	gt:              { in: ['number', 'number'],   out: 'boolean', category: 'comparison', icon: faGreaterThan, },
	lt:              { in: ['number', 'number'],   out: 'boolean', category: 'comparison', icon: faLessThan, },
	gtEq:            { in: ['number', 'number'],   out: 'boolean', category: 'comparison', icon: faGreaterThanEqual, },
	ltEq:            { in: ['number', 'number'],   out: 'boolean', category: 'comparison', icon: faLessThanEqual, },
	rannum:          { in: ['number', 'number'],   out: 'number',  category: 'random',     icon: faDice, },
	random:          { in: ['number'],             out: 'boolean', category: 'random',     icon: faDice, },
	randomPick:      { in: [0],                    out: 0,         category: 'random',     icon: faDice, },
	dailyRannum:     { in: ['number', 'number'],   out: 'number',  category: 'random',     icon: faDice, },
	dailyRandom:     { in: ['number'],             out: 'boolean', category: 'random',     icon: faDice, },
	dailyRandomPick: { in: [0],                    out: 0,         category: 'random',     icon: faDice, },
};

const blockDefs = [
	{ type: 'text',          out: 'string',      category: 'value', icon: faQuoteRight, },
	{ type: 'multiLineText', out: 'string',      category: 'value', icon: faAlignLeft, },
	{ type: 'textList',      out: 'stringArray', category: 'value', icon: faList, },
	{ type: 'number',        out: 'number',      category: 'value', icon: faSortNumericUp, },
	{ type: 'ref',           out: null,          category: 'value', icon: faSuperscript, },
	...Object.entries(funcDefs).map(([k, v]) => ({
		type: k, out: v.out || null, category: v.category, icon: v.icon
	}))
];

type PageVar = { name: string; value: any; type: Type; };

export class AiScript {
	private variables: Variable[];
	private pageVars: PageVar[];
	private envVars: { name: string, value: any }[];

	public static envVarsDef = {
		AI: 'string',
		NAME: 'string',
		NOTES_COUNT: 'number',
		LOGIN: 'boolean',
	};

	public static blockDefs = blockDefs;
	public static funcDefs = funcDefs;
	private opts: {
		randomSeed?: string; user?: any; visitor?: any;
	};

	constructor(variables: Variable[], pageVars: PageVar[] = [], opts: AiScript['opts'] = {}) {
		this.variables = variables;
		this.pageVars = pageVars;
		this.opts = opts;

		this.envVars = [
			{ name: 'AI', value: 'kawaii' },
			{ name: 'LOGIN', value: opts.visitor != null },
			{ name: 'NAME', value: opts.visitor ? opts.visitor.name : '' },
			{ name: 'USERID', value: opts.visitor ? opts.visitor.id : '' },
		];
	}

	@autobind
	public injectVars(vars: Variable[]) {
		this.variables = vars;
	}

	@autobind
	public injectPageVars(pageVars: PageVar[]) {
		this.pageVars = pageVars;
	}

	@autobind
	public updatePageVar(name: string, value: any) {
		this.pageVars.find(v => v.name === name).value = value;
	}

	@autobind
	public updateRandomSeed(seed: string) {
		this.opts.randomSeed = seed;
	}

	@autobind
	public static isLiteralBlock(v: Block) {
		if (v.type === null) return true;
		if (v.type === 'text') return true;
		if (v.type === 'multiLineText') return true;
		if (v.type === 'textList') return true;
		if (v.type === 'number') return true;
		if (v.type === 'ref') return true;
		return false;
	}

	@autobind
	public typeCheck(v: Block): TypeError | null {
		if (AiScript.isLiteralBlock(v)) return null;

		const def = AiScript.funcDefs[v.type];
		if (def == null) {
			throw new Error('Unknown type: ' + v.type);
		}

		const generic: Type[] = [];

		for (let i = 0; i < def.in.length; i++) {
			const arg = def.in[i];
			const type = this.typeInference(v.args[i]);
			if (type === null) continue;

			if (typeof arg === 'number') {
				if (generic[arg] === undefined) {
					generic[arg] = type;
				} else if (type !== generic[arg]) {
					return {
						arg: i,
						expect: generic[arg],
						actual: type
					};
				}
			} else if (type !== arg) {
				return {
					arg: i,
					expect: arg,
					actual: type
				};
			}
		}

		return null;
	}

	@autobind
	public getExpectedType(v: Block, slot: number): Type | null {
		const def = AiScript.funcDefs[v.type];
		if (def == null) {
			throw new Error('Unknown type: ' + v.type);
		}

		const generic: Type[] = [];

		for (let i = 0; i < def.in.length; i++) {
			const arg = def.in[i];
			const type = this.typeInference(v.args[i]);
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

	@autobind
	public typeInference(v: Block): Type | null {
		if (v.type === null) return null;
		if (v.type === 'text') return 'string';
		if (v.type === 'multiLineText') return 'string';
		if (v.type === 'textList') return 'stringArray';
		if (v.type === 'number') return 'number';
		if (v.type === 'ref') {
			const variable = this.variables.find(va => va.name === v.value);
			if (variable) {
				return this.typeInference(variable);
			}

			const pageVar = this.pageVars.find(va => va.name === v.value);
			if (pageVar) {
				return pageVar.type;
			}

			const envVar = AiScript.envVarsDef[v.value];
			if (envVar) {
				return envVar;
			}

			return null;
		}

		const generic: Type[] = [];

		const def = AiScript.funcDefs[v.type];

		for (let i = 0; i < def.in.length; i++) {
			const arg = def.in[i];
			if (typeof arg === 'number') {
				const type = this.typeInference(v.args[i]);

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

	@autobind
	public getVarsByType(type: Type | null): Variable[] {
		if (type == null) return this.variables;
		return this.variables.filter(x => (this.typeInference(x) === null) || (this.typeInference(x) === type));
	}

	@autobind
	public getEnvVarsByType(type: Type | null): string[] {
		if (type == null) return Object.keys(AiScript.envVarsDef);
		return Object.entries(AiScript.envVarsDef).filter(([k, v]) => type === v).map(([k, v]) => k);
	}

	@autobind
	public getPageVarsByType(type: Type | null): string[] {
		if (type == null) return this.pageVars.map(v => v.name);
		return this.pageVars.filter(v => type === v.type).map(v => v.name);
	}

	@autobind
	private interpolate(str: string, values: { name: string, value: any }[]) {
		return str.replace(/\{(.+?)\}/g, match =>
			(this.getVariableValue(match.slice(1, -1).trim(), values) || '').toString());
	}

	@autobind
	public evaluateVars() {
		const values: { name: string, value: any }[] = [];

		for (const v of this.variables) {
			values.push({
				name: v.name,
				value: this.evaluate(v, values)
			});
		}

		for (const v of this.pageVars) {
			values.push({
				name: v.name,
				value: v.value
			});
		}

		for (const v of this.envVars) {
			values.push({
				name: v.name,
				value: v.value
			});
		}

		return values;
	}

	@autobind
	private evaluate(block: Block, values: { name: string, value: any }[]): any {
		if (block.type === null) {
			return null;
		}

		if (block.type === 'number') {
			return parseInt(block.value, 10);
		}

		if (block.type === 'text' || block.type === 'multiLineText') {
			return this.interpolate(block.value, values);
		}

		if (block.type === 'textList') {
			return block.value.trim().split('\n');
		}

		if (block.type === 'ref') {
			return this.getVariableValue(block.value, values);
		}

		if (block.args === undefined) return null;

		const date = new Date();
		const day = `${this.opts.visitor ? this.opts.visitor.id : ''} ${date.getFullYear()}/${date.getMonth()}/${date.getDate()}`;

		const funcs: { [p in keyof typeof funcDefs]: any } = {
			not: (a) => !a,
			eq: (a, b) => a === b,
			notEq: (a, b) => a !== b,
			gt: (a, b) => a > b,
			lt: (a, b) => a < b,
			gtEq: (a, b) => a >= b,
			ltEq: (a, b) => a <= b,
			or: (a, b) => a || b,
			and: (a, b) => a && b,
			if: (bool, a, b) => bool ? a : b,
			add: (a, b) => a + b,
			subtract: (a, b) => a - b,
			multiply: (a, b) => a * b,
			divide: (a, b) => a / b,
			random: (probability) => Math.floor(seedrandom(`${this.opts.randomSeed}:${block.id}`)() * 100) < probability,
			rannum: (min, max) => min + Math.floor(seedrandom(`${this.opts.randomSeed}:${block.id}`)() * (max - min + 1)),
			randomPick: (list) => list[Math.floor(seedrandom(`${this.opts.randomSeed}:${block.id}`)() * list.length)],
			dailyRandom: (probability) => Math.floor(seedrandom(`${day}:${block.id}`)() * 100) < probability,
			dailyRannum: (min, max) => min + Math.floor(seedrandom(`${day}:${block.id}`)() * (max - min + 1)),
			dailyRandomPick: (list) => list[Math.floor(seedrandom(`${day}:${block.id}`)() * list.length)],
		};

		const fnName = block.type;

		const fn = funcs[fnName];
		if (fn == null) {
			console.error('Unknown function: ' + fnName);
			throw new Error('Unknown function: ' + fnName);
		}

		const args = block.args.map(x => this.evaluate(x, values));

		return fn(...args);
	}

	@autobind
	private getVariableValue(name: string, values: { name: string, value: any }[]): any {
		const v = values.find(v => v.name === name);
		if (v) {
			return v.value;
		}

		const pageVar = this.pageVars.find(v => v.name === name);
		if (pageVar) {
			return pageVar.value;
		}

		if (AiScript.envVarsDef[name]) {
			return this.envVars.find(x => x.name === name).value;
		}

		throw new Error(`Script: No such variable '${name}'`);
	}
}
