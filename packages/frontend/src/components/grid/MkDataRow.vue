<template>
<tr :class="$style.row">
	<MkNumberCell
		:content="(row.index + 1).toString()"
		:row="row"
	/>
	<MkDataCell
		v-for="cell in cells"
		:key="cell.address.col"
		:cell="cell"
		:bus="bus"
		@operation:beginEdit="(sender) => emit('operation:beginEdit', sender)"
		@operation:endEdit="(sender) => emit('operation:endEdit', sender)"
		@change:value="(sender, newValue) => emit('change:value', sender, newValue)"
		@change:contentSize="(sender, newSize) => emit('change:contentSize', sender, newSize)"
	/>
</tr>
</template>

<script setup lang="ts">
import { toRefs } from 'vue';
import { CellValue, GridCell, GridEventEmitter, GridRow, Size } from '@/components/grid/types.js';
import MkDataCell from '@/components/grid/MkDataCell.vue';
import MkNumberCell from '@/components/grid/MkNumberCell.vue';

const emit = defineEmits<{
	(ev: 'operation:beginEdit', sender: GridCell): void;
	(ev: 'operation:endEdit', sender: GridCell): void;
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
