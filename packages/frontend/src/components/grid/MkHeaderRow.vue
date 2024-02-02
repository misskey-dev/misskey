<template>
<tr :class="$style.header">
	<MkNumberCell
		v-if="gridSetting.rowNumberVisible"
		content="#"
		:top="true"
	/>
	<MkHeaderCell
		v-for="column in columns"
		:key="column.index"
		:column="column"
		:bus="bus"
		@operation:beginWidthChange="(sender) => emit('operation:beginWidthChange', sender)"
		@operation:endWidthChange="(sender) => emit('operation:endWidthChange', sender)"
		@operation:widthLargest="(sender) => emit('operation:widthLargest', sender)"
		@change:width="(sender, width) => emit('change:width', sender, width)"
		@change:contentSize="(sender, newSize) => emit('change:contentSize', sender, newSize)"
	/>
</tr>
</template>

<script setup lang="ts">
import { GridEventEmitter, GridSetting, Size } from '@/components/grid/grid.js';
import MkHeaderCell from '@/components/grid/MkHeaderCell.vue';
import MkNumberCell from '@/components/grid/MkNumberCell.vue';
import { GridColumn } from '@/components/grid/column.js';

const emit = defineEmits<{
	(ev: 'operation:beginWidthChange', sender: GridColumn): void;
	(ev: 'operation:endWidthChange', sender: GridColumn): void;
	(ev: 'operation:widthLargest', sender: GridColumn): void;
	(ev: 'operation:selectionColumn', sender: GridColumn): void;
	(ev: 'change:width', sender: GridColumn, width: string): void;
	(ev: 'change:contentSize', sender: GridColumn, newSize: Size): void;
}>();
defineProps<{
	columns: GridColumn[],
	gridSetting: GridSetting,
	bus: GridEventEmitter,
}>();

</script>

<style module lang="scss">
.header {

}
</style>
