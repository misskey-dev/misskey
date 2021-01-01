import autobind from 'autobind-decorator';
import { Variable, PageVar, envVarsDef, Block, isFnBlock, Fn, HpmlScope, HpmlError } from '.';
import { version } from '@/config';
import { AiScript, utils, values } from '@syuilo/aiscript';
import { createAiScriptEnv } from '../aiscript/api';
import { collectPageVars } from '../collect-page-vars';
import { initHpmlLib, initAiLib } from './lib';
import * as os from '@/os';
import { markRaw, ref, Ref } from 'vue';

/**
 * Hpml evaluator
 */
export class Hpml {
	private variables: Variable[];
	private pageVars: PageVar[];
	private envVars: Record<keyof typeof envVarsDef, any>;
	public aiscript?: AiScript;
	public pageVarUpdatedCallback?: values.VFn;
	public canvases: Record<string, HTMLCanvasElement> = {};
	public vars: Ref<Record<string, any>> = ref({});
	public page: Record<string, any>;

	private opts: {
		randomSeed: string; visitor?: any; url?: string;
		enableAiScript: boolean;
	};

	constructor(page: Hpml['page'], opts: Hpml['opts']) {
		this.page = page;
		this.variables = this.page.variables;
		this.pageVars = collectPageVars(this.page.content);
		this.opts = opts;

		if (this.opts.enableAiScript) {
			this.aiscript = markRaw(new AiScript({ ...createAiScriptEnv({
				storageKey: 'pages:' + this.page.id
			}), ...initAiLib(this)}, {
				in: (q) => {
					return new Promise(ok => {
						os.dialog({
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
			}));

			this.aiscript.scope.opts.onUpdated = (name, value) => {
				this.eval();
			};
		}

		const date = new Date();

		this.envVars = {
			AI: 'kawaii',
			VERSION: version,
			URL: this.page ? `${opts.url}/@${this.page.user.username}/pages/${this.page.name}` : '',
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
			AISCRIPT_DISABLED: !this.opts.enableAiScript,
			NULL: null
		};

		this.eval();
	}

	@autobind
	public eval() {
		try {
			this.vars.value = this.evaluateVars();
		} catch (e) {
			//this.onError(e);
		}
	}

	@autobind
	public interpolate(str: string) {
		if (str == null) return null;
		return str.replace(/{(.+?)}/g, match => {
			const v = this.vars[match.slice(1, -1).trim()];
			return v == null ? 'NULL' : v.toString();
		});
	}

	@autobind
	public callAiScript(fn: string) {
		try {
			if (this.aiscript) this.aiscript.execFn(this.aiscript.scope.get(fn), []);
		} catch (e) {}
	}

	@autobind
	public registerCanvas(id: string, canvas: any) {
		this.canvases[id] = canvas;
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
			throw new HpmlError(`No such page var '${name}'`);
		}
	}

	@autobind
	public updateRandomSeed(seed: string) {
		this.opts.randomSeed = seed;
		this.envVars.SEED = seed;
	}

	@autobind
	private _interpolateScope(str: string, scope: HpmlScope) {
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
			values[v.name] = this.evaluate(v, new HpmlScope([values]));
		}

		return values;
	}

	@autobind
	private evaluate(block: Block, scope: HpmlScope): any {
		if (block.type === null) {
			return null;
		}

		if (block.type === 'number') {
			return parseInt(block.value, 10);
		}

		if (block.type === 'text' || block.type === 'multiLineText') {
			return this._interpolateScope(block.value || '', scope);
		}

		if (block.type === 'textList') {
			return this._interpolateScope(block.value || '', scope).trim().split('\n');
		}

		if (block.type === 'ref') {
			return scope.getState(block.value);
		}

		if (block.type === 'aiScriptVar') {
			if (this.aiscript) {
				try {
					return utils.valToJs(this.aiscript.scope.get(block.value));
				} catch (e) {
					return null;
				}
			} else {
				return null;
			}
		}

		// Define user function
		if (isFnBlock(block)) {
			return {
				slots: block.value.slots.map(x => x.name),
				exec: (slotArg: Record<string, any>) => {
					return this.evaluate(block.value.expression, scope.createChildScope(slotArg, block.id));
				}
			} as Fn;
		}

		// Call user function
		if (block.type.startsWith('fn:')) {
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

		const funcs = initHpmlLib(block, scope, this.opts.randomSeed, this.opts.visitor);

		// Call function
		const fnName = block.type;
		const fn = (funcs as any)[fnName];
		if (fn == null) {
			throw new HpmlError(`No such function '${fnName}'`);
		} else {
			return fn(...block.args.map(x => this.evaluate(x, scope)));
		}
	}
}
