import { AdditionalStyle } from '@/components/grid/grid.js';
import { GridCell } from '@/components/grid/cell.js';
import { GridColumn } from '@/components/grid/column.js';

export const defaultGridRowSetting: Required<GridRowSetting> = {
	showNumber: true,
	selectable: true,
	minimumDefinitionCount: 100,
	styleRules: [],
};

export type GridRowStyleRuleConditionParams = {
	row: GridRow,
	targetCols: GridColumn[],
	cells: GridCell[]
};

export type GridRowStyleRule = {
	condition: (params: GridRowStyleRuleConditionParams) => boolean;
	applyStyle: AdditionalStyle;
}

export type GridRowSetting = {
	showNumber?: boolean;
	selectable?: boolean;
	minimumDefinitionCount?: number;
	styleRules?: GridRowStyleRule[];
}

export type GridRow = {
	index: number;
	ranged: boolean;
	using: boolean;
	additionalStyles: AdditionalStyle[];
}

export function createRow(index: number, using: boolean): GridRow {
	return {
		index,
		ranged: false,
		using: using,
		additionalStyles: [],
	};
}

export function resetRow(row: GridRow): void {
	row.ranged = false;
	row.using = false;
	row.additionalStyles = [];
}

