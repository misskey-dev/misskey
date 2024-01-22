<template>
<div :class="$style.row">
	<div v-for="cell in row.cells" :key="JSON.stringify(cell.address)">
		<MkCell :cell="cell"/>
	</div>
</div>
</template>

<script setup lang="ts">
import MkCell from '@/components/grid/MkCell.vue';
import { GridRow } from '@/components/grid/types.js';

defineProps<{ row: GridRow }>();

</script>

<style module lang="scss">
.row {
	display: flex;
	flex-wrap: nowrap;
	flex-direction: row;
}
</style>
