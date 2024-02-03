<template>
<table
	ref="rootEl"
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
			:cells="cells[row.index].cells"
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
import { DataSource, GridEventEmitter, GridSetting, GridState, Size } from '@/components/grid/grid.js';
import MkDataRow from '@/components/grid/MkDataRow.vue';
import MkHeaderRow from '@/components/grid/MkHeaderRow.vue';
import { cellValidation } from '@/components/grid/cell-validators.js';
import { CELL_ADDRESS_NONE, CellAddress, CellValue, createCell, GridCell } from '@/components/grid/cell.js';
import { equalCellAddress, getCellAddress, getCellElement } from '@/components/grid/grid-utils.js';
import { MenuItem } from '@/types/menu.js';
import * as os from '@/os.js';
import { GridCurrentState, GridEvent } from '@/components/grid/grid-event.js';
import { ColumnSetting, createColumn, GridColumn } from '@/components/grid/column.js';
import { createRow, GridRow } from '@/components/grid/row.js';

type RowHolder = {
	cells: GridCell[],
	origin: DataSource,
}

const props = withDefaults(defineProps<{
	gridSetting?: GridSetting,
	columnSettings: ColumnSetting[],
	data: DataSource[]
}>(), {
	gridSetting: () => ({
		rowNumberVisible: true,
	}),
});
const { gridSetting, columnSettings, data } = toRefs(props);

const emit = defineEmits<{
	(ev: 'event', event: GridEvent, current: GridCurrentState): void;
}>();

// #region Event Definitions
// region Event Definitions

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

const rootEl = ref<InstanceType<typeof HTMLTableElement>>();
/**
 * グリッドの最も上位にある状態。
 */
const state = ref<GridState>('normal');
/**
 * グリッドの列定義。propsで受け取った{@link columnSettings}をもとに、{@link refreshColumnsSetting}で再計算される。
 */
const columns = ref<GridColumn[]>([]);
/**
 * グリッドの行定義。propsで受け取った{@link data}をもとに、{@link refreshData}で再計算される。
 */
const rows = ref<GridRow[]>([]);
/**
 * グリッドのセル定義。propsで受け取った{@link data}をもとに、{@link refreshData}で再計算される。
 */
const cells = ref<RowHolder[]>([]);

/**
 * mousemoveイベントが発生した際に、イベントから取得したセルアドレスを保持するための変数。
 * セルアドレスが変わった瞬間にイベントを起こしたい時のために前回値として使用する。
 */
const previousCellAddress = ref<CellAddress>(CELL_ADDRESS_NONE);
/**
 * 編集中のセルのアドレスを保持するための変数。
 */
const editingCellAddress = ref<CellAddress>(CELL_ADDRESS_NONE);
/**
 * 列の範囲選択をする際の開始地点となるインデックスを保持するための変数。
 * この開始地点からマウスが動いた地点までの範囲を選択する。
 */
const firstSelectionColumnIdx = ref<number>(CELL_ADDRESS_NONE.col);
/**
 * 行の範囲選択をする際の開始地点となるインデックスを保持するための変数。
 * この開始地点からマウスが動いた地点までの範囲を選択する。
 */
const firstSelectionRowIdx = ref<number>(CELL_ADDRESS_NONE.row);

/**
 * 選択状態のセルを取得するための計算プロパティ。選択状態とは{@link GridCell.selected}がtrueのセルのこと。
 */
const selectedCell = computed(() => {
	const selected = cells.value.flatMap(it => it.cells).filter(it => it.selected);
	return selected.length > 0 ? selected[0] : undefined;
});
/**
 * 範囲選択状態のセルを取得するための計算プロパティ。範囲選択状態とは{@link GridCell.ranged}がtrueのセルのこと。
 */
const rangedCells = computed(() => cells.value.flatMap(it => it.cells).filter(it => it.ranged));
/**
 * 範囲選択状態のセルの範囲を取得するための計算プロパティ。左上のセル番地と右下のセル番地を計算する。
 */
