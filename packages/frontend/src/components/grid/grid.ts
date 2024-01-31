import { EventEmitter } from 'eventemitter3';
import { CellValidator } from '@/components/grid/cell-validators.js';
import { CellValue, GridCell } from '@/components/grid/cell.js';

export type GridSetting = {
	rowNumberVisible: boolean;
}

export type DataSource = Record<string, CellValue>;

export type GridState = 'normal' | 'cellSelecting' | 'cellEditing' | 'colResizing' | 'colSelecting' | 'rowSelecting' | 'hidden'

export type Size = {
	width: number;
	height: number;
}

export type SizeStyle = number | 'auto' | undefined;

export type ColumnType = 'text' | 'number' | 'date' | 'boolean' | 'image';

export type ColumnSetting = {
	bindTo: string;
	title?: string;
	icon?: string;
	type: ColumnType;
	width: SizeStyle;
	editable?: boolean;
	validators?: CellValidator[];
};

export type GridColumn = {
	index: number;
	setting: ColumnSetting;
	width: string;
	contentSize: Size;
}

export type GridRow = {
	index: number;
	ranged: boolean;
}

export type CellValueChangedEvent = {
	column: GridColumn;
	row: GridRow;
	value: CellValue;
}

export type GridEvent = {
	current: {
		selectedCell: GridCell;
		rangedCells: GridCell[];
		rangedRows: GridRow[];
		state: GridState;
		rows: GridRow[];
		columns: GridColumn[];
	}
}

export type GridPreKeyDownEvent = {
	type: 'pre-keydown';
	event: KeyboardEvent;
	prevent: boolean;
} & GridEvent;

export type GridKeyDownEvent = {
	type: 'keydown';
	event: KeyboardEvent;
} & GridEvent;

export class GridEventEmitter extends EventEmitter<{
	'forceRefreshContentSize': void;
}> {
}
