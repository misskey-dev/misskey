import { types, bool } from '../../../../misc/schema';

export const schema = {
	type: types.object,
	optional: bool.false, nullable: bool.false,
	properties: {
		foo: {
			type: types.number,
			optional: bool.false, nullable: bool.false,
			description: ''
		},
	}
};

export const name = 'testUnique';
