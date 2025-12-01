<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<canvas ref="chartEl"></canvas>
</template>

<script lang="ts" setup>
import { onMounted, useTemplateRef } from 'vue';
import { Chart } from 'chart.js';
import { useChartTooltip } from '@/composables/use-chart-tooltip.js';
import { initChart } from '@/utility/init-chart.js';

export type InstanceForPie = {
	name: string,
	color: string | null,
	value: number,
	onClick?: () => void
};

initChart();

const props = defineProps<{
	data: InstanceForPie[];
}>();

const chartEl = useTemplateRef('chartEl');

const { handler: externalTooltipHandler } = useChartTooltip({
	position: 'middle',
});

let chartInstance: Chart | null = null;

onMounted(() => {
	if (chartEl.value == null) return;

	chartInstance = new Chart(chartEl.value, {
		type: 'doughnut',
		data: {
			labels: props.data.map(x => x.name),
			datasets: [{
				backgroundColor: props.data.map(x => x.color ?? '#000'),
				borderColor: getComputedStyle(window.document.documentElement).getPropertyValue('--MI_THEME-panel'),
				borderWidth: 2,
				hoverOffset: 0,
				data: props.data.map(x => x.value),
			}],
		},
		options: {
			layout: {
				padding: {
					left: 16,
					right: 16,
					top: 16,
					bottom: 16,
				},
			},
			onClick: (ev) => {
				if (ev.native == null) return;
				const hit = chartInstance!.getElementsAtEventForMode(ev.native, 'nearest', { intersect: true }, false)[0];
				if (hit && props.data[hit.index].onClick != null) {
					props.data[hit.index].onClick!();
				}
			},
			plugins: {
				legend: {
					display: false,
				},
				tooltip: {
					enabled: false,
					mode: 'index',
					animation: {
						duration: 0,
					},
					external: externalTooltipHandler,
				},
			},
		},
	});
});
</script>
