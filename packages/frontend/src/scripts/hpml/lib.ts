import seedrandom from 'seedrandom';
import { Hpml } from './evaluator';
import { Expr } from './expr';
import { Fn, HpmlScope } from '.';

/* TODO: https://www.chartjs.org/docs/latest/configuration/canvas-background.html#color
// https://stackoverflow.com/questions/38493564/chart-area-background-color-chartjs
Chart.pluginService.register({
	beforeDraw: (chart, easing) => {
		if (chart.config.options.chartArea && chart.config.options.chartArea.backgroundColor) {
			const ctx = chart.chart.ctx;
			ctx.save();
			ctx.fillStyle = chart.config.options.chartArea.backgroundColor;
			ctx.fillRect(0, 0, chart.chart.width, chart.chart.height);
			ctx.restore();
		}
	}
});
*/

export function initAiLib(hpml: Hpml) {
	return {
		'MkPages:updated': values.FN_NATIVE(([callback]) => {
			hpml.pageVarUpdatedCallback = (callback as values.VFn);
		}),
		'MkPages:get_canvas': values.FN_NATIVE(([id]) => {
			utils.assertString(id);
			const canvas = hpml.canvases[id.value];
			const ctx = canvas.getContext('2d');
			return values.OBJ(new Map([
				['clear_rect', values.FN_NATIVE(([x, y, width, height]) => { ctx.clearRect(x.value, y.value, width.value, height.value); })],
				['fill_rect', values.FN_NATIVE(([x, y, width, height]) => { ctx.fillRect(x.value, y.value, width.value, height.value); })],
				['stroke_rect', values.FN_NATIVE(([x, y, width, height]) => { ctx.strokeRect(x.value, y.value, width.value, height.value); })],
				['fill_text', values.FN_NATIVE(([text, x, y, width]) => { ctx.fillText(text.value, x.value, y.value, width ? width.value : undefined); })],
				['stroke_text', values.FN_NATIVE(([text, x, y, width]) => { ctx.strokeText(text.value, x.value, y.value, width ? width.value : undefined); })],
				['set_line_width', values.FN_NATIVE(([width]) => { ctx.lineWidth = width.value; })],
				['set_font', values.FN_NATIVE(([font]) => { ctx.font = font.value; })],
				['set_fill_style', values.FN_NATIVE(([style]) => { ctx.fillStyle = style.value; })],
				['set_stroke_style', values.FN_NATIVE(([style]) => { ctx.strokeStyle = style.value; })],
				['begin_path', values.FN_NATIVE(() => { ctx.beginPath(); })],
				['close_path', values.FN_NATIVE(() => { ctx.closePath(); })],
				['move_to', values.FN_NATIVE(([x, y]) => { ctx.moveTo(x.value, y.value); })],
				['line_to', values.FN_NATIVE(([x, y]) => { ctx.lineTo(x.value, y.value); })],
				['arc', values.FN_NATIVE(([x, y, radius, startAngle, endAngle]) => { ctx.arc(x.value, y.value, radius.value, startAngle.value, endAngle.value); })],
				['rect', values.FN_NATIVE(([x, y, width, height]) => { ctx.rect(x.value, y.value, width.value, height.value); })],
				['fill', values.FN_NATIVE(() => { ctx.fill(); })],
				['stroke', values.FN_NATIVE(() => { ctx.stroke(); })],
			]));
		}),
		'MkPages:chart': values.FN_NATIVE(([id, opts]) => {
			/* TODO
			utils.assertString(id);
			utils.assertObject(opts);
			const canvas = hpml.canvases[id.value];
			const color = getComputedStyle(document.documentElement).getPropertyValue('--accent');
			Chart.defaults.color = '#555';
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
					devicePixelRatio: 1.5,
					title: {
						display: opts.value.has('title'),
						text: opts.value.has('title') ? opts.value.get('title').value : '',
						fontSize: 14,
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
								display: opts.value.has('show_tick_label') ? opts.value.get('show_tick_label').value : false,
								min: opts.value.has('min') ? opts.value.get('min').value : undefined,
								max: opts.value.has('max') ? opts.value.get('max').value : undefined,
								maxTicksLimit: 8,
							},
							pointLabels: {
								fontSize: 12
							}
						}
					} : {
						scales: {
							yAxes: [{
								ticks: {
									display: opts.value.has('show_tick_label') ? opts.value.get('show_tick_label').value : true,
									min: opts.value.has('min') ? opts.value.get('min').value : undefined,
									max: opts.value.has('max') ? opts.value.get('max').value : undefined,
								}
							}]
						}
					})
				}
			});
			*/
		}),
	};
}

