import { types, bool } from '../../../../misc/schema';

const logSchema = {
	/**
	 * 集計期間時点での、全ユーザー数
	 */
	total: {
		type: types.number,
		optional: bool.false, nullable: bool.false,
		description: '集計期間時点での、全ユーザー数'
	},

	/**
	 * 増加したユーザー数
	 */
	inc: {
		type: types.number,
		optional: bool.false, nullable: bool.false,
		description: '増加したユーザー数'
	},

	/**
	 * 減少したユーザー数
	 */
	dec: {
		type: types.number,
		optional: bool.false, nullable: bool.false,
		description: '減少したユーザー数'
	},
};

export const schema = {
	type: types.object,
	optional: bool.false, nullable: bool.false,
	properties: {
		local: {
			type: types.object,
			optional: bool.false, nullable: bool.false,
			properties: logSchema
		},
		remote: {
			type: types.object,
			optional: bool.false, nullable: bool.false,
			properties: logSchema
		},
	}
};

export const name = 'users';
