import { AdditionalStyle } from '@/components/grid/grid.js';

export const defaultGridSetting: Required<GridRowSetting> = {
	showNumber: true,
	selectable: true,
	minimumDefinitionCount: 100,
};

export type GridRowSetting = {
	showNumber?: boolean;
	selectable?: boolean;
	minimumDefinitionCount?: number;
}

export type GridRow = {
	index: number;
	ranged: boolean;
	using: boolean;
	additionalStyle?: AdditionalStyle;
}

export function createRow(index: number, using: boolean): GridRow {
	return {
		index,
		ranged: false,
		using: using,
	};
}

export function resetRow(row: GridRow): void {
	row.ranged = false;
	row.using = false;
	row.additionalStyle = undefined;
}

