<template>
<tr :class="$style.row">
	<MkNumberCell
		:content="(row.index + 1).toString()"
		:selectable="true"
		:row="row"
		@operation:selectionRow="(sender) => emit('operation:selectionRow', sender)"
	/>
	<MkDataCell
		v-for="cell in cells"
		:key="cell.address.col"
		:cell="cell"
		:bus="bus"
		@operation:beginEdit="(sender) => emit('operation:beginEdit', sender)"
		@operation:endEdit="(sender) => emit('operation:endEdit', sender)"
		@operation:selectionMove="(sender, next) => emit('operation:selectionMove', sender, next)"
		@change:value="(sender, newValue) => emit('change:value', sender, newValue)"
		@change:contentSize="(sender, newSize) => emit('change:contentSize', sender, newSize)"
	/>
</tr>
</template>

<script setup lang="ts">
import { computed, toRefs } from 'vue';
import { CellAddress, CellValue, GridCell, GridEventEmitter, GridRow, Size } from '@/components/grid/types.js';
import MkDataCell from '@/components/grid/MkDataCell.vue';
import MkNumberCell from '@/components/grid/MkNumberCell.vue';

const emit = defineEmits<{
	(ev: 'operation:beginEdit', sender: GridCell): void;
	(ev: 'operation:endEdit', sender: GridCell): void;
	(ev: 'operation:selectionRow', sender: GridRow): void;
	(ev: 'operation:selectionMove', sender: GridCell, next: CellAddress): void;
	(ev: 'change:value', sender: GridCell, newValue: CellValue): void;
	(ev: 'change:contentSize', sender: GridCell, newSize: Size): void;
}>();
const props = defineProps<{
	row: GridRow,
	cells: GridCell[],
	bus: GridEventEmitter,
}>();

const { cells } = toRefs(props);

</script>

<style module lang="scss">
.row {

}
</style>
