import autobind from 'autobind-decorator';
import * as seedrandom from 'seedrandom';
import Chart from 'chart.js';
import * as tinycolor from 'tinycolor2';
import { Variable, PageVar, envVarsDef, funcDefs, Block, isFnBlock } from '.';
import { version } from '../../config';
import { AiScript, utils, parse, values } from '@syuilo/aiscript';
import { createAiScriptEnv } from '../create-aiscript-env';

// https://stackoverflow.com/questions/38493564/chart-area-background-color-chartjs
Chart.pluginService.register({
	beforeDraw: function (chart, easing) {
			if (chart.config.options.chartArea && chart.config.options.chartArea.backgroundColor) {
					var ctx = chart.chart.ctx;
					ctx.save();
					ctx.fillStyle = chart.config.options.chartArea.backgroundColor;
					ctx.fillRect(0, 0, chart.chart.width, chart.chart.height);
					ctx.restore();
			}
	}
});

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
	public canvases: Record<string, HTMLCanvasElement> = {};

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
				}),
				'MkPages:get_canvas': values.FN_NATIVE(([id]) => {
					utils.assertString(id);
					const canvas = this.canvases[id.value];
					const ctx = canvas.getContext('2d');
					return values.OBJ(new Map([
						['clear_rect', values.FN_NATIVE(([x, y, width, height]) => { ctx.clearRect(x.value, y.value, width.value, height.value) })],
						['fill_rect', values.FN_NATIVE(([x, y, width, height]) => { ctx.fillRect(x.value, y.value, width.value, height.value) })],
						['stroke_rect', values.FN_NATIVE(([x, y, width, height]) => { ctx.strokeRect(x.value, y.value, width.value, height.value) })],
						['fill_text', values.FN_NATIVE(([text, x, y, width]) => { ctx.fillText(text.value, x.value, y.value, width ? width.value : undefined) })],
						['stroke_text', values.FN_NATIVE(([text, x, y, width]) => { ctx.strokeText(text.value, x.value, y.value, width ? width.value : undefined) })],
						['set_line_width', values.FN_NATIVE(([width]) => { ctx.lineWidth = width.value })],
						['set_font', values.FN_NATIVE(([font]) => { ctx.font = font.value })],
						['set_fill_style', values.FN_NATIVE(([style]) => { ctx.fillStyle = style.value })],
						['set_stroke_style', values.FN_NATIVE(([style]) => { ctx.strokeStyle = style.value })],
						['begin_path', values.FN_NATIVE(() => { ctx.beginPath() })],
						['close_path', values.FN_NATIVE(() => { ctx.closePath() })],
						['move_to', values.FN_NATIVE(([x, y]) => { ctx.moveTo(x.value, y.value) })],
						['line_to', values.FN_NATIVE(([x, y]) => { ctx.lineTo(x.value, y.value) })],
						['arc', values.FN_NATIVE(([x, y, radius, startAngle, endAngle]) => { ctx.arc(x.value, y.value, radius.value, startAngle.value, endAngle.value) })],
						['rect', values.FN_NATIVE(([x, y, width, height]) => { ctx.rect(x.value, y.value, width.value, height.value) })],
						['fill', values.FN_NATIVE(() => { ctx.fill() })],
						['stroke', values.FN_NATIVE(() => { ctx.stroke() })],
					]));
				}),
				'MkPages:chart': values.FN_NATIVE(([id, opts]) => {
					utils.assertString(id);
					utils.assertObject(opts);
					const canvas = this.canvases[id.value];
					const color = getComputedStyle(document.documentElement).getPropertyValue('--accent');
					const chart = new Chart(canvas, {
						type: opts.value.get('type').value,
						data: {
							labels: opts.value.get('labels').value.map(x => x.value),
							datasets: opts.value.get('datasets').value.map(x => ({
								label: x.value.has('label') ? x.value.get('label').value : '',
								data: x.value.get('data').value.map(x => x.value),
								pointRadius: 0,
								lineTension: 0,
								borderWidth: 2,
								borderColor: x.value.has('color') ? x.value.get('color') : color,
								backgroundColor: tinycolor(x.value.has('color') ? x.value.get('color') : color).setAlpha(0.1).toRgbString(),
							}))
						},
						options: {
							responsive: false,
							title: {
								display: opts.value.has('title'),
								text: opts.value.has('title') ? opts.value.get('title').value : ''
							},
							layout: {
								padding: {
									left: 32,
									right: 32,
									top: opts.value.has('title') ? 16 : 32,
									bottom: 16
								}
							},
							legend: {
								display: opts.value.get('datasets').value.filter(x => x.value.has('label') && x.value.get('label').value).length === 0 ? false : true,
								position: 'bottom',
								labels: {
									boxWidth: 16,
								}
							},
							tooltips: {
								enabled: false,
							},
							chartArea: {
								backgroundColor: '#fff'
							},
							...(opts.value.get('type').value === 'radar' ? {
								scale: {
									ticks: {
										min: opts.value.has('min') ? opts.value.get('min').value : undefined,
										max: opts.value.has('max') ? opts.value.get('max').value : undefined,
									}
								}
							} : {
								scales: {
									yAxes: [{
										ticks: {
											min: opts.value.has('min') ? opts.value.get('min').value : undefined,
											max: opts.value.has('max') ? opts.value.get('max').value : undefined,
										}
									}]
								}
							})
						}
					});
				}),
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
			AISCRIPT_DISABLED: !this.opts.enableAiScript,
			NULL: null
		};
	}

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
				try {
					return utils.valToJs(this.aiscript.scope.get(block.value));
				} catch (e) {
					return null;
				}
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
