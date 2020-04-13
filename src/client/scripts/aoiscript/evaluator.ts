import autobind from 'autobind-decorator';
import * as seedrandom from 'seedrandom';
import { Variable, PageVar, envVarsDef, funcDefs, Block, isFnBlock } from '.';
import { version } from '../../config';
import { AiScript, utils, parse, values } from '@syuilo/aiscript';
import { createAiScriptEnv } from '../create-aiscript-env';

type Fn = {
	slots: string[];
	exec: (args: Record<string, any>) => ReturnType<ASEvaluator['evaluate']>;
};

/**
 * AoiScript evaluator
 */
export class ASEvaluator {
	private variables: Variable[];
	private pageVars: PageVar[];
	private envVars: Record<keyof typeof envVarsDef, any>;
	public aiscript?: AiScript;
	private pageVarUpdatedCallback;

	private opts: {
		randomSeed: string; visitor?: any; page?: any; url?: string;
		enableAiScript: boolean;
	};

	constructor(vm: any, variables: Variable[], pageVars: PageVar[], opts: ASEvaluator['opts']) {
		this.variables = variables;
		this.pageVars = pageVars;
		this.opts = opts;

		if (this.opts.enableAiScript) {
			this.aiscript = new AiScript({ ...createAiScriptEnv(vm, {
				storageKey: 'pages:' + opts.page.id
			}), ...{
				'MkPages:updated': values.FN_NATIVE(([callback]) => {
					this.pageVarUpdatedCallback = callback;
				})
			}}, {
				in: (q) => {
					return new Promise(ok => {
						vm.$root.dialog({
							title: q,
							input: {}
						}).then(({ canceled, result: a }) => {
							ok(a);
						});
					});
				},
				out: (value) => {
					console.log(value);
				},
				log: (type, params) => {
				},
				maxStep: 16384
			});
		}

		const date = new Date();

		this.envVars = {
			AI: 'kawaii',
			VERSION: version,
			URL: opts.page ? `${opts.url}/@${opts.page.user.username}/pages/${opts.page.name}` : '',
			LOGIN: opts.visitor != null,
			NAME: opts.visitor ? opts.visitor.name || opts.visitor.username : '',
			USERNAME: opts.visitor ? opts.visitor.username : '',
			USERID: opts.visitor ? opts.visitor.id : '',
			NOTES_COUNT: opts.visitor ? opts.visitor.notesCount : 0,
			FOLLOWERS_COUNT: opts.visitor ? opts.visitor.followersCount : 0,
			FOLLOWING_COUNT: opts.visitor ? opts.visitor.followingCount : 0,
			IS_CAT: opts.visitor ? opts.visitor.isCat : false,
			SEED: opts.randomSeed ? opts.randomSeed : '',
			YMD: `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`,
			NULL: null
		};
	}

	@autobind
	public updatePageVar(name: string, value: any) {
		const pageVar = this.pageVars.find(v => v.name === name);
		if (pageVar !== undefined) {
			pageVar.value = value;
			if (this.pageVarUpdatedCallback) {
				if (this.aiscript) this.aiscript.execFn(this.pageVarUpdatedCallback, [values.STR(name), utils.jsToVal(value)]);
			}
		} else {
			throw new AoiScriptError(`No such page var '${name}'`);
		}
	}

	@autobind
	public updateRandomSeed(seed: string) {
		this.opts.randomSeed = seed;
		this.envVars.SEED = seed;
	}

	@autobind
	private interpolate(str: string, scope: Scope) {
		return str.replace(/{(.+?)}/g, match => {
			const v = scope.getState(match.slice(1, -1).trim());
			return v == null ? 'NULL' : v.toString();
		});
	}

	@autobind
	public evaluateVars(): Record<string, any> {
		const values: Record<string, any> = {};

		for (const [k, v] of Object.entries(this.envVars)) {
			values[k] = v;
		}

		for (const v of this.pageVars) {
			values[v.name] = v.value;
		}

		for (const v of this.variables) {
			values[v.name] = this.evaluate(v, new Scope([values]));
		}

		return values;
	}

