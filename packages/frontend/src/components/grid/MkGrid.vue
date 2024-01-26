<template>
<table
	:class="$style.grid"
	@mousedown="onMouseDown"
	@keydown="onKeyDown"
>
	<thead>
		<MkHeaderRow
			:columns="columns"
			:bus="bus"
			@operation:beginWidthChange="onHeaderCellWidthBeginChange"
			@operation:endWidthChange="onHeaderCellWidthEndChange"
			@operation:widthLargest="onHeaderCellWidthLargest"
			@operation:selectionColumn="onSelectionColumn"
			@change:width="onHeaderCellChangeWidth"
			@change:contentSize="onHeaderCellChangeContentSize"
		/>
	</thead>
	<tbody>
		<MkDataRow
			v-for="row in rows"
			:key="row.index"
			:row="row"
			:cells="cells[row.index]"
			:bus="bus"
			@operation:beginEdit="onCellEditBegin"
			@operation:endEdit="onCellEditEnd"
			@operation:selectionMove="onSelectionMove"
			@operation:selectionRow="onSelectionRow"
			@change:value="onChangeCellValue"
			@change:contentSize="onChangeCellContentSize"
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
	CellValue,
	ColumnSetting,
	DataSource,
	equalCellAddress,
	getCellAddress,
	GridCell,
	GridColumn,
	GridEventEmitter,
	GridRow,
	GridState,
	Size,
} from '@/components/grid/types.js';
import MkDataRow from '@/components/grid/MkDataRow.vue';
import MkHeaderRow from '@/components/grid/MkHeaderRow.vue';

const props = defineProps<{
	columnSettings: ColumnSetting[],
	data: DataSource[]
}>();

const bus = new GridEventEmitter();

const { columnSettings, data } = toRefs(props);

const columns = ref<GridColumn[]>([]);
const rows = ref<GridRow[]>([]);
const cells = ref<GridCell[][]>([]);
const previousCellAddress = ref<CellAddress>(CELL_ADDRESS_NONE);
const editingCellAddress = ref<CellAddress>(CELL_ADDRESS_NONE);
const firstSelectionColumnIdx = ref<number>(CELL_ADDRESS_NONE.col);
const firstSelectionRowIdx = ref<number>(CELL_ADDRESS_NONE.row);
const state = ref<GridState>('normal');

const selectedCell = computed(() => {
	const selected = cells.value.flat().filter(it => it.selected);
	return selected.length > 0 ? selected[0] : undefined;
});
const rangedCells = computed(() => cells.value.flat().filter(it => it.ranged));

watch(columnSettings, refreshColumnsSetting);
watch(data, refreshData);
if (_DEV_) {
	watch(state, (value) => {
		console.log(`state: ${value}`);
	});
}

function onKeyDown(ev: KeyboardEvent) {
	switch (state.value) {
		case 'normal': {
			const selectedCellAddress = selectedCell.value?.address;
			if (!selectedCellAddress) {
				return;
			}

			let next: CellAddress;
			switch (ev.code) {
				case 'ArrowRight': {
					next = { col: selectedCellAddress.col + 1, row: selectedCellAddress.row };
					break;
				}
				case 'ArrowLeft': {
					next = { col: selectedCellAddress.col - 1, row: selectedCellAddress.row };
					break;
				}
				case 'ArrowUp': {
					next = { col: selectedCellAddress.col, row: selectedCellAddress.row - 1 };
					break;
				}
				case 'ArrowDown': {
					next = { col: selectedCellAddress.col, row: selectedCellAddress.row + 1 };
					break;
				}
				default: {
					return;
				}
			}

			selectionCell(next);
			break;
		}
	}
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
			const cellAddress = getCellAddress(ev.target as HTMLElement);
			if (availableCellAddress(cellAddress)) {
				selectionCell(cellAddress);

				registerMouseUp();
				registerMouseMove();
				state.value = 'cellSelecting';
			} else if (isColumnHeaderCellAddress(cellAddress)) {
				unSelectionRange();

				const colCells = cells.value.map(row => row[cellAddress.col]);
				selectionRange(...colCells.map(cell => cell.address));

				registerMouseUp();
				registerMouseMove();
				firstSelectionColumnIdx.value = cellAddress.col;
				state.value = 'colSelecting';
			} else if (isRowNumberCellAddress(cellAddress)) {
				unSelectionRange();

				const rowCells = cells.value[cellAddress.row];
				selectionRange(...rowCells.map(cell => cell.address));

				registerMouseUp();
				registerMouseMove();
				firstSelectionRowIdx.value = cellAddress.row;
				state.value = 'rowSelecting';
			}
			break;
		}
	}
}

