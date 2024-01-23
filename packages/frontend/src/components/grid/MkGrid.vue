<template>
<table
	:class="$style.grid"
	@mousedown="onMouseDown"
	@mouseup="onMouseUp"
	@mousemove="onMouseMove"
>
	<thead>
		<MkHeaderRow
			:columns="columns"
			:bus="bus"
			@width:beginChange="onHeaderCellWidthBeginChange"
			@width:endChange="onHeaderCellWidthEndChange"
			@width:changing="onHeaderCellWidthChanging"
			@width:largest="onHeaderCellWidthLargest"
			@selection:column="onSelectionColumn"
		/>
	</thead>
	<tbody>
		<MkDataRow
			v-for="row in rows"
			:key="row.index"
			:row="row"
			:cells="cells[row.index]"
			:bus="bus"
			@edit:begin="onCellEditBegin"
			@edit:end="onCellEditEnd"
			@selection:move="onSelectionMove"
			@selection:row="onSelectionRow"
		/>
	</tbody>
</table>
</template>

<script setup lang="ts">
import { computed, ref, toRefs, watch } from 'vue';
import {
	calcCellWidth,
	CELL_ADDRESS_NONE,
	CellAddress,
	ColumnSetting,
	DataSource,
	equalCellAddress,
	getCellAddress,
	GridCell,
	GridColumn,
	GridEventEmitter,
	GridRow,
	GridState,
	isCellElement,
} from '@/components/grid/types.js';
import MkDataRow from '@/components/grid/MkDataRow.vue';
import MkHeaderRow from '@/components/grid/MkHeaderRow.vue';

const props = defineProps<{
	columnSettings: ColumnSetting[],
	data: DataSource[]
}>();

const { columnSettings, data } = toRefs(props);

const columns = ref<GridColumn[]>([]);
const rows = ref<GridRow[]>([]);
const cells = ref<GridCell[][]>([]);
const rangedCells = computed(() => cells.value.flat().filter(it => it.ranged));
const previousCellAddress = ref<CellAddress>(CELL_ADDRESS_NONE);
const editingCellAddress = ref<CellAddress>(CELL_ADDRESS_NONE);

const state = ref<GridState>('normal');
const bus = new GridEventEmitter();

watch(columnSettings, refreshColumnsSetting);
watch(data, refreshData);
watch(rangedCells, () => {
	if (rangedCells.value.length <= 1) {
		// 範囲セルが1以下の場合、以下の計算が無駄になるのでやらないようにする
		return;
	}

	const min = rangedCells.value.reduce(
		(acc, value) => {
			return {
				col: Math.min(acc.col, value.address.col),
				row: Math.min(acc.row, value.address.row),
			};
		},
		rangedCells.value[0].address,
	);

	const max = rangedCells.value.reduce(
		(acc, value) => {
			return {
				col: Math.max(acc.col, value.address.col),
				row: Math.max(acc.row, value.address.row),
			};
		},
		rangedCells.value[0].address,
	);

	expandRange(min, max);
});

if (_DEV_) {
	watch(state, (value) => {
		console.log(`state: ${value}`);
	});
}

function onMouseDown(ev: MouseEvent) {
	const cellAddress = getCellAddress(ev.target as HTMLElement);
	switch (state.value) {
		case 'cellEditing': {
			if (availableCellAddress(cellAddress) && !equalCellAddress(editingCellAddress.value, cellAddress)) {
				selectionCell(cellAddress);
			}
			break;
		}
		case 'normal': {
			if (availableCellAddress(cellAddress)) {
				selectionCell(cellAddress);
				state.value = 'cellSelecting';
			}
			break;
		}
	}
}

function onMouseUp() {
	switch (state.value) {
		case 'cellSelecting': {
			state.value = 'normal';
			previousCellAddress.value = CELL_ADDRESS_NONE;
			break;
		}
	}
}

function onMouseMove(ev: MouseEvent) {
	switch (state.value) {
		case 'cellSelecting': {
			if (isCellElement(ev.target)) {
				const address = getCellAddress(ev.target);
				if (!equalCellAddress(previousCellAddress.value, address)) {
					if (isCellElement(ev.target)) {
						selectionRange(getCellAddress(ev.target));
					}

					previousCellAddress.value = address;
				}
			}

			break;
		}
	}
}

function onCellEditBegin(sender: GridCell) {
	state.value = 'cellEditing';
	editingCellAddress.value = sender.address;
	for (const cell of cells.value.flat()) {
		if (cell.address.col !== sender.address.col || cell.address.row !== sender.address.row) {
			// 編集状態となったセル以外は全部選択解除
			cell.selected = false;
		}
	}
}

