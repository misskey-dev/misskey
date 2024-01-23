<template>
<tr :class="$style.row">
	<MkNumberCell
		:content="(row.index + 1).toString()"
		:selectable="true"
		:row="row"
		@selection:row="(sender) => emit('selection:row', sender)"
	/>
	<MkDataCell
		v-for="cell in cells"
		:key="cell.address.col"
		:cell="cell"
		:bus="bus"
		@edit:begin="(sender) => emit('edit:begin', sender)"
		@edit:end="(sender) => emit('edit:end', sender)"
		@selection:move="(sender, next) => emit('selection:move', sender, next)"
	/>
</tr>
</template>

<script setup lang="ts">
import { computed, toRefs } from 'vue';
import { CellAddress, GridCell, GridEventEmitter, GridRow } from '@/components/grid/types.js';
import MkDataCell from '@/components/grid/MkDataCell.vue';
import MkNumberCell from '@/components/grid/MkNumberCell.vue';

const emit = defineEmits<{
	(ev: 'edit:begin', sender: GridCell): void;
	(ev: 'edit:end', sender: GridCell): void;
	(ev: 'selection:move', sender: GridCell, next: CellAddress): void;
	(ev: 'selection:row', sender: GridRow): void;
}>();
const props = defineProps<{
	row: GridRow,
	cells: GridCell[],
	bus: GridEventEmitter,
}>();

const { cells } = toRefs(props);
const last = computed(() => cells.value[cells.value.length - 1]);

</script>

<style module lang="scss">
.row {

}
</style>
