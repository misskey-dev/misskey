import { EventEmitter } from 'eventemitter3';
import { CellValidator } from '@/components/grid/cell-validators.js';
import { CellValue } from '@/components/grid/cell.js';

export type DataSource = Record<string, CellValue>;

export type GridState = 'normal' | 'cellSelecting' | 'cellEditing' | 'colResizing' | 'colSelecting' | 'rowSelecting'

export type Size = {
	width: number;
	height: number;
}

export type SizeStyle = number | 'auto' | undefined;

export type ColumnType = 'text' | 'number' | 'date' | 'boolean' | 'image';

export type ColumnSetting = {
	bindTo: string;
	title?: string;
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
	selected: boolean;
}

export type CellValueChangedEvent = {
	column: GridColumn;
	row: GridRow;
	value: CellValue;
}

export class GridEventEmitter extends EventEmitter<{}> {
}