const rangedBounds = computed(() => {
	const _cells = rangedCells.value;
	const _cols = _cells.map(it => it.address.col);
	const _rows = _cells.map(it => it.address.row);

	const leftTop = {
		col: Math.min(..._cols),
		row: Math.min(..._rows),
	};
	const rightBottom = {
		col: Math.max(..._cols),
		row: Math.max(..._rows),
	};

	return {
		leftTop,
		rightBottom,
	};
});
/**
 * グリッドの中で使用可能なセルの範囲を取得するための計算プロパティ。左上のセル番地と右下のセル番地を計算する。
 */
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
/**
 * 範囲選択状態の行を取得するための計算プロパティ。範囲選択状態とは{@link GridRow.ranged}がtrueの行のこと。
 */
const rangedRows = computed(() => rows.value.filter(it => it.ranged));

// endregion
// #endregion

watch(columnSettings, refreshColumnsSetting);
watch(data, patchData, { deep: true });

if (_DEV_) {
	watch(state, (value, oldValue) => {
		console.log(`[grid][state] ${oldValue} -> ${value}`);
	});
}

// #region Event Handlers
// region Event Handlers

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
				unSelectionRangeAll();

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
	function emitKeyEvent() {
		emitGridEvent({ type: 'keydown', event: ev });
	}

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
							// その他のキーは外部にゆだねる
							emitKeyEvent();
							return;
						}
					}

					unSelectionOutOfRange(newBounds.leftTop, newBounds.rightBottom);
					expandCellRange(newBounds.leftTop, newBounds.rightBottom);
				} else {
					// その他のキーは外部にゆだねる
					emitKeyEvent();
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
							// その他のキーは外部にゆだねる
							emitKeyEvent();
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
							emitKeyEvent();
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
	const cellAddress = getCellAddress(ev.target as HTMLElement, gridSetting.value);
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
				unSelectionRangeAll();

				const colCells = cells.value.map(row => row.cells[cellAddress.col]);
				selectionRange(...colCells.map(cell => cell.address));

				registerMouseUp();
				registerMouseMove();
				firstSelectionColumnIdx.value = cellAddress.col;
				state.value = 'colSelecting';

				// フォーカスを当てないとキーイベントが拾えないので
				getCellElement(ev.target as HTMLElement)?.focus();
			} else if (isRowNumberCellAddress(cellAddress)) {
				unSelectionRangeAll();

				const rowCells = cells.value[cellAddress.row].cells;
				selectionRange(...rowCells.map(cell => cell.address));

				expandRowRange(cellAddress.row, cellAddress.row);

				registerMouseUp();
				registerMouseMove();
				firstSelectionRowIdx.value = cellAddress.row;
				state.value = 'rowSelecting';

				// フォーカスを当てないとキーイベントが拾えないので
				getCellElement(ev.target as HTMLElement)?.focus();
			}
			break;
		}
	}
}

