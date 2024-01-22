<template>
<div :style="$style.grid">
	<div :class="$style.header">
		<div
			v-for="column in columns"
			:key="column.index"
			:class="$style.cell"
			:style="{ width: column.setting.width + 'px'}"
		>
			{{ column.setting.title ?? column.setting.bindTo }}
		</div>
	</div>
	<MkRow v-for="row in rows" :key="row.index" :row="row"/>
</div>
</template>

<script setup lang="ts">
import { ref, toRefs, watch } from 'vue';
import MkRow from '@/components/grid/MkRow.vue';
import { ColumnSetting, DataSource, GridCell, GridColumn, GridRow } from '@/components/grid/types.js';

const props = defineProps<{
	columnSettings: ColumnSetting[],
	data: DataSource[]
}>();

const { columnSettings, data } = toRefs(props);
const columns = ref<GridColumn[]>();
const rows = ref<GridRow[]>();

watch(columnSettings, refreshColumnsSetting);
watch(data, refreshData);

function refreshColumnsSetting() {
	const bindToList = columnSettings.value.map(it => it.bindTo);
	if (new Set(bindToList).size !== columnSettings.value.length) {
		throw new Error(`Duplicate bindTo setting : [${bindToList.join(',')}]}]`);
	}

	refreshData();
}

function refreshData() {
	const _settings = columnSettings.value;
	const _data = data.value;
	const _rows = _data.map((_, index) => ({ index, cells: Array.of<GridCell>() }));
	const _columns = columnSettings.value.map((setting, index) => ({ index, setting, cells: Array.of<GridCell>() }));

	for (const [rowIndex, row] of _rows.entries()) {
		for (const [colIndex, column] of _columns.entries()) {
			if (!(column.setting.bindTo in _data[rowIndex])) {
				continue;
			}
			const value = _data[rowIndex][column.setting.bindTo];

			const cell = {
				address: { col: colIndex, row: rowIndex },
				value,
				columnSetting: _settings[colIndex],
			};

			row.cells.push(cell);
			column.cells.push(cell);
		}
	}

	rows.value = _rows;
	columns.value = _columns;
}

refreshColumnsSetting();
refreshData();

</script>

<style module lang="scss">
.grid {
	display: flex;
	flex-wrap: nowrap;
	flex-direction: row;
	overflow: scroll;
}

.header {
	display: flex;
	flex-wrap: nowrap;
	width: fit-content;

	> .cell {
		display: block;
		padding: 4px 8px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		text-align: center;
	}
}
</style>
