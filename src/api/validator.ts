import * as mongo from 'mongodb';

type Type = 'id' | 'string' | 'number' | 'boolean' | 'array' | 'object';

export default <T>(value: any, isRequired: boolean, type: Type): [T, string] => {
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

		case 'object':
			if (typeof value != 'object') {
				return [null, 'must-be-an-onject'];
			}
			break;
	}

	return [value, null];
};
