import { CellValue, GridCell } from '@/components/grid/cell.js';
import { GridColumn } from '@/components/grid/column.js';
import { GridRow } from '@/components/grid/row.js';

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
	ignoreViolation?: boolean;
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

class ValidatorPreset {
	required(): CellValidator {
		return {
			name: 'required',
			validate: (params: ValidatorParams): ValidatorResult => {
				const { value } = params;
				return {
					valid: value !== null && value !== undefined && value !== '',
					message: 'This field is required.',
				};
			},
		};
	}

	regex(pattern: RegExp): CellValidator {
		return {
			name: 'regex',
			validate: (params: ValidatorParams): ValidatorResult => {
				const { value, column } = params;
				if (column.setting.type !== 'text') {
					return {
						valid: false,
						message: 'Regex validation is only available for text type.',
					};
				}

				return {
					valid: pattern.test(value?.toString() ?? ''),
					message: 'Not an allowed format. Please check the input. (Allowed format: ' + pattern.source + ')',
				};
			},
		};
	}
}

export const validators = new ValidatorPreset();
