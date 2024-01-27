<template>
<table
	ref="rootEl"
	tabindex="-1"
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
	CellValue, CellValueChangedEvent,
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
import copyToClipboard from '@/scripts/copy-to-clipboard.js';

const props = defineProps<{
	columnSettings: ColumnSetting[],
	data: DataSource[]
}>();

const emit = defineEmits<{
	(ev: 'change:cellValue', event: CellValueChangedEvent): void;
}>();

const bus = new GridEventEmitter();

const { columnSettings, data } = toRefs(props);

const rootEl = ref<InstanceType<typeof HTMLTableElement>>();
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
const rangedBounds = computed(() => {
	const _cells = rangedCells.value;
	const leftTop = {
		col: Math.min(..._cells.map(it => it.address.col)),
		row: Math.min(..._cells.map(it => it.address.row)),
	};
	const rightBottom = {
		col: Math.max(..._cells.map(it => it.address.col)),
		row: Math.max(..._cells.map(it => it.address.row)),
	};
	return {
		leftTop,
		rightBottom,
	};
});
const availableBounds = computed(() => {
	const leftTop = {
		col: 0,
		row: 0,
	};
	const rightBottom = {
		col: Math.max(...columns.value.map(it => it.index)),
		row: Math.max(...rows.value.map(it => it.index)),
	};
	return { leftTop, rightBottom };
});

watch(columnSettings, refreshColumnsSetting);
watch(data, refreshData);

if (_DEV_) {
	watch(state, (value) => {
		console.log(`state: ${value}`);
	});
}

function onKeyDown(ev: KeyboardEvent) {
	if (_DEV_) {
		console.log('[Grid]', `ctrl: ${ev.ctrlKey}, shift: ${ev.shiftKey}, code: ${ev.code}`);
	}

	switch (state.value) {
		case 'normal': {
			// normalの時は自前で制御したい
			ev.preventDefault();

			if (ev.ctrlKey) {
				if (ev.shiftKey) {
					// ctrl + shiftキーが押されている場合は選択セルの範囲拡大（最大範囲）
					const selectedCellAddress = requireSelectionCell();
					const max = availableBounds.value;
					const bounds = rangedBounds.value;

					let newBounds: { leftTop: CellAddress, rightBottom: CellAddress };
					switch (ev.code) {
						case 'ArrowRight': {
							newBounds = {
								leftTop: { col: selectedCellAddress.col, row: bounds.leftTop.row },
								rightBottom: { col: max.rightBottom.col, row: bounds.rightBottom.row },
							};
							break;
						}
						case 'ArrowLeft': {
							newBounds = {
								leftTop: { col: max.leftTop.col, row: bounds.leftTop.row },
								rightBottom: { col: selectedCellAddress.col, row: bounds.rightBottom.row },
							};
							break;
						}
						case 'ArrowUp': {
							newBounds = {
								leftTop: { col: bounds.leftTop.col, row: max.leftTop.row },
								rightBottom: { col: bounds.rightBottom.col, row: selectedCellAddress.row },
							};
							break;
						}
						case 'ArrowDown': {
							newBounds = {
								leftTop: { col: bounds.leftTop.col, row: selectedCellAddress.row },
								rightBottom: { col: bounds.rightBottom.col, row: max.rightBottom.row },
							};
							break;
						}
						default: {
							return;
						}
					}

					unSelectionOutOfRange(newBounds.leftTop, newBounds.rightBottom);
					expandRange(newBounds.leftTop, newBounds.rightBottom);
				} else {
					switch (ev.code) {
						case 'KeyC': {
							rangeCopyToClipboard();
							break;
						}
						case 'KeyV': {
							pasteFromClipboard();
							break;
						}
					}
				}
			} else {
				if (ev.shiftKey) {
					// shiftキーが押されている場合は選択セルの範囲拡大（隣のセルまで）
					const selectedCellAddress = requireSelectionCell();
					const bounds = rangedBounds.value;
					let newBounds: { leftTop: CellAddress, rightBottom: CellAddress };
					switch (ev.code) {
						case 'ArrowRight': {
							newBounds = {
								leftTop: {
									col: bounds.leftTop.col < selectedCellAddress.col
										? bounds.leftTop.col + 1
										: selectedCellAddress.col,
									row: bounds.leftTop.row,
								},
								rightBottom: {
									col: (bounds.rightBottom.col > selectedCellAddress.col || bounds.leftTop.col === selectedCellAddress.col)
										? bounds.rightBottom.col + 1
										: selectedCellAddress.col,
									row: bounds.rightBottom.row,
								},
							};
							break;
						}
						case 'ArrowLeft': {
							newBounds = {
								leftTop: {
									col: (bounds.leftTop.col < selectedCellAddress.col || bounds.rightBottom.col === selectedCellAddress.col)
										? bounds.leftTop.col - 1
										: selectedCellAddress.col,
									row: bounds.leftTop.row,
								},
								rightBottom: {
									col: bounds.rightBottom.col > selectedCellAddress.col
										? bounds.rightBottom.col - 1
										: selectedCellAddress.col,
									row: bounds.rightBottom.row,
								},
							};
							break;
						}
						case 'ArrowUp': {
							newBounds = {
								leftTop: {
									col: bounds.leftTop.col,
									row: (bounds.leftTop.row < selectedCellAddress.row || bounds.rightBottom.row === selectedCellAddress.row)
										? bounds.leftTop.row - 1
										: selectedCellAddress.row,
								},
								rightBottom: {
									col: bounds.rightBottom.col,
									row: bounds.rightBottom.row > selectedCellAddress.row
										? bounds.rightBottom.row - 1
										: selectedCellAddress.row,
								},
							};
							break;
						}
						case 'ArrowDown': {
							newBounds = {
								leftTop: {
									col: bounds.leftTop.col,
									row: bounds.leftTop.row < selectedCellAddress.row
										? bounds.leftTop.row + 1
										: selectedCellAddress.row,
								},
								rightBottom: {
									col: bounds.rightBottom.col,
									row: (bounds.rightBottom.row > selectedCellAddress.row || bounds.leftTop.row === selectedCellAddress.row)
										? bounds.rightBottom.row + 1
										: selectedCellAddress.row,
								},
							};
							break;
						}
						default: {
							return;
						}
					}

					unSelectionOutOfRange(newBounds.leftTop, newBounds.rightBottom);
					expandRange(newBounds.leftTop, newBounds.rightBottom);
				} else {
					// shiftキーもctrlキーが押されていない場合
					switch (ev.code) {
						case 'ArrowRight': {
							const selectedCellAddress = requireSelectionCell();
							selectionCell({ col: selectedCellAddress.col + 1, row: selectedCellAddress.row });
							break;
						}
						case 'ArrowLeft': {
							const selectedCellAddress = requireSelectionCell();
							selectionCell({ col: selectedCellAddress.col - 1, row: selectedCellAddress.row });
							break;
						}
						case 'ArrowUp': {
							const selectedCellAddress = requireSelectionCell();
							selectionCell({ col: selectedCellAddress.col, row: selectedCellAddress.row - 1 });
							break;
						}
						case 'ArrowDown': {
							const selectedCellAddress = requireSelectionCell();
							selectionCell({ col: selectedCellAddress.col, row: selectedCellAddress.row + 1 });
							break;
						}
						case 'Delete': {
							const ranges = rangedCells.value;
							for (const range of ranges) {
								range.value = undefined;
							}
							break;
						}
						default: {
							return;
						}
					}
				}
			}
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

				rootEl.value?.focus();
			} else if (isRowNumberCellAddress(cellAddress)) {
				unSelectionRange();

				const rowCells = cells.value[cellAddress.row];
				selectionRange(...rowCells.map(cell => cell.address));

				registerMouseUp();
				registerMouseMove();
				firstSelectionRowIdx.value = cellAddress.row;
				state.value = 'rowSelecting';

				rootEl.value?.focus();
			}
			break;
		}
	}
}

