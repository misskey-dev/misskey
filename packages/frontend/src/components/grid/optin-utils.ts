import { Ref } from 'vue';
import { GridCurrentState, GridKeyDownEvent } from '@/components/grid/grid-event.js';
import copyToClipboard from '@/scripts/copy-to-clipboard.js';
import { GridColumnSetting } from '@/components/grid/column.js';
import { CellValue } from '@/components/grid/cell.js';
import { DataSource } from '@/components/grid/grid.js';

class OptInGridUtils {
	async defaultKeyDownHandler(gridItems: Ref<DataSource[]>, event: GridKeyDownEvent, currentState: GridCurrentState) {
		const { ctrlKey, shiftKey, code } = event.event;

		switch (true) {
			case ctrlKey && shiftKey: {
				break;
			}
			case ctrlKey: {
				switch (code) {
					case 'KeyC': {
						this.copyToClipboard(gridItems, currentState);
						break;
					}
					case 'KeyV': {
						await this.pasteFromClipboard(gridItems, currentState);
						break;
					}
				}
				break;
			}
			case shiftKey: {
				break;
			}
			default: {
				switch (code) {
					case 'Delete': {
						this.deleteSelectionRange(gridItems, currentState);
						break;
					}
				}
				break;
			}
		}
	}

	copyToClipboard(gridItems: Ref<DataSource[]>, currentState: GridCurrentState) {
		const lines = Array.of<string>();
		const bounds = currentState.randedBounds;

		for (let row = bounds.leftTop.row; row <= bounds.rightBottom.row; row++) {
			const items = Array.of<string>();
			for (let col = bounds.leftTop.col; col <= bounds.rightBottom.col; col++) {
				const bindTo = currentState.columns[col].setting.bindTo;
				const cell = gridItems.value[row][bindTo];
				items.push(cell?.toString() ?? '');
			}
			lines.push(items.join('\t'));
		}

		const text = lines.join('\n');
		copyToClipboard(text);

		if (_DEV_) {
			console.log(`Copied to clipboard: ${text}`);
		}
	}

	async pasteFromClipboard(
		gridItems: Ref<DataSource[]>,
		currentState: GridCurrentState,
	) {
		function parseValue(value: string, type: GridColumnSetting['type']): CellValue {
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
		if (_DEV_) {
			console.log(`Paste from clipboard: ${clipBoardText}`);
		}

		const bounds = currentState.randedBounds;
		const lines = clipBoardText.replace(/\r/g, '')
			.split('\n')
			.map(it => it.split('\t'));

		if (lines.length === 1 && lines[0].length === 1) {
			// 単独文字列の場合は選択範囲全体に同じテキストを貼り付ける
			const ranges = currentState.rangedCells;
			for (const cell of ranges) {
				gridItems.value[cell.row.index][cell.column.setting.bindTo] = parseValue(lines[0][0], cell.column.setting.type);
			}
		} else {
			// 表形式文字列の場合は表形式にパースし、選択範囲に合うように貼り付ける
			const offsetRow = bounds.leftTop.row;
			const offsetCol = bounds.leftTop.col;
			const columns = currentState.columns;
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

					gridItems.value[row][columns[col].setting.bindTo] = parseValue(items[colIdx], columns[col].setting.type);
				}
			}
		}
	}

	deleteSelectionRange(gridItems: Ref<DataSource[]>, currentState: GridCurrentState) {
		if (currentState.rangedRows.length > 0) {
			const deletedIndexes = currentState.rangedRows.map(it => it.index);
			gridItems.value = gridItems.value.filter((_, index) => !deletedIndexes.includes(index));
		} else {
			const ranges = currentState.rangedCells;
			for (const cell of ranges) {
				if (cell.column.setting.editable) {
					gridItems.value[cell.row.index][cell.column.setting.bindTo] = undefined;
				}
			}
		}
	}
}

export const optInGridUtils = new OptInGridUtils();
