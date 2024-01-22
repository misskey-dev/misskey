<template>
<div
	class="cell"
	:style="{ width: width + 'px' }"
>
	<span>{{ cell.value }}</span>
</div>
</template>

<script setup lang="ts">
import { toRefs } from 'vue';
import { GridCell } from '@/components/grid/types.js';

const props = defineProps<{ cell: GridCell }>();
const { cell } = toRefs(props);
const width = cell.value.columnSetting.width;
</script>

<style scoped lang="scss">
.cell {
	display: inline-block;
	padding: 4px 8px;
	overflow: hidden;
	white-space: nowrap;
}
</style>