	@autobind
	private evaluate(block: Block, scope: Scope): any {
		if (block.type === null) {
			return null;
		}

		if (block.type === 'number') {
			return parseInt(block.value, 10);
		}

		if (block.type === 'text' || block.type === 'multiLineText') {
			return this.interpolate(block.value || '', scope);
		}

		if (block.type === 'textList') {
			return this.interpolate(block.value || '', scope).trim().split('\n');
		}

		if (block.type === 'ref') {
			return scope.getState(block.value);
		}

		if (block.type === 'aiScriptVar') {
			if (this.aiscript) {
				return utils.valToJs(this.aiscript.scope.get(block.value));
			} else {
				return null;
			}
		}

		if (isFnBlock(block)) { // ユーザー関数定義
			return {
				slots: block.value.slots.map(x => x.name),
				exec: (slotArg: Record<string, any>) => {
					return this.evaluate(block.value.expression, scope.createChildScope(slotArg, block.id));
				}
			} as Fn;
		}

		if (block.type.startsWith('fn:')) { // ユーザー関数呼び出し
			const fnName = block.type.split(':')[1];
			const fn = scope.getState(fnName);
			const args = {} as Record<string, any>;
			for (let i = 0; i < fn.slots.length; i++) {
				const name = fn.slots[i];
				args[name] = this.evaluate(block.args[i], scope);
			}
			return fn.exec(args);
		}

		if (block.args === undefined) return null;

		const date = new Date();
		const day = `${this.opts.visitor ? this.opts.visitor.id : ''} ${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;

		const funcs: { [p in keyof typeof funcDefs]: Function } = {
			not: (a: boolean) => !a,
			or: (a: boolean, b: boolean) => a || b,
			and: (a: boolean, b: boolean) => a && b,
			eq: (a: any, b: any) => a === b,
			notEq: (a: any, b: any) => a !== b,
			gt: (a: number, b: number) => a > b,
			lt: (a: number, b: number) => a < b,
			gtEq: (a: number, b: number) => a >= b,
			ltEq: (a: number, b: number) => a <= b,
			if: (bool: boolean, a: any, b: any) => bool ? a : b,
			for: (times: number, fn: Fn) => {
				const result = [];
				for (let i = 0; i < times; i++) {
					result.push(fn.exec({
						[fn.slots[0]]: i + 1
					}));
				}
				return result;
			},
			add: (a: number, b: number) => a + b,
			subtract: (a: number, b: number) => a - b,
			multiply: (a: number, b: number) => a * b,
			divide: (a: number, b: number) => a / b,
			mod: (a: number, b: number) => a % b,
			round: (a: number) => Math.round(a),
			strLen: (a: string) => a.length,
			strPick: (a: string, b: number) => a[b - 1],
			strReplace: (a: string, b: string, c: string) => a.split(b).join(c),
			strReverse: (a: string) => a.split('').reverse().join(''),
			join: (texts: string[], separator: string) => texts.join(separator || ''),
			stringToNumber: (a: string) => parseInt(a),
			numberToString: (a: number) => a.toString(),
			splitStrByLine: (a: string) => a.split('\n'),
			pick: (list: any[], i: number) => list[i - 1],
			listLen: (list: any[]) => list.length,
			random: (probability: number) => Math.floor(seedrandom(`${this.opts.randomSeed}:${block.id}`)() * 100) < probability,
			rannum: (min: number, max: number) => min + Math.floor(seedrandom(`${this.opts.randomSeed}:${block.id}`)() * (max - min + 1)),
			randomPick: (list: any[]) => list[Math.floor(seedrandom(`${this.opts.randomSeed}:${block.id}`)() * list.length)],
			dailyRandom: (probability: number) => Math.floor(seedrandom(`${day}:${block.id}`)() * 100) < probability,
			dailyRannum: (min: number, max: number) => min + Math.floor(seedrandom(`${day}:${block.id}`)() * (max - min + 1)),
			dailyRandomPick: (list: any[]) => list[Math.floor(seedrandom(`${day}:${block.id}`)() * list.length)],
			seedRandom: (seed: any, probability: number) => Math.floor(seedrandom(seed)() * 100) < probability,
			seedRannum: (seed: any, min: number, max: number) => min + Math.floor(seedrandom(seed)() * (max - min + 1)),
			seedRandomPick: (seed: any, list: any[]) => list[Math.floor(seedrandom(seed)() * list.length)],
			DRPWPM: (list: string[]) => {
				const xs = [];
				let totalFactor = 0;
				for (const x of list) {
					const parts = x.split(' ');
					const factor = parseInt(parts.pop()!, 10);
					const text = parts.join(' ');
					totalFactor += factor;
					xs.push({ factor, text });
				}
				const r = seedrandom(`${day}:${block.id}`)() * totalFactor;
				let stackedFactor = 0;
				for (const x of xs) {
					if (r >= stackedFactor && r <= stackedFactor + x.factor) {
						return x.text;
					} else {
						stackedFactor += x.factor;
					}
				}
				return xs[0].text;
			},
		};

		const fnName = block.type;
		const fn = (funcs as any)[fnName];
		if (fn == null) {
			throw new AoiScriptError(`No such function '${fnName}'`);
		} else {
			return fn(...block.args.map(x => this.evaluate(x, scope)));
		}
	}
}

class AoiScriptError extends Error {
	public info?: any;

	constructor(message: string, info?: any) {
		super(message);

		this.info = info;

		// Maintains proper stack trace for where our error was thrown (only available on V8)
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, AoiScriptError);
		}
	}
}

class Scope {
	private layerdStates: Record<string, any>[];
	public name: string;

	constructor(layerdStates: Scope['layerdStates'], name?: Scope['name']) {
		this.layerdStates = layerdStates;
		this.name = name || 'anonymous';
	}

	@autobind
	public createChildScope(states: Record<string, any>, name?: Scope['name']): Scope {
		const layer = [states, ...this.layerdStates];
		return new Scope(layer, name);
	}

	/**
	 * 指定した名前の変数の値を取得します
	 * @param name 変数名
	 */
	@autobind
	public getState(name: string): any {
		for (const later of this.layerdStates) {
			const state = later[name];
			if (state !== undefined) {
				return state;
			}
		}

		throw new AoiScriptError(
			`No such variable '${name}' in scope '${this.name}'`, {
				scope: this.layerdStates
			});
	}
}
