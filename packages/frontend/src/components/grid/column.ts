import { CellValidator } from '@/components/grid/cell-validators.js';
import { AdditionalStyle, EventOptions, Size, SizeStyle } from '@/components/grid/grid.js';
import { calcCellWidth } from '@/components/grid/grid-utils.js';
import { CellValue, GridCell, GridCellSetting } from '@/components/grid/cell.js';
import { GridRow } from '@/components/grid/row.js';

export type ColumnType = 'text' | 'number' | 'date' | 'boolean' | 'image';

export type GridColumnSetting = {
	bindTo: string;
	title?: string;
	icon?: string;
	type: ColumnType;
	width: SizeStyle;
	editable?: boolean;
	validators?: CellValidator[];
	valueConverter?: GridColumnValueConverter;
	cellSetting?: GridCellSetting;
};

export type GridColumn = {
	index: number;
	setting: GridColumnSetting;
	width: string;
	contentSize: Size;
}

export type GridColumnValueConverter = (row: GridRow, col: GridColumn, value: CellValue) => CellValue;

export type GridColumnEventArgs = {
	col: GridColumn;
	cells: GridCell[];
} & EventOptions;

export function createColumn(setting: GridColumnSetting, index: number): GridColumn {
	return {
		index,
		setting,
		width: calcCellWidth(setting.width),
		contentSize: { width: 0, height: 0 },
	};
}

