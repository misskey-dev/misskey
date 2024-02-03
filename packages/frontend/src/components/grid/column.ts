import { CellValidator } from '@/components/grid/cell-validators.js';
import { Size, SizeStyle } from '@/components/grid/grid.js';
import { calcCellWidth } from '@/components/grid/grid-utils.js';

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

export function createColumn(setting: ColumnSetting, index: number): GridColumn {
	return {
		index,
		setting,
		width: calcCellWidth(setting.width),
		contentSize: { width: 0, height: 0 },
	};
}
