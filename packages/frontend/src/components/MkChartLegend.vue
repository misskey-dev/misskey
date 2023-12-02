<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<button v-for="item in items" class="_button item" :class="{ disabled: item.hidden }" @click="onClick(item)">
		<span class="box" :style="{ background: chart.config.type === 'line' ? item.strokeStyle?.toString() : item.fillStyle?.toString() }"></span>
		{{ item.text }}
	</button>
</div>
</template>

<script lang="ts" setup>
import { shallowRef } from 'vue';
import { Chart, LegendItem } from 'chart.js';

const props = defineProps({
});

const chart = shallowRef<Chart>();
const items = shallowRef<LegendItem[]>([]);

function update(_chart: Chart, _items: LegendItem[]) {
	chart.value = _chart,
	items.value = _items;
}

function onClick(item: LegendItem) {
	if (chart.value == null) return;
	const { type } = chart.value.config;
	if (type === 'pie' || type === 'doughnut') {
		// Pie and doughnut charts only have a single dataset and visibility is per item
		chart.value.toggleDataVisibility(item.index);
	} else {
		chart.value.setDatasetVisibility(item.datasetIndex, !chart.value.isDatasetVisible(item.datasetIndex));
	}
	chart.value.update();
}

defineExpose({
	update,
});
</script>

<style lang="scss" module>
.root {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 8px;

	&:global {
		> .item {
			font-size: 85%;
			padding: 4px 12px 4px 8px;
			border: solid 1px var(--divider);
			border-radius: 999px;

			&:hover {
				border-color: var(--inputBorderHover);
			}

			&.disabled {
				text-decoration: line-through;
				opacity: 0.5;
			}

			> .box {
				display: inline-block;
				width: 12px;
				height: 12px;
				border-radius: 100%;
				vertical-align: -10%;
			}
		}
	}
}

@container (max-width: 500px) {
	.root {
		font-size: 90%;
		gap: 6px;
	}
}
</style>
