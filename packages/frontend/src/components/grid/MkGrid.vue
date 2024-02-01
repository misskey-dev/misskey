<template>
<table
	ref="rootEl"
	tabindex="-1"
	:class="[$style.grid, $style.border]"
	@mousedown.prevent="onMouseDown"
	@keydown="onKeyDown"
	@contextmenu.prevent.stop="onContextMenu"
>
	<thead>
		<MkHeaderRow
			:columns="columns"
			:gridSetting="gridSetting"
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
			:gridSetting="gridSetting"
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
import { computed, onMounted, ref, toRefs, watch } from 'vue';
import {
	ColumnSetting,
	DataSource,
	GridColumn,
	GridEventEmitter,
	GridRow,
	GridSetting,
	GridState,
	Size,
} from '@/components/grid/grid.js';
import MkDataRow from '@/components/grid/MkDataRow.vue';
import MkHeaderRow from '@/components/grid/MkHeaderRow.vue';
import { cellValidation } from '@/components/grid/cell-validators.js';
import { CELL_ADDRESS_NONE, CellAddress, CellValue, GridCell } from '@/components/grid/cell.js';
import { calcCellWidth, equalCellAddress, getCellAddress } from '@/components/grid/utils.js';
import { MenuItem } from '@/types/menu.js';
import * as os from '@/os.js';
import { GridCurrentState, GridEvent } from '@/components/grid/grid-event.js';

const props = withDefaults(defineProps<{
	gridSetting?: GridSetting,
	columnSettings: ColumnSetting[],
	data: DataSource[]
}>(), {
	gridSetting: () => ({
		rowNumberVisible: true,
	}),
});

const emit = defineEmits<{
	(ev: 'event', event: GridEvent, current: GridCurrentState): void;
}>();

/**
 * grid -> 各子コンポーネントのイベント経路を担う{@link GridEventEmitter}。おもにpropsでの伝搬が難しいイベントを伝搬するために使用する。
 * 子コンポーネント -> gridのイベントでは原則使用せず、{@link emit}を使用する。
 */
const bus = new GridEventEmitter();
/**
 * テーブルコンポーネントのリサイズイベントを監視するための{@link ResizeObserver}。
 * 表示切替を検知し、サイズの再計算要求を発行するために使用する（マウント時にコンテンツが表示されていない場合、初手のサイズの自動計算が正常に働かないため）
 *
 * {@link setTimeout}を経由している理由は、{@link onResize}の中でサイズ再計算要求→サイズ変更が発生するとループとみなされ、
 * 「ResizeObserver loop completed with undelivered notifications.」という警告が発生するため（再計算が完全に終われば通知は発生しなくなるので実際にはループしない）
 *
 * @see {@link onResize}
 */
const resizeObserver = new ResizeObserver((entries) => setTimeout(() => onResize(entries)));

const { gridSetting, columnSettings, data } = toRefs(props);

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
	const cols = _cells.map(it => it.address.col);
	const rows = _cells.map(it => it.address.row);

	const leftTop = {
		col: Math.min(...cols),
		row: Math.min(...rows),
	};
	const rightBottom = {
		col: Math.max(...cols),
		row: Math.max(...rows),
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
const rangedRows = computed(() => rows.value.filter(it => it.ranged));

watch(columnSettings, refreshColumnsSetting, { immediate: true });
watch(data, refreshData, { immediate: true, deep: true });

if (_DEV_) {
	watch(state, (value, oldValue) => {
		console.log(`[grid][state] ${oldValue} -> ${value}`);
	});
}

function onResize(entries: ResizeObserverEntry[]) {
	if (entries.length !== 1 || entries[0].target !== rootEl.value) {
		return;
	}

	const contentRect = entries[0].contentRect;
	if (_DEV_) {
		console.log(`[grid][resize] contentRect: ${contentRect.width}x${contentRect.height}`);
	}

	switch (state.value) {
		case 'hidden': {
			if (contentRect.width > 0 && contentRect.height > 0) {
				// 先に状態を変更しておき、再計算要求が複数回走らないようにする
				state.value = 'normal';

				// 選択状態が狂うかもしれないので解除しておく
				unSelectionRange();

				// 再計算要求を発行。各セル側で最低限必要な横幅を算出し、emitで返してくるようになっている
				bus.emit('forceRefreshContentSize');
			}
			break;
		}
		default: {
			if (contentRect.width === 0 || contentRect.height === 0) {
				state.value = 'hidden';
			}
			break;
		}
	}
}

function onKeyDown(ev: KeyboardEvent) {
	if (_DEV_) {
		console.log(`[grid][key] ctrl: ${ev.ctrlKey}, shift: ${ev.shiftKey}, code: ${ev.code}`);
	}

	switch (state.value) {
		case 'normal': {
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
					expandCellRange(newBounds.leftTop, newBounds.rightBottom);
				} else {
					// その他のキーは外部にゆだねる
					emitGridEvent({ type: 'keydown', event: ev });
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
					expandCellRange(newBounds.leftTop, newBounds.rightBottom);
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
						default: {
							// その他のキーは外部にゆだねる
							emitGridEvent({ type: 'keydown', event: ev });
							break;
						}
					}
				}
			}
			break;
		}
	}
}