function onMouseMove(ev: MouseEvent) {
	ev.preventDefault();
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
	ev.preventDefault();
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
	setCellValue(sender, newValue);
}

function onChangeCellContentSize(sender: GridCell, contentSize: Size) {
	cells.value[sender.address.row][sender.address.col].contentSize = contentSize;
}

function onHeaderCellWidthBeginChange() {
	switch (state.value) {
		case 'normal': {
			state.value = 'colResizing';
			break;
		}
	}
}

function onHeaderCellWidthEndChange() {
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

function setCellValue(sender: GridCell | CellAddress, newValue: CellValue) {
	const cellAddress = 'address' in sender ? sender.address : sender;
	cells.value[cellAddress.row][cellAddress.col].value = newValue;
	emit('change:cellValue', {
		column: columns.value[cellAddress.col],
		row: rows.value[cellAddress.row],
		value: newValue,
	});
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

function requireSelectionCell(): CellAddress {
	const selected = selectedCell.value;
	if (!selected) {
		throw new Error('No selected cell');
	}

	return selected.address;
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

function rangeCopyToClipboard() {
	const lines = Array.of<string>();
	const bounds = rangedBounds.value;
	for (let row = bounds.leftTop.row; row <= bounds.rightBottom.row; row++) {
		const items = Array.of<string>();
		for (let col = bounds.leftTop.col; col <= bounds.rightBottom.col; col++) {
			const cell = cells.value[row][col];
			items.push(cell.value?.toString() ?? '');
		}
		lines.push(items.join('\t'));
	}

	const text = lines.join('\n');
	copyToClipboard(text);
}

async function pasteFromClipboard() {
	function parseValue(value: string, type: ColumnSetting['type']): CellValue {
		switch (type) {
			case 'number': {
				return Number(value);
			}
			case 'boolean': {
				return value === 'true';
			}
			default: {
				return value;
			}
		}
	}

	const clipBoardText = await navigator.clipboard.readText();

	const bounds = rangedBounds.value;
	const lines = clipBoardText.replace(/\r/g, '')
		.split('\n')
		.map(it => it.split('\t'));

	if (lines.length === 1 && lines[0].length === 1) {
		// 単独文字列の場合は選択範囲全体に同じテキストを貼り付ける
		const ranges = rangedCells.value;
		for (const cell of ranges) {
			setCellValue(cell, parseValue(lines[0][0], cell.column.setting.type));
		}
	} else {
		// 表形式文字列の場合は表形式にパースし、選択範囲に合うように貼り付ける
		const offsetRow = bounds.leftTop.row;
		const offsetCol = bounds.leftTop.col;
		for (let row = bounds.leftTop.row; row <= bounds.rightBottom.row; row++) {
			const rowIdx = row - offsetRow;
			if (lines.length <= rowIdx) {
				// クリップボードから読んだ二次元配列よりも選択範囲の方が大きい場合、貼り付け操作を打ち切る
				break;
			}

			const items = lines[rowIdx];
			for (let col = bounds.leftTop.col; col <= bounds.rightBottom.col; col++) {
				const colIdx = col - offsetCol;
				if (items.length <= colIdx) {
					// クリップボードから読んだ二次元配列よりも選択範囲の方が大きい場合、貼り付け操作を打ち切る
					break;
				}

				setCellValue(cells.value[row][col], parseValue(items[colIdx], cells.value[row][col].column.setting.type));
			}
		}
	}
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
