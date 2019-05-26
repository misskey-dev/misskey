import { types, bool } from '../../../../misc/schema';

export const logSchema = {
	/**
	 * アクティブユーザー数
	 */
	count: {
		type: types.number,
		optional: bool.false, nullable: bool.false,
		description: 'アクティブユーザー数',
	},
};

/**
 * アクティブユーザーに関するチャート
 */
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

export const name = 'activeUsers';
