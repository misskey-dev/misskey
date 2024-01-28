<template>
<th :class="[$style.cell, [top ? {} : $style.border]]">
	<div
		:class="[
			$style.root,
		]"
	>
		{{ content }}
	</div>
</th>
</template>

<script setup lang="ts">
import { GridRow } from '@/components/grid/grid.js';

defineProps<{
	content: string,
	row?: GridRow,
	top?: boolean,
}>();

</script>

<style module lang="scss">
$cellHeight: 28px;
$cellWidth: 34px;

.cell {
	overflow: hidden;
	white-space: nowrap;
	height: $cellHeight;
	max-height: $cellHeight;
	min-height: $cellHeight;
	min-width: $cellWidth;
	width: $cellWidth;
	cursor: pointer;
}

.root {
	display: flex;
	flex-direction: row;
	justify-content: center;
	align-items: center;
	box-sizing: border-box;
	padding: 0 8px;
	height: 100%;
	border: solid 0.5px transparent;

	&.selected {
		background-color: var(--accentedBg);
	}
}

.border {
	border-top: solid 0.5px var(--divider);
}
</style>
