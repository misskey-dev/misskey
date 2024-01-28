import { GridColumn, GridRow } from '@/components/grid/grid.js';
import { CellValue, GridCell } from '@/components/grid/cell.js';

export type ValidatorParams = {
	column: GridColumn;
	row: GridRow;
	value: CellValue;
};

export type ValidatorResult = {
	valid: boolean;
	message?: string;
}

export type CellValidator = {
	name?: string;
	validate: (params: ValidatorParams) => ValidatorResult;
}

export type ValidateViolation = {
	valid: boolean;
	params: ValidatorParams;
	violations: ValidateViolationItem[];
}

export type ValidateViolationItem = {
	valid: boolean;
	validator: CellValidator;
	result: ValidatorResult;
}

export function cellValidation(cell: GridCell, newValue: CellValue): ValidateViolation {
	const { column, row } = cell;
	const validators = column.setting.validators ?? [];

	const params: ValidatorParams = {
		column,
		row,
		value: newValue,
	};

	const violations: ValidateViolationItem[] = validators.map(validator => {
		const result = validator.validate(params);
		return {
			valid: result.valid,
			validator,
			result,
		};
	});

	return {
		valid: violations.every(v => v.result.valid),
		params,
		violations,
	};
}

export const required: CellValidator = {
	name: 'required',
	validate: (params: ValidatorParams): ValidatorResult => {
		const { value } = params;
		return {
			valid: value !== null && value !== undefined && value !== '',
			message: 'This field is required.',
		};
	},
};