function onCellEditEnd() {
	editingCellAddress.value = CELL_ADDRESS_NONE;
	state.value = 'normal';
}

function onSelectionMove(_: GridCell, next: CellAddress) {
	if (availableCellAddress(next)) {
		selectionCell(next);
	}
}

function onHeaderCellWidthBeginChange(_: GridColumn) {
	switch (state.value) {
		case 'normal': {
			state.value = 'colResizing';
			break;
		}
	}
}

function onHeaderCellWidthEndChange(_: GridColumn) {
	switch (state.value) {
		case 'colResizing': {
			state.value = 'normal';
			break;
		}
	}
}

function onHeaderCellWidthChanging(sender: GridColumn, width: string) {
	switch (state.value) {
		case 'colResizing': {
			const column = columns.value[sender.index];
			column.width = width;
			break;
		}
	}
}

function onHeaderCellWidthLargest(sender: GridColumn) {
	switch (state.value) {
		case 'normal': {
			const column = columns.value[sender.index];
			const _cells = cells.value;
			const largestColumnWidth = columns.value.reduce(
				(acc, value) => Math.max(acc, value.contentSize.width),
				columns.value[sender.index].contentSize.width,
			);
			const largestCellWidth = _cells
				.map(row => row[column.index])
				.reduce(
					(acc, value) => Math.max(acc, value.contentSize.width),
					_cells[0][column.index].contentSize.width,
				);
			column.width = `${Math.max(largestColumnWidth, largestCellWidth)}px`;
			break;
		}
	}
}

function onSelectionColumn(sender: GridColumn) {
	unSelectionRange();

	const targets = cells.value.map(row => row[sender.index].address);
	selectionRange(...targets);
}

function onSelectionRow(sender: GridRow) {
	unSelectionRange();

	const targets = cells.value[sender.index].map(cell => cell.address);
	selectionRange(...targets);
}

function selectionCell(target: CellAddress) {
	const _cells = cells.value;

	for (const row of cells.value) {
		for (const cell of row) {
			cell.selected = false;
			cell.ranged = false;
		}
	}

	_cells[target.row][target.col].selected = true;
	_cells[target.row][target.col].ranged = true;
}

function selectionRange(...targets: CellAddress[]) {
	const _cells = cells.value;
	for (const target of targets) {
		_cells[target.row][target.col].ranged = true;
	}
}

function unSelectionRange() {
	const _cells = cells.value;
	for (const row of _cells) {
		for (const cell of row) {
			cell.selected = false;
			cell.ranged = false;
		}
	}
}

function expandRange(min: CellAddress, max: CellAddress) {
	const targetRows = cells.value.slice(min.row, max.row + 1);
	for (const row of targetRows) {
		for (const cell of row.slice(min.col, max.col + 1)) {
			cell.ranged = true;
		}
	}
}

function availableCellAddress(cellAddress: CellAddress): boolean {
	return cellAddress.row >= 0 && cellAddress.col >= 0 && cellAddress.row < rows.value.length && cellAddress.col < columns.value.length;
}

function refreshColumnsSetting() {
	const bindToList = columnSettings.value.map(it => it.bindTo);
	if (new Set(bindToList).size !== columnSettings.value.length) {
		throw new Error(`Duplicate bindTo setting : [${bindToList.join(',')}]}]`);
	}

	refreshData();
}

function refreshData() {
	const _data: DataSource[] = data.value;
	const _rows: GridRow[] = _data.map((_, index) => ({
		index,
	}));
	const _columns: GridColumn[] = columnSettings.value.map((setting, index) => ({
		index,
		setting,
		width: calcCellWidth(setting.width),
		contentSize: { width: 0, height: 0 },
	}));
	const _cells = Array.of<GridCell[]>();

	for (const [rowIndex, row] of _rows.entries()) {
		const rowCells = Array.of<GridCell>();
		for (const [colIndex, column] of _columns.entries()) {
			const value = (column.setting.bindTo in _data[rowIndex])
				? _data[rowIndex][column.setting.bindTo]
				: undefined;

			const cell: GridCell = {
				address: { col: colIndex, row: rowIndex },
				value,
				column: column,
				row: row,
				selected: false,
				ranged: false,
				contentSize: { width: 0, height: 0 },
			};

			rowCells.push(cell);
		}

		_cells.push(rowCells);
	}

	rows.value = _rows;
	columns.value = _columns;
	cells.value = _cells;
}

refreshColumnsSetting();
refreshData();

</script>

<style module lang="scss">
.grid {
	overflow: scroll;
	table-layout: fixed;
	width: fit-content;
	user-select: none;

	border: solid 0.5px var(--divider);
	border-spacing: 0;
	border-radius: var(--radius);
}
</style>
