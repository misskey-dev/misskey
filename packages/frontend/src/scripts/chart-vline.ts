export const chartVLine = (vLineColor: string) => ({
	id: 'vLine',
	beforeDraw(chart, args, options) {
		if (chart.tooltip?._active?.length) {
			const activePoint = chart.tooltip._active[0];
			const ctx = chart.ctx;
			const x = activePoint.element.x;
			const topY = chart.scales.y.top;
			const bottomY = chart.scales.y.bottom;

			ctx.save();
			ctx.beginPath();
			ctx.moveTo(x, bottomY);
			ctx.lineTo(x, topY);
			ctx.lineWidth = 1;
			ctx.strokeStyle = vLineColor;
			ctx.stroke();
			ctx.restore();
		}
	},
});