function onRightMouseDown(ev: MouseEvent) {
	const cellAddress = getCellAddress(ev.target as HTMLElement, gridSetting.value);
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

	const targetCellAddress = getCellAddress(ev.target as HTMLElement, gridSetting.value);
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

			// フォーカスを当てないとキーイベントが拾えないので
			getCellElement(ev.target as HTMLElement)?.focus();

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
				col: Math.min(...cells.value.map(it => it.cells.length - 1)),
				row: Math.max(targetCellAddress.row, firstSelectionRowIdx.value),
			};

			unSelectionOutOfRange(leftTop, rightBottom);
			expandCellRange(leftTop, rightBottom);

			rows.value[targetCellAddress.row].ranged = true;

			const rangedRowIndexes = rangedRows.value.map(it => it.index);
			expandRowRange(Math.min(...rangedRowIndexes), Math.max(...rangedRowIndexes));

			previousCellAddress.value = targetCellAddress;

			// フォーカスを当てないとキーイベントが拾えないので
			getCellElement(ev.target as HTMLElement)?.focus();

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
	const cellAddress = getCellAddress(ev.target as HTMLElement, gridSetting.value);
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
	for (const cell of cells.value.flatMap(it => it.cells)) {
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
	cells.value[sender.address.row].cells[sender.address.col].contentSize = contentSize;
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

// endregion
// #endregion

// #region Methods
// region Methods

/**
 * カラム内のコンテンツを表示しきるために必要な横幅と、各セルのコンテンツを表示しきるために必要な横幅を比較し、大きい方を列全体の横幅として採用する。
 */
function calcLargestCellWidth(column: GridColumn) {
	const _cells = cells.value;
	const largestColumnWidth = columns.value[column.index].contentSize.width;

	const largestCellWidth = (_cells.length > 0)
		? _cells
			.map(row => row.cells[column.index])
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

/**
 * {@link emit}を使用してイベントを発行する。
 */
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

/**
 * 親コンポーネントに新しい値を通知する。セル値のバリデーション結果は問わない（親コンポーネント側で制御する）
 */
function emitCellValue(sender: GridCell | CellAddress, newValue: CellValue) {
	const cellAddress = 'address' in sender ? sender.address : sender;
	const cell = cells.value[cellAddress.row].cells[cellAddress.col];

	const violation = cellValidation(cell, newValue);
	cell.violation = violation;
	emitGridEvent({
		type: 'cell-validation',
		violation: violation,
		all: cells.value.flatMap(it => it.cells).map(it => it.violation),
	});

	cell.value = newValue;
	emitGridEvent({
		type: 'cell-value-change',
		column: cell.column,
		row: cell.row,
		violation: violation,
		oldValue: cell.value,
		newValue: newValue,
	});

	if (_DEV_) {
		console.log(`[grid][cell-value] row:${cell.row}, col:${cell.column.index}, value:${newValue}`);
	}
}

/**
 * {@link selectedCell}のセル番地を取得する。
 * いずれかのセルが選択されている状態で呼ばれることを想定しているため、選択されていない場合は例外を投げる。
 */
function requireSelectionCell(): CellAddress {
	const selected = selectedCell.value;
	if (!selected) {
		throw new Error('No selected cell');
	}

	return selected.address;
}

/**
 * {@link target}のセルを選択状態にする。
 * その際、{@link target}以外の行およびセルの範囲選択状態を解除する。
 */
function selectionCell(target: CellAddress) {
	if (!availableCellAddress(target)) {
		return;
	}

	unSelectionRangeAll();

	const _cells = cells.value;
	_cells[target.row].cells[target.col].selected = true;
	_cells[target.row].cells[target.col].ranged = true;
}

/**
 * {@link targets}のセルを範囲選択状態にする。
 */
function selectionRange(...targets: CellAddress[]) {
	const _cells = cells.value;
	for (const target of targets) {
		_cells[target.row].cells[target.col].ranged = true;
	}
}

/**
 * 行およびセルの範囲選択状態をすべて解除する。
 */
function unSelectionRangeAll() {
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

/**
 * {@link leftTop}から{@link rightBottom}の範囲外にあるセルを範囲選択状態から外す。
 */
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

/**
 * {@link leftTop}から{@link rightBottom}の範囲内にあるセルを範囲選択状態にする。
 */
function expandCellRange(leftTop: CellAddress, rightBottom: CellAddress) {
	const targetRows = cells.value.slice(leftTop.row, rightBottom.row + 1);
	for (const row of targetRows) {
		for (const cell of row.cells.slice(leftTop.col, rightBottom.col + 1)) {
			cell.ranged = true;
		}
	}
}

/**
 * {@link top}から{@link bottom}までの行を範囲選択状態にする。
 */
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

function refreshColumnsSetting() {
	const bindToList = columnSettings.value.map(it => it.bindTo);
	if (new Set(bindToList).size !== columnSettings.value.length) {
		// 取得元のプロパティ名重複は許容したくない
		throw new Error(`Duplicate bindTo setting : [${bindToList.join(',')}]}]`);
	}

	refreshData();
}

function refreshData() {
	if (_DEV_) {
		console.log('[grid][refresh-data]');
	}

	const _data: DataSource[] = data.value;
	const _rows: GridRow[] = _data.map((it, index) => createRow(index));
	const _cols: GridColumn[] = columnSettings.value.map(createColumn);

	// 行・列の定義から、元データの配列より値を取得してセルを作成する。
	// 行・列の定義はそれぞれインデックスを持っており、そのインデックスは元データの配列番地に対応している。
	const _cells: RowHolder[] = _rows.map((row, rowIndex) => (
		{
			cells: _cols.map(col => {
				const cell = createCell(
					col,
					row,
					(col.setting.bindTo in _data[rowIndex]) ? _data[rowIndex][col.setting.bindTo] : undefined,
				);

				// 元の値の時点で不正な場合もあり得るので、バリデーションを実行してすぐに警告できるようにしておく
				cell.violation = cellValidation(cell, cell.value);

				return cell;
			}),
			origin: _data[rowIndex],
		}
	));

	rows.value = _rows;
	columns.value = _cols;
	cells.value = _cells;
}

/**
 * セル値を部分更新する。この関数は、外部起因でデータが変更された場合に呼ばれる。
 *
 * 外部起因でデータが変更された場合は{@link data}の値が変更されるが、何処の番地がどのように変わったのかまでは検知できない。
 * セルをすべて作り直せばいいが、その手法だと以下のデメリットがある。
 * - 描画負荷がかかる
 * - 各セルが持つ個別の状態（選択中状態やバリデーション結果など）が失われる
 *
 * そこで、新しい値とセルが持つ値を突き合わせ、変更があった場合のみ値を更新し、セルそのものは使いまわしつつ値を最新化する。
 */
function patchData(newItems: DataSource[]) {
	const gridRows = cells.value;
	if (gridRows.length > newItems.length) {
		// 状態が壊れるかもしれないので選択を全解除
		unSelectionRangeAll();

		// 行数が減った場合
		const diff = gridRows
			.map((it, idx) => ({ origin: it.origin, idx }))
			.filter(it => !newItems.includes(it.origin));
		for (const { idx } of diff) {
			rows.value.splice(idx, 1);
			gridRows.splice(idx, 1);
		}

		// 行数が減ったので再度採番
		for (let rowIdx = 0; rowIdx < rows.value.length; rowIdx++) {
			rows.value[rowIdx].index = rowIdx;
			for (const cell of gridRows[rowIdx].cells) {
				cell.address.row = rowIdx;
			}
		}
	} else if (gridRows.length < newItems.length) {
		// 状態が壊れるかもしれないので選択を全解除
		unSelectionRangeAll();

		// 行数が増えた場合
		const oldOrigins = gridRows.map(it => it.origin);
		const diff = newItems
			.map((it, idx) => ({ origin: it, idx }))
			.filter(it => oldOrigins.indexOf(it.origin) === -1);

		const _cols = columns.value;
		for (const { origin, idx } of diff) {
			const newRow = createRow(idx);
			const newCells = _cols.map(col => createCell(col, newRow, origin[col.setting.bindTo]));

			rows.value.splice(idx, 0, newRow);
			gridRows.splice(idx, 0, { cells: newCells, origin });
		}

		// 行数が増えたので再度採番
		for (let rowIdx = 0; rowIdx < rows.value.length; rowIdx++) {
			rows.value[rowIdx].index = rowIdx;
			for (const cell of gridRows[rowIdx].cells) {
				cell.address.row = rowIdx;
			}
		}
	} else {
		// 行数が変わらない場合
		const _cols = columns.value;
		for (let rowIdx = 0; rowIdx < gridRows.length; rowIdx++) {
			const oldCells = gridRows[rowIdx].cells;
			const newItem = newItems[rowIdx];
			for (let colIdx = 0; colIdx < oldCells.length; colIdx++) {
				const _col = _cols[colIdx];

				const oldCell = oldCells[colIdx];
				const newValue = newItem[_col.setting.bindTo];
				if (oldCell.value !== newValue) {
					emitCellValue(oldCell, newValue);
				}
			}
		}
	}
}

// endregion
// #endregion

onMounted(() => {
	refreshColumnsSetting();

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
