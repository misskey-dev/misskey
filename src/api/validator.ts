import * as mongo from 'mongodb';
import hasDuplicates from '../common/has-duplicates';

type Type = 'id' | 'string' | 'number' | 'boolean' | 'array' | 'set' | 'object';

type Validator<T> = ((x: T) => boolean | string) | ((x: T) => boolean | string)[];

function validate(value: any, type: 'id', isRequired?: boolean): [mongo.ObjectID, string];
function validate(value: any, type: 'string', isRequired?: boolean, validator?: Validator<string>): [string, string];
function validate(value: any, type: 'number', isRequired?: boolean, validator?: Validator<number>): [number, string];
function validate(value: any, type: 'boolean', isRequired?: boolean): [boolean, string];
function validate(value: any, type: 'array', isRequired?: boolean, validator?: Validator<any[]>): [any[], string];
function validate(value: any, type: 'set', isRequired?: boolean, validator?: Validator<Set<any>>): [Set<any>, string];
function validate(value: any, type: 'object', isRequired?: boolean, validator?: Validator<Object>): [Object, string];
function validate<T>(value: any, type: Type, isRequired?: boolean, validator?: Validator<T>): [T, string] {
	if (value === undefined || value === null) {
		if (isRequired) {
			return [null, 'is-required']
		} else {
			return [null, null]
		}
	}

	switch (type) {
		case 'id':
			if (typeof value != 'string' || !mongo.ObjectID.isValid(value)) {
				return [null, 'incorrect-id'];
			}
			break;

		case 'string':
			if (typeof value != 'string') {
				return [null, 'must-be-a-string'];
			}
			break;

		case 'number':
			if (!Number.isFinite(value)) {
				return [null, 'must-be-a-number'];
			}
			break;

		case 'boolean':
			if (typeof value != 'boolean') {
				return [null, 'must-be-an-boolean'];
			}
			break;

		case 'array':
			if (!Array.isArray(value)) {
				return [null, 'must-be-an-array'];
			}
			break;

		case 'set':
			if (!Array.isArray(value)) {
				return [null, 'must-be-an-array'];
			} else if (hasDuplicates(value)) {
				return [null, 'duplicated-contents'];
			}
			break;

		case 'object':
			if (typeof value != 'object') {
				return [null, 'must-be-an-onject'];
			}
			break;
	}

	if (type == 'id') value = new mongo.ObjectID(value);

	if (validator) {
		const validators = Array.isArray(validator) ? validator : [validator];
		for (let i = 0; i < validators.length; i++) {
			const result = validators[i](value);
			if (result === false) {
				return [null, 'invalid-format'];
			} else if (typeof result == 'string') {
				return [null, result];
			}
		}
	}

	return [value, null];
}

export default validate;
