import { Ref } from 'vue';
import { GridContext, GridKeyDownEvent } from '@/components/grid/grid-event.js';
import copyToClipboard from '@/scripts/copy-to-clipboard.js';
import { GridColumnSetting } from '@/components/grid/column.js';
import { CellValue } from '@/components/grid/cell.js';
import { DataSource } from '@/components/grid/grid.js';

class OptInGridUtils {
	async defaultKeyDownHandler(gridItems: Ref<DataSource[]>, event: GridKeyDownEvent, context: GridContext) {
		const { ctrlKey, shiftKey, code } = event.event;

		switch (true) {
			case ctrlKey && shiftKey: {
				break;
			}
			case ctrlKey: {
				switch (code) {
					case 'KeyC': {
						this.copyToClipboard(gridItems, context);
						break;
					}
					case 'KeyV': {
						await this.pasteFromClipboard(gridItems, context);
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
						this.deleteSelectionRange(gridItems, context);
						break;
					}
				}
				break;
			}
		}
	}

	copyToClipboard(gridItems: Ref<DataSource[]> | DataSource[], context: GridContext) {
		const items = typeof gridItems === 'object' ? (gridItems as Ref<DataSource[]>).value : gridItems;
		const lines = Array.of<string>();
		const bounds = context.randedBounds;

		for (let row = bounds.leftTop.row; row <= bounds.rightBottom.row; row++) {
			const rowItems = Array.of<string>();
			for (let col = bounds.leftTop.col; col <= bounds.rightBottom.col; col++) {
				const bindTo = context.columns[col].setting.bindTo;
				const cell = items[row][bindTo];
				const value = typeof cell === 'object' || Array.isArray(cell)
					? JSON.stringify(cell)
					: cell?.toString() ?? '';
				rowItems.push(value);
			}
			lines.push(rowItems.join('\t'));
		}

		const text = lines.join('\n');
		copyToClipboard(text);

		if (_DEV_) {
			console.log(`Copied to clipboard: ${text}`);
		}
	}

	async pasteFromClipboard(
		gridItems: Ref<DataSource[]>,
		context: GridContext,
		valueConverters?: { bindTo: string, converter: (value: string) => CellValue }[],
	) {
		const converterMap = new Map<string, (value: string) => CellValue>(valueConverters?.map(it => [it.bindTo, it.converter]) ?? []);

		function parseValue(value: string, setting: GridColumnSetting): CellValue {
			switch (setting.type) {
				case 'number': {
					return Number(value);
				}
				case 'boolean': {
					return value === 'true';
				}
				default: {
					return converterMap.has(setting.bindTo)
						? converterMap.get(setting.bindTo)!(value)
						: value;
				}
			}
		}

		const clipBoardText = await navigator.clipboard.readText();
		if (_DEV_) {
			console.log(`Paste from clipboard: ${clipBoardText}`);
		}

		const bounds = context.randedBounds;
		const lines = clipBoardText.replace(/\r/g, '')
			.split('\n')
			.map(it => it.split('\t'));

		if (lines.length === 1 && lines[0].length === 1) {
			// 単独文字列の場合は選択範囲全体に同じテキストを貼り付ける
			const ranges = context.rangedCells;
			for (const cell of ranges) {
				gridItems.value[cell.row.index][cell.column.setting.bindTo] = parseValue(lines[0][0], cell.column.setting);
			}
		} else {
			// 表形式文字列の場合は表形式にパースし、選択範囲に合うように貼り付ける
			const offsetRow = bounds.leftTop.row;
			const offsetCol = bounds.leftTop.col;
			const columns = context.columns;
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

					gridItems.value[row][columns[col].setting.bindTo] = parseValue(items[colIdx], columns[col].setting);
				}
			}
		}
	}

	deleteSelectionRange(gridItems: Ref<Record<string, any>[]>, context: GridContext) {
		if (context.rangedRows.length > 0) {
			const deletedIndexes = context.rangedRows.map(it => it.index);
			gridItems.value = gridItems.value.filter((_, index) => !deletedIndexes.includes(index));
		} else {
			const ranges = context.rangedCells;
			for (const cell of ranges) {
				if (cell.column.setting.editable) {
					gridItems.value[cell.row.index][cell.column.setting.bindTo] = undefined;
				}
			}
		}
	}
}

export const optInGridUtils = new OptInGridUtils();
