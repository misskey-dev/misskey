export type CellValue = string | boolean | number | undefined | null

export type CellAddress = {
	row: number;
	col: number;
}

export type GridCell = {
	address: CellAddress;
	value: CellValue;
	columnSetting: ColumnSetting;
}

export type ColumnType = 'text' | 'number' | 'date' | 'boolean' | 'image';

export type ColumnSetting = {
	bindTo: string;
	title?: string;
	type: ColumnType;
	width?: number | 'auto';
	editable?: boolean;
};

export type DataSource = Record<string, CellValue>;

export type GridColumn = {
	index: number;
	setting: ColumnSetting;
	cells: GridCell[];
}

export type GridRow = {
	index: number;
	cells: GridCell[];
}
