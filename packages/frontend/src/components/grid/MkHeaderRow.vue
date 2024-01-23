<template>
<tr :class="$style.header">
	<MkNumberCell
		content="#"
		:selectable="false"
		:top="true"
	/>
	<MkHeaderCell
		v-for="column in columns"
		:key="column.index"
		:column="column"
		:bus="bus"
		@width:beginChange="(sender) => emit('width:begin-change', sender)"
		@width:endChange="(sender) => emit('width:end-change', sender)"
		@width:changing="(sender, width) => emit('width:changing', sender, width)"
		@width:largest="(sender) => emit('width:largest', sender)"
		@selection:column="(sender) => emit('selection:column', sender)"
	/>
</tr>
</template>

<script setup lang="ts">
import { GridColumn, GridEventEmitter } from '@/components/grid/types.js';
import MkHeaderCell from '@/components/grid/MkHeaderCell.vue';
import MkNumberCell from '@/components/grid/MkNumberCell.vue';

const emit = defineEmits<{
	(ev: 'width:begin-change', sender: GridColumn): void;
	(ev: 'width:end-change', sender: GridColumn): void;
	(ev: 'width:changing', sender: GridColumn, width: string): void;
	(ev: 'width:largest', sender: GridColumn): void;
	(ev: 'selection:column', sender: GridColumn): void;
}>();
defineProps<{
	columns: GridColumn[],
	bus: GridEventEmitter,
}>();

</script>

<style module lang="scss">
.header {

}
</style>
