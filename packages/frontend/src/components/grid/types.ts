import { EventEmitter } from 'eventemitter3';

export type CellValue = string | boolean | number | undefined | null

export type DataSource = Record<string, CellValue>;

export type GridState = 'normal' | 'cellSelecting' | 'cellEditing' | 'colResizing'

export type RowState = 'normal' | 'added' | 'deleted'

export type Size = {
	width: number;
	height: number;
}

export type SizeStyle = number | 'auto' | undefined;

export type CellAddress = {
	row: number;
	col: number;
}

export const CELL_ADDRESS_NONE: CellAddress = {
	row: -1,
	col: -1,
};

export type GridCell = {
	address: CellAddress;
	value: CellValue;
	column: GridColumn;
	row: GridRow;
	selected: boolean;
	ranged: boolean;
	contentSize: Size;
}

export type ColumnType = 'text' | 'number' | 'date' | 'boolean' | 'image';

export type ColumnSetting = {
	bindTo: string;
	title?: string;
	type: ColumnType;
	width: SizeStyle;
	editable?: boolean;
};

export type GridColumn = {
	index: number;
	setting: ColumnSetting;
	width: string;
	contentSize: Size;
}

export type GridRow = {
	index: number;
}

export class GridEventEmitter extends EventEmitter<{}> {
}

export function isElement(elem: any): elem is HTMLElement {
	return elem instanceof HTMLElement;
}

export function isCellElement(elem: any): elem is HTMLTableCellElement {
	return elem instanceof HTMLTableCellElement;
}

export function isRowElement(elem: any): elem is HTMLTableRowElement {
	return elem instanceof HTMLTableRowElement;
}

export function getCellAddress(elem: HTMLElement, parentNodeCount = 5): CellAddress {
	let node = elem;
	for (let i = 0; i < parentNodeCount; i++) {
		if (isCellElement(node) && isRowElement(node.parentElement)) {
			return {
				// ヘッダ行ぶんを除く
				row: node.parentElement.rowIndex - 1,
				// 数値列ぶんを除く
				col: node.cellIndex - 1,
			};
		}

		if (!node.parentElement) {
			break;
		}

		node = node.parentElement;
	}

	throw new Error('Cannot get cell address');
}

export function equalCellAddress(a: CellAddress, b: CellAddress): boolean {
	return a.row === b.row && a.col === b.col;
}

export function calcCellWidth(widthSetting: SizeStyle): string {
	switch (widthSetting) {
		case undefined:
		case 'auto': {
			return 'auto';
		}
		default: {
			return `${widthSetting}px`;
		}
	}
}
