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
	faExchangeAlt,
} from '@fortawesome/free-solid-svg-icons';
import { faFlag } from '@fortawesome/free-regular-svg-icons';

import { version } from '../../config';

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
	if:              { in: ['boolean', 0, 0],              out: 0,         category: 'flow',       icon: faShareAlt, },
	not:             { in: ['boolean'],                    out: 'boolean', category: 'logical',    icon: faFlag, },
	or:              { in: ['boolean', 'boolean'],         out: 'boolean', category: 'logical',    icon: faFlag, },
	and:             { in: ['boolean', 'boolean'],         out: 'boolean', category: 'logical',    icon: faFlag, },
	add:             { in: ['number', 'number'],           out: 'number',  category: 'operation',  icon: faPlus, },
	subtract:        { in: ['number', 'number'],           out: 'number',  category: 'operation',  icon: faMinus, },
	multiply:        { in: ['number', 'number'],           out: 'number',  category: 'operation',  icon: faTimes, },
	divide:          { in: ['number', 'number'],           out: 'number',  category: 'operation',  icon: faDivide, },
	eq:              { in: [0, 0],                         out: 'boolean', category: 'comparison', icon: faEquals, },
	notEq:           { in: [0, 0],                         out: 'boolean', category: 'comparison', icon: faNotEqual, },
	gt:              { in: ['number', 'number'],           out: 'boolean', category: 'comparison', icon: faGreaterThan, },
	lt:              { in: ['number', 'number'],           out: 'boolean', category: 'comparison', icon: faLessThan, },
	gtEq:            { in: ['number', 'number'],           out: 'boolean', category: 'comparison', icon: faGreaterThanEqual, },
	ltEq:            { in: ['number', 'number'],           out: 'boolean', category: 'comparison', icon: faLessThanEqual, },
	strLen:          { in: ['string'],                     out: 'number',  category: 'text',       icon: faQuoteRight, },
	strPick:         { in: ['string', 'number'],           out: 'string',  category: 'text',       icon: faQuoteRight, },
	strReplace:      { in: ['string', 'string', 'string'], out: 'string',  category: 'text',       icon: faQuoteRight, },
	strReverse:      { in: ['string'],                     out: 'string',  category: 'text',       icon: faQuoteRight, },
	stringToNumber:  { in: ['string'],                     out: 'number',  category: 'convert',    icon: faExchangeAlt, },
	numberToString:  { in: ['number'],                     out: 'string',  category: 'convert',    icon: faExchangeAlt, },
	rannum:          { in: ['number', 'number'],           out: 'number',  category: 'random',     icon: faDice, },
	dailyRannum:     { in: ['number', 'number'],           out: 'number',  category: 'random',     icon: faDice, },
	random:          { in: ['number'],                     out: 'boolean', category: 'random',     icon: faDice, },
	dailyRandom:     { in: ['number'],                     out: 'boolean', category: 'random',     icon: faDice, },
	randomPick:      { in: [0],                            out: 0,         category: 'random',     icon: faDice, },
	dailyRandomPick: { in: [0],                            out: 0,         category: 'random',     icon: faDice, },
};

const literalDefs = {
	text:          { out: 'string',      category: 'value', icon: faQuoteRight, },
	multiLineText: { out: 'string',      category: 'value', icon: faAlignLeft, },
	textList:      { out: 'stringArray', category: 'value', icon: faList, },
	number:        { out: 'number',      category: 'value', icon: faSortNumericUp, },
	ref:           { out: null,          category: 'value', icon: faSuperscript, },
	in:            { out: null,          category: 'value', icon: faSuperscript, },
	fn:            { out: 'function',    category: 'value', icon: faSuperscript, },
};

const blockDefs = [
	...Object.entries(literalDefs).map(([k, v]) => ({
		type: k, out: v.out, category: v.category, icon: v.icon
	})),
	...Object.entries(funcDefs).map(([k, v]) => ({
		type: k, out: v.out, category: v.category, icon: v.icon
	}))
];

type PageVar = { name: string; value: any; type: Type; };

