import { types, bool } from '../../../../misc/schema';

export const logSchema = {
	/**
	 * フォローしている合計
	 */
	count: {
		type: types.number,
		optional: bool.false, nullable: bool.false,
		description: 'リアクションされた数',
	},
};

/**
 * ユーザーごとのリアクションに関するチャート
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

export const name = 'perUserReaction';
