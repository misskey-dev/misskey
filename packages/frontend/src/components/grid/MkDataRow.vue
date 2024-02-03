<template>
<tr :class="[$style.row, [row.ranged ? $style.ranged : {}]]">
	<MkNumberCell
		v-if="gridSetting.rowNumberVisible"
		:content="(row.index + 1).toString()"
		:row="row"
	/>
	<MkDataCell
		v-for="cell in cells"
		:key="cell.address.col"
		:cell="cell"
		:gridSetting="gridSetting"
		:bus="bus"
		@operation:beginEdit="(sender) => emit('operation:beginEdit', sender)"
		@operation:endEdit="(sender) => emit('operation:endEdit', sender)"
		@change:value="(sender, newValue) => emit('change:value', sender, newValue)"
		@change:contentSize="(sender, newSize) => emit('change:contentSize', sender, newSize)"
	/>
</tr>
</template>

<script setup lang="ts">
import { getCurrentInstance, toRefs, watch } from 'vue';
import { GridEventEmitter, GridSetting, Size } from '@/components/grid/grid.js';
import MkDataCell from '@/components/grid/MkDataCell.vue';
import MkNumberCell from '@/components/grid/MkNumberCell.vue';
import { CellValue, GridCell } from '@/components/grid/cell.js';
import { GridRow } from '@/components/grid/row.js';

const emit = defineEmits<{
	(ev: 'operation:beginEdit', sender: GridCell): void;
	(ev: 'operation:endEdit', sender: GridCell): void;
	(ev: 'change:value', sender: GridCell, newValue: CellValue): void;
	(ev: 'change:contentSize', sender: GridCell, newSize: Size): void;
}>();
const props = defineProps<{
	row: GridRow,
	cells: GridCell[],
	gridSetting: GridSetting,
	bus: GridEventEmitter,
}>();

const { cells, gridSetting } = toRefs(props);

</script>

<style module lang="scss">
.row {
	&.ranged {
		background-color: var(--accentedBg);
	}
}
</style>