export const funcDefs: Record<string, { in: any[]; out: any; category: string; icon: any; }> = {
	if: { in: ['boolean', 0, 0], out: 0, category: 'flow', icon: 'ti ti-share' },
	for: { in: ['number', 'function'], out: null, category: 'flow', icon: 'ti ti-recycle' },
	not: { in: ['boolean'], out: 'boolean', category: 'logical', icon: 'ti ti-flag' },
	or: { in: ['boolean', 'boolean'], out: 'boolean', category: 'logical', icon: 'ti ti-flag' },
	and: { in: ['boolean', 'boolean'], out: 'boolean', category: 'logical', icon: 'ti ti-flag' },
	add: { in: ['number', 'number'], out: 'number', category: 'operation', icon: 'ti ti-plus' },
	subtract: { in: ['number', 'number'], out: 'number', category: 'operation', icon: 'ti ti-minus' },
	multiply: { in: ['number', 'number'], out: 'number', category: 'operation', icon: 'ti ti-x' },
	divide: { in: ['number', 'number'], out: 'number', category: 'operation', icon: 'ti ti-divide' },
	mod: { in: ['number', 'number'], out: 'number', category: 'operation', icon: 'ti ti-divide' },
	round: { in: ['number'], out: 'number', category: 'operation', icon: 'ti ti-calculator' },
	eq: { in: [0, 0], out: 'boolean', category: 'comparison', icon: 'ti ti-equal' },
	notEq: { in: [0, 0], out: 'boolean', category: 'comparison', icon: 'ti ti-equal-not' },
	gt: { in: ['number', 'number'], out: 'boolean', category: 'comparison', icon: 'ti ti-math-greater' },
	lt: { in: ['number', 'number'], out: 'boolean', category: 'comparison', icon: 'ti ti-math-lower' },
	gtEq: { in: ['number', 'number'], out: 'boolean', category: 'comparison', icon: 'ti ti-math-equal-greater' },
	ltEq: { in: ['number', 'number'], out: 'boolean', category: 'comparison', icon: 'ti ti-math-equal-lower' },
	strLen: { in: ['string'], out: 'number', category: 'text', icon: 'ti ti-quote' },
	strPick: { in: ['string', 'number'], out: 'string', category: 'text', icon: 'ti ti-quote' },
	strReplace: { in: ['string', 'string', 'string'], out: 'string', category: 'text', icon: 'ti ti-quote' },
	strReverse: { in: ['string'], out: 'string', category: 'text', icon: 'ti ti-quote' },
	join: { in: ['stringArray', 'string'], out: 'string', category: 'text', icon: 'ti ti-quote' },
	stringToNumber: { in: ['string'], out: 'number', category: 'convert', icon: 'ti ti-arrows-right-left' },
	numberToString: { in: ['number'], out: 'string', category: 'convert', icon: 'ti ti-arrows-right-left' },
	splitStrByLine: { in: ['string'], out: 'stringArray', category: 'convert', icon: 'ti ti-arrows-right-left' },
	pick: { in: [null, 'number'], out: null, category: 'list', icon: 'ti ti-indent-increase' },
	listLen: { in: [null], out: 'number', category: 'list', icon: 'ti ti-indent-increase' },
	rannum: { in: ['number', 'number'], out: 'number', category: 'random', icon: 'ti ti-dice' },
	dailyRannum: { in: ['number', 'number'], out: 'number', category: 'random', icon: 'ti ti-dice' },
	seedRannum: { in: [null, 'number', 'number'], out: 'number', category: 'random', icon: 'ti ti-dice' },
	random: { in: ['number'], out: 'boolean', category: 'random', icon: 'ti ti-dice' },
	dailyRandom: { in: ['number'], out: 'boolean', category: 'random', icon: 'ti ti-dice' },
	seedRandom: { in: [null, 'number'], out: 'boolean', category: 'random', icon: 'ti ti-dice' },
	randomPick: { in: [0], out: 0, category: 'random', icon: 'ti ti-dice' },
	dailyRandomPick: { in: [0], out: 0, category: 'random', icon: 'ti ti-dice' },
	seedRandomPick: { in: [null, 0], out: 0, category: 'random', icon: 'ti ti-dice' },
	DRPWPM: { in: ['stringArray'], out: 'string', category: 'random', icon: 'ti ti-dice' }, // dailyRandomPickWithProbabilityMapping
};

export function initHpmlLib(expr: Expr, scope: HpmlScope, randomSeed: string, visitor?: any) {
	const date = new Date();
	const day = `${visitor ? visitor.id : ''} ${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;

	// SHOULD be fine to ignore since it's intended + function shape isn't defined
	// eslint-disable-next-line @typescript-eslint/ban-types
	const funcs: Record<string, Function> = {
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
			const result: any[] = [];
			for (let i = 0; i < times; i++) {
				result.push(fn.exec({
					[fn.slots[0]]: i + 1,
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
		random: (probability: number) => Math.floor(seedrandom(`${randomSeed}:${expr.id}`)() * 100) < probability,
		rannum: (min: number, max: number) => min + Math.floor(seedrandom(`${randomSeed}:${expr.id}`)() * (max - min + 1)),
		randomPick: (list: any[]) => list[Math.floor(seedrandom(`${randomSeed}:${expr.id}`)() * list.length)],
		dailyRandom: (probability: number) => Math.floor(seedrandom(`${day}:${expr.id}`)() * 100) < probability,
		dailyRannum: (min: number, max: number) => min + Math.floor(seedrandom(`${day}:${expr.id}`)() * (max - min + 1)),
		dailyRandomPick: (list: any[]) => list[Math.floor(seedrandom(`${day}:${expr.id}`)() * list.length)],
		seedRandom: (seed: any, probability: number) => Math.floor(seedrandom(seed)() * 100) < probability,
		seedRannum: (seed: any, min: number, max: number) => min + Math.floor(seedrandom(seed)() * (max - min + 1)),
		seedRandomPick: (seed: any, list: any[]) => list[Math.floor(seedrandom(seed)() * list.length)],
		DRPWPM: (list: string[]) => {
			const xs: any[] = [];
			let totalFactor = 0;
			for (const x of list) {
				const parts = x.split(' ');
				const factor = parseInt(parts.pop()!, 10);
				const text = parts.join(' ');
				totalFactor += factor;
				xs.push({ factor, text });
			}
			const r = seedrandom(`${day}:${expr.id}`)() * totalFactor;
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

	return funcs;
}