const envVarsDef = {
	AI: 'string',
	URL: 'string',
	VERSION: 'string',
	LOGIN: 'boolean',
	NAME: 'string',
	USERNAME: 'string',
	USERID: 'string',
	NOTES_COUNT: 'number',
	FOLLOWERS_COUNT: 'number',
	FOLLOWING_COUNT: 'number',
	IS_CAT: 'boolean',
	MY_NOTES_COUNT: 'number',
	MY_FOLLOWERS_COUNT: 'number',
	MY_FOLLOWING_COUNT: 'number',
};

export class AiScript {
	private variables: Variable[];
	private pageVars: PageVar[];
	private envVars: Record<keyof typeof envVarsDef, any>;

	public static envVarsDef = envVarsDef;
	public static blockDefs = blockDefs;
	public static funcDefs = funcDefs;
	private opts: {
		randomSeed?: string; user?: any; visitor?: any; page?: any; url?: string;
	};

	constructor(variables: Variable[] = [], pageVars: PageVar[] = [], opts: AiScript['opts'] = {}) {
		this.variables = variables;
		this.pageVars = pageVars;
		this.opts = opts;

		this.envVars = {
			AI: 'kawaii',
			VERSION: version,
			URL: opts.page ? `${opts.url}/@${opts.page.user.username}/pages/${opts.page.name}` : '',
			LOGIN: opts.visitor != null,
			NAME: opts.visitor ? opts.visitor.name : '',
			USERNAME: opts.visitor ? opts.visitor.username : '',
			USERID: opts.visitor ? opts.visitor.id : '',
			NOTES_COUNT: opts.visitor ? opts.visitor.notesCount : 0,
			FOLLOWERS_COUNT: opts.visitor ? opts.visitor.followersCount : 0,
			FOLLOWING_COUNT: opts.visitor ? opts.visitor.followingCount : 0,
			IS_CAT: opts.visitor ? opts.visitor.isCat : false,
			MY_NOTES_COUNT: opts.user ? opts.user.notesCount : 0,
			MY_FOLLOWERS_COUNT: opts.user ? opts.user.followersCount : 0,
			MY_FOLLOWING_COUNT: opts.user ? opts.user.followingCount : 0,
		};
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
		if (literalDefs[v.type]) return true;
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
		if (v.type === 'fn') return null; // todo
		if (v.type === 'in') return null; // todo

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
	public getVarByName(name: string): Variable {
		return this.variables.find(x => x.name === name);
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
		return str.replace(/\{(.+?)\}/g, match => {
			const v = this.getVariableValue(match.slice(1, -1).trim(), values);
			return v == null ? 'NULL' : v.toString();
		});
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

		for (const [k, v] of Object.entries(this.envVars)) {
			values.push({
				name: k,
				value: v
			});
		}

		return values;
	}

	@autobind
	private evaluate(block: Block, values: { name: string, value: any }[], slotArg: Record<string, any> = {}): any {
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

		if (block.type === 'in') {
			return slotArg[block.value];
		}

		if (block.type === 'fn') { // ユーザー関数定義
			return {
				slots: block.value.slots,
				exec: slotArg => this.evaluate(block.value.expression, values, slotArg)
			};
		}

		if (block.type.startsWith('fn:')) { // ユーザー関数呼び出し
			const fnName = block.type.split(':')[1];
			const fn = this.getVariableValue(fnName, values);
			for (let i = 0; i < fn.slots.length; i++) {
				const name = fn.slots[i];
				slotArg[name] = this.evaluate(block.args[i], values);
			}
			return fn.exec(slotArg);
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
			strLen: (a) => a.length,
			strPick: (a, b) => a[b - 1],
			strReplace: (a, b, c) => a.split(b).join(c),
			strReverse: (a) => a.split('').reverse().join(''),
			stringToNumber: (a) => parseInt(a),
			numberToString: (a) => a.toString(),
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

		const args = block.args.map(x => this.evaluate(x, values, slotArg));

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
			return this.envVars[name];
		}

		throw new Error(`Script: No such variable '${name}'`);
	}

	@autobind
	public isUsedName(name: string) {
		if (this.variables.some(v => v.name === name)) {
			return true;
		}

		if (this.pageVars.some(v => v.name === name)) {
			return true;
		}

		if (AiScript.envVarsDef[name]) {
			return true;
		}

		return false;
	}
}
