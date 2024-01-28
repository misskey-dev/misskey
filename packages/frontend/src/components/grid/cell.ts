import { ValidateViolationItem } from '@/components/grid/cell-validators.js';
import { GridColumn, GridRow, Size } from '@/components/grid/grid.js';

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
	validation: {
		valid: boolean;
		violations: ValidateViolationItem[];
	}
}

