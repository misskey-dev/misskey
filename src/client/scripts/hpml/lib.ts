import * as tinycolor from 'tinycolor2';
import Chart from 'chart.js';
import { Hpml } from './evaluator';
import { values, utils } from '@syuilo/aiscript';

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

export function initLib(hpml: Hpml) {
	return {
		'MkPages:updated': values.FN_NATIVE(([callback]) => {
			hpml.pageVarUpdatedCallback = callback;
		}),
		'MkPages:get_canvas': values.FN_NATIVE(([id]) => {
			utils.assertString(id);
			const canvas = hpml.canvases[id.value];
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
			const canvas = hpml.canvases[id.value];
			const color = getComputedStyle(document.documentElement).getPropertyValue('--accent');
			Chart.defaults.global.defaultFontColor = '#555';
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
		})
	};
}