function onMouseDown(ev: MouseEvent) {
	switch (ev.button) {
		case 0: {
			onLeftMouseDown(ev);
			break;
		}
		case 2: {
			onRightMouseDown(ev);
			break;
		}
	}
}

function onLeftMouseDown(ev: MouseEvent) {
	const cellAddress = getCellAddress(ev.target as HTMLElement);
	if (_DEV_) {
		console.log(`[grid][mouse-left] state:${state.value}, button: ${ev.button}, cell: ${cellAddress.row}x${cellAddress.col}`);
	}

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

				expandRowRange(cellAddress.row, cellAddress.row);

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

function onRightMouseDown(ev: MouseEvent) {
	const cellAddress = getCellAddress(ev.target as HTMLElement);
	if (_DEV_) {
		console.log(`[grid][mouse-right] button: ${ev.button}, cell: ${cellAddress.row}x${cellAddress.col}`);
	}

	switch (state.value) {
		case 'normal': {
			if (!availableCellAddress(cellAddress)) {
				return;
			}

			const _rangedCells = [...rangedCells.value];
			if (!_rangedCells.some(it => equalCellAddress(it.address, cellAddress))) {
				// 範囲選択外を右クリックした場合は、範囲選択を解除（範囲選択内であれば範囲選択を維持する）
				selectionCell(cellAddress);
			}

			break;
		}
	}
}

function onMouseMove(ev: MouseEvent) {
	ev.preventDefault();

	const targetCellAddress = getCellAddress(ev.target as HTMLElement);
	if (equalCellAddress(previousCellAddress.value, targetCellAddress)) {
		return;
	}

	if (_DEV_) {
		console.log(`[grid][mouse-move] button: ${ev.button}, cell: ${targetCellAddress.row}x${targetCellAddress.col}`);
	}

	switch (state.value) {
		case 'cellSelecting': {
			const selectedCellAddress = selectedCell.value?.address;
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
			expandCellRange(leftTop, rightBottom);
			previousCellAddress.value = targetCellAddress;

			break;
		}
		case 'colSelecting': {
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
			expandCellRange(leftTop, rightBottom);
			previousCellAddress.value = targetCellAddress;

			break;
		}
		case 'rowSelecting': {
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
			expandCellRange(leftTop, rightBottom);

			rows.value[targetCellAddress.row].ranged = true;

			const rangedRowIndexes = rangedRows.value.map(it => it.index);
			expandRowRange(Math.min(...rangedRowIndexes), Math.max(...rangedRowIndexes));

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

function onContextMenu(ev: MouseEvent) {
	const cellAddress = getCellAddress(ev.target as HTMLElement);
	if (_DEV_) {
		console.log(`[grid][context-menu] button: ${ev.button}, cell: ${cellAddress.row}x${cellAddress.col}`);
	}

	const menuItems = Array.of<MenuItem>();

	// 外でメニュー項目を挿してもらう
	if (availableCellAddress(cellAddress)) {
		emitGridEvent({ type: 'cell-context-menu', event: ev, menuItems });
	} else if (isRowNumberCellAddress(cellAddress)) {
		emitGridEvent({ type: 'row-context-menu', event: ev, menuItems });
	} else if (isColumnHeaderCellAddress(cellAddress)) {
		emitGridEvent({ type: 'column-context-menu', event: ev, menuItems });
	}

	if (menuItems.length > 0) {
		os.contextMenu(menuItems, ev);
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
	emitCellValue(sender, newValue);
}

function onChangeCellContentSize(sender: GridCell, contentSize: Size) {
	cells.value[sender.address.row][sender.address.col].contentSize = contentSize;
	if (sender.column.setting.width === 'auto') {
		calcLargestCellWidth(sender.column);
	}
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
			if (sender.setting.width === 'auto') {
				calcLargestCellWidth(sender);
			}
			break;
		}
	}
}

function onHeaderCellWidthLargest(sender: GridColumn) {
	switch (state.value) {
		case 'normal': {
			calcLargestCellWidth(sender);
			break;
		}
	}
}

function calcLargestCellWidth(column: GridColumn) {
	const _cells = cells.value;
	const largestColumnWidth = columns.value[column.index].contentSize.width;

	const largestCellWidth = (_cells.length > 0)
		? _cells
			.map(row => row[column.index])
			.reduce(
				(acc, value) => Math.max(acc, value.contentSize.width),
				0,
			)
		: 0;

	if (_DEV_) {
		console.log(`[grid][calc-largest] idx:${column.setting.bindTo}, col:${largestColumnWidth}, cell:${largestCellWidth}`);
	}

	column.width = `${Math.max(largestColumnWidth, largestCellWidth)}px`;
}

function emitGridEvent(ev: GridEvent) {
	const currentState: GridCurrentState = {
		selectedCell: selectedCell.value,
		rangedCells: rangedCells.value,
		rangedRows: rangedRows.value,
		randedBounds: rangedBounds.value,
		availableBounds: availableBounds.value,
		state: state.value,
		rows: rows.value,
		columns: columns.value,
	};

	emit(
		'event',
		ev,
		// 直接書き換えられると状態が狂う可能性があるのでコピーを渡す
		JSON.parse(JSON.stringify(currentState)),
	);
}

function emitCellValue(sender: GridCell | CellAddress, newValue: CellValue) {
	const cellAddress = 'address' in sender ? sender.address : sender;
	const cell = cells.value[cellAddress.row][cellAddress.col];

	const violation = cellValidation(cell, newValue);
	emitGridEvent({ type: 'cell-validation', violation });

	cell.validation = {
		valid: violation.valid,
		violations: violation.violations.filter(it => !it.valid),
	};

	emitGridEvent({
		type: 'cell-value-change',
		column: cell.column,
		row: cell.row,
		oldValue: cell.value,
		newValue: newValue,
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

	const _rows = rows.value;
	for (const row of _rows) {
		row.ranged = false;
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

	const outOfRangeRows = rows.value.filter((_, index) => index < leftTop.row || index > rightBottom.row);
	for (const row of outOfRangeRows) {
		row.ranged = false;
	}
}

function expandCellRange(leftTop: CellAddress, rightBottom: CellAddress) {
	const targetRows = cells.value.slice(leftTop.row, rightBottom.row + 1);
	for (const row of targetRows) {
		for (const cell of row.slice(leftTop.col, rightBottom.col + 1)) {
			cell.ranged = true;
		}
	}
}

function expandRowRange(top: number, bottom: number) {
	const targetRows = rows.value.slice(top, bottom + 1);
	for (const row of targetRows) {
		row.ranged = true;
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
	if (_DEV_) {
		console.log('[grid][refresh-data]');
	}

	const _data: DataSource[] = data.value;
	const _rows: GridRow[] = _data.map((_, index) => ({
		index,
		ranged: false,
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
				validation: {
					valid: true,
					violations: [],
				},
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

onMounted(() => {
	if (rootEl.value) {
		resizeObserver.observe(rootEl.value);

		// 初期表示時にコンテンツが表示されていない場合はhidden状態にしておく。
		// コンテンツ表示時にresizeイベントが発生するが、そのときにhidden状態にしておかないとサイズの再計算が走らないので
		const bounds = rootEl.value.getBoundingClientRect();
		if (bounds.width === 0 || bounds.height === 0) {
			state.value = 'hidden';
		}
	}
});
</script>

<style module lang="scss">
$borderSetting: solid 0.5px var(--divider);
$borderRadius: var(--radius);

.grid {
	overflow: scroll;
	table-layout: fixed;
	user-select: none;
}

.border {
	border-spacing: 0;

	thead {
		tr {
			th {
				border-left: $borderSetting;
				border-top: $borderSetting;

				&:first-child {
					// 左上セル
					border-top-left-radius: $borderRadius;
				}

				&:last-child {
					// 右上セル
					border-top-right-radius: $borderRadius;
					border-right: $borderSetting;
				}
			}
		}
	}

	tbody {
		tr {
			td, th {
				border-left: $borderSetting;
				border-top: $borderSetting;

				&:last-child {
					// 一番右端の列
					border-right: $borderSetting;
				}
			}

			&:last-child {
				td, th {
					// 一番下の行
					border-bottom: $borderSetting;

					&:first-child {
						// 左下セル
						border-bottom-left-radius: $borderRadius;
					}

					&:last-child {
						// 右下セル
						border-bottom-right-radius: $borderRadius;
					}
				}
			}
		}
	}
}
</style>
