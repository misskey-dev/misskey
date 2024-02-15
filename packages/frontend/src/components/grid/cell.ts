import { ValidateViolation } from '@/components/grid/cell-validators.js';
import { Size } from '@/components/grid/grid.js';
import { GridColumn } from '@/components/grid/column.js';
import { GridRow } from '@/components/grid/row.js';
import { MenuItem } from '@/types/menu.js';
import { GridContext } from '@/components/grid/grid-event.js';

export type CellValue = string | boolean | number | undefined | null

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
	setting: GridCellSetting;
	violation: ValidateViolation;
}

export type GridCellContextMenuFactory = (col: GridColumn, row: GridRow, value: CellValue, context: GridContext) => MenuItem[];

export type GridCellSetting = {
	contextMenuFactory?: GridCellContextMenuFactory;
}

export function createCell(
	column: GridColumn,
	row: GridRow,
	value: CellValue,
	setting: GridCellSetting,
): GridCell {
	return {
		address: { row: row.index, col: column.index },
		value,
		column,
		row,
		selected: false,
		ranged: false,
		contentSize: { width: 0, height: 0 },
		violation: {
			valid: true,
			params: {
				column,
				row,
				value,
			},
			violations: [],
		},
		setting,
	};
}

export function resetCell(cell: GridCell): void {
	cell.selected = false;
	cell.ranged = false;
	cell.violation = {
		valid: true,
		params: {
			column: cell.column,
			row: cell.row,
			value: cell.value,
		},
		violations: [],
	};
}