function onMouseMove(ev: MouseEvent) {
	switch (state.value) {
		case 'cellSelecting': {
			const selectedCellAddress = selectedCell.value?.address;
			const targetCellAddress = getCellAddress(ev.target as HTMLElement);
			if (equalCellAddress(previousCellAddress.value, targetCellAddress) || !availableCellAddress(targetCellAddress) || !selectedCellAddress) {
				return;
			}

			const leftTop = {
				col: Math.min(targetCellAddress.col, selectedCellAddress.col),
				row: Math.min(targetCellAddress.row, selectedCellAddress.row),
			};

			const rightBottom = {
				col: Math.max(targetCellAddress.col, selectedCellAddress.col),
				row: Math.max(targetCellAddress.row, selectedCellAddress.row),
			};

			unSelectionOutOfRange(leftTop, rightBottom);
			expandRange(leftTop, rightBottom);
			previousCellAddress.value = targetCellAddress;

			break;
		}
		case 'colSelecting': {
			const targetCellAddress = getCellAddress(ev.target as HTMLElement);
			if (!isColumnHeaderCellAddress(targetCellAddress) || previousCellAddress.value.col === targetCellAddress.col) {
				return;
			}

			const leftTop = {
				col: Math.min(targetCellAddress.col, firstSelectionColumnIdx.value),
				row: 0,
			};

			const rightBottom = {
				col: Math.max(targetCellAddress.col, firstSelectionColumnIdx.value),
				row: cells.value.length - 1,
			};

			unSelectionOutOfRange(leftTop, rightBottom);
			expandRange(leftTop, rightBottom);
			previousCellAddress.value = targetCellAddress;

			break;
		}
		case 'rowSelecting': {
			const targetCellAddress = getCellAddress(ev.target as HTMLElement);
			if (!isRowNumberCellAddress(targetCellAddress) || previousCellAddress.value.row === targetCellAddress.row) {
				return;
			}

			const leftTop = {
				col: 0,
				row: Math.min(targetCellAddress.row, firstSelectionRowIdx.value),
			};

			const rightBottom = {
				col: Math.min(...cells.value.map(it => it.length - 1)),
				row: Math.max(targetCellAddress.row, firstSelectionRowIdx.value),
			};

			unSelectionOutOfRange(leftTop, rightBottom);
			expandRange(leftTop, rightBottom);
			previousCellAddress.value = targetCellAddress;

			break;
		}
	}
}

function onMouseUp(ev: MouseEvent) {
	switch (state.value) {
		case 'rowSelecting':
		case 'colSelecting':
		case 'cellSelecting': {
			unregisterMouseUp();
			unregisterMouseMove();
			state.value = 'normal';
			previousCellAddress.value = CELL_ADDRESS_NONE;
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

function onChangeCellValue(sender: GridCell, newValue: CellValue) {
	cells.value[sender.address.row][sender.address.col].value = newValue;
}

function onChangeCellContentSize(sender: GridCell, contentSize: Size) {
	cells.value[sender.address.row][sender.address.col].contentSize = contentSize;
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

function onHeaderCellChangeWidth(sender: GridColumn, width: string) {
	switch (state.value) {
		case 'colResizing': {
			const column = columns.value[sender.index];
			column.width = width;
			break;
		}
	}
}

function onHeaderCellChangeContentSize(sender: GridColumn, newSize: Size) {
	switch (state.value) {
		case 'normal': {
			columns.value[sender.index].contentSize = newSize;
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
	if (!availableCellAddress(target)) {
		return;
	}

	unSelectionRange();

	const _cells = cells.value;
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
	const _cells = rangedCells.value;
	for (const cell of _cells) {
		cell.selected = false;
		cell.ranged = false;
	}
}

function unSelectionOutOfRange(leftTop: CellAddress, rightBottom: CellAddress) {
	const _cells = rangedCells.value;
	for (const cell of _cells) {
		const outOfRangeCol = cell.address.col < leftTop.col || cell.address.col > rightBottom.col;
		const outOfRangeRow = cell.address.row < leftTop.row || cell.address.row > rightBottom.row;
		if (outOfRangeCol || outOfRangeRow) {
			cell.ranged = false;
		}
	}
}

function expandRange(leftTop: CellAddress, rightBottom: CellAddress) {
	const targetRows = cells.value.slice(leftTop.row, rightBottom.row + 1);
	for (const row of targetRows) {
		for (const cell of row.slice(leftTop.col, rightBottom.col + 1)) {
			cell.ranged = true;
		}
	}
}

function availableCellAddress(cellAddress: CellAddress): boolean {
	return cellAddress.row >= 0 && cellAddress.col >= 0 && cellAddress.row < rows.value.length && cellAddress.col < columns.value.length;
}

function isColumnHeaderCellAddress(cellAddress: CellAddress): boolean {
	return cellAddress.row === -1 && cellAddress.col >= 0;
}

function isRowNumberCellAddress(cellAddress: CellAddress): boolean {
	return cellAddress.row >= 0 && cellAddress.col === -1;
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

function registerMouseMove() {
	unregisterMouseMove();
	addEventListener('mousemove', onMouseMove);
}

function unregisterMouseMove() {
	removeEventListener('mousemove', onMouseMove);
}

function registerMouseUp() {
	unregisterMouseUp();
	addEventListener('mouseup', onMouseUp);
}

function unregisterMouseUp() {
	removeEventListener('mouseup', onMouseUp);
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
