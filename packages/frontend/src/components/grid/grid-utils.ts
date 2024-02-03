import { GridSetting, SizeStyle } from '@/components/grid/grid.js';
import { CELL_ADDRESS_NONE, CellAddress } from '@/components/grid/cell.js';

export function isCellElement(elem: any): elem is HTMLTableCellElement {
	return elem instanceof HTMLTableCellElement;
}

export function isRowElement(elem: any): elem is HTMLTableRowElement {
	return elem instanceof HTMLTableRowElement;
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

export function getCellAddress(elem: HTMLElement, gridSetting: GridSetting, parentNodeCount = 10): CellAddress {
	let node = elem;
	for (let i = 0; i < parentNodeCount; i++) {
		if (isCellElement(node) && isRowElement(node.parentElement)) {
			return {
				// ヘッダ行ぶんを除く
				row: node.parentElement.rowIndex - 1,
				// 数値列ぶんを除く
				col: gridSetting.rowNumberVisible ? node.cellIndex - 1 : node.cellIndex,
			};
		}

		if (!node.parentElement) {
			break;
		}

		node = node.parentElement;
	}

	return CELL_ADDRESS_NONE;
}

export function equalCellAddress(a: CellAddress, b: CellAddress): boolean {
	return a.row === b.row && a.col === b.col;
}

