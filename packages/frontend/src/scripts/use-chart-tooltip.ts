/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { onUnmounted, onDeactivated, ref } from 'vue';
import * as os from '@/os.js';
import MkChartTooltip from '@/components/MkChartTooltip.vue';

export function useChartTooltip(opts: { position: 'top' | 'middle' } = { position: 'top' }) {
	const tooltipShowing = ref(false);
	const tooltipX = ref(0);
	const tooltipY = ref(0);
	const tooltipTitle = ref<string | null>(null);
	const tooltipSeries = ref<{
		backgroundColor: string;
		borderColor: string;
		text: string;
	}[] | null>(null);
	let disposeTooltipComponent;

	os.popup(MkChartTooltip, {
		showing: tooltipShowing,
		x: tooltipX,
		y: tooltipY,
		title: tooltipTitle,
		series: tooltipSeries,
	}, {}).then(({ dispose }) => {
		disposeTooltipComponent = dispose;
	});

	onUnmounted(() => {
		if (disposeTooltipComponent) disposeTooltipComponent();
	});

	onDeactivated(() => {
		tooltipShowing.value = false;
	});

	function handler(context) {
		if (context.tooltip.opacity === 0) {
			tooltipShowing.value = false;
			return;
		}

		tooltipTitle.value = context.tooltip.title[0];
		tooltipSeries.value = context.tooltip.body.map((b, i) => ({
			backgroundColor: context.tooltip.labelColors[i].backgroundColor,
			borderColor: context.tooltip.labelColors[i].borderColor,
			text: b.lines[0],
		}));

		const rect = context.chart.canvas.getBoundingClientRect();

		tooltipShowing.value = true;
		tooltipX.value = rect.left + window.scrollX + context.tooltip.caretX;
		if (opts.position === 'top') {
			tooltipY.value = rect.top + window.scrollY;
		} else if (opts.position === 'middle') {
			tooltipY.value = rect.top + window.scrollY + context.tooltip.caretY;
		}
	}

	return {
		handler,
	};
}
