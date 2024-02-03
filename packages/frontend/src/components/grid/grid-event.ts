import { CellAddress, CellValue, GridCell } from '@/components/grid/cell.js';
import { GridState } from '@/components/grid/grid.js';
import { ValidateViolation } from '@/components/grid/cell-validators.js';
import { MenuItem } from '@/types/menu.js';
import { GridColumn } from '@/components/grid/column.js';
import { GridRow } from '@/components/grid/row.js';

export type GridCurrentState = {
	selectedCell?: GridCell;
	rangedCells: GridCell[];
	rangedRows: GridRow[];
	randedBounds: {
		leftTop: CellAddress;
		rightBottom: CellAddress;
	};
	availableBounds: {
		leftTop: CellAddress;
		rightBottom: CellAddress;
	};
	state: GridState;
	rows: GridRow[];
	columns: GridColumn[];
};

export type GridEvent =
	GridCellValueChangeEvent |
	GridKeyDownEvent |
	GridMouseDownEvent |
	GridCellValidationEvent |
	GridCellContextMenuEvent |
	GridRowContextMenuEvent |
	GridColumnContextMenuEvent
	;

export type GridCellValueChangeEvent = {
	type: 'cell-value-change';
	column: GridColumn;
	row: GridRow;
	violation: ValidateViolation;
	oldValue: CellValue;
	newValue: CellValue;
};

export type GridCellValidationEvent = {
	type: 'cell-validation';
	violation: ValidateViolation;
	all: ValidateViolation[];
};

export type GridKeyDownEvent = {
	type: 'keydown';
	event: KeyboardEvent;
};

export type GridMouseDownEvent = {
	type: 'mousedown';
	event: MouseEvent;
	clickedCellAddress: CellAddress;
};

export type GridCellContextMenuEvent = {
	type: 'cell-context-menu';
	event: MouseEvent;
	menuItems: MenuItem[];
};

export type GridRowContextMenuEvent = {
	type: 'row-context-menu';
	event: MouseEvent;
	menuItems: MenuItem[];
};

export type GridColumnContextMenuEvent = {
	type: 'column-context-menu';
	event: MouseEvent;
	menuItems: MenuItem[];
};
