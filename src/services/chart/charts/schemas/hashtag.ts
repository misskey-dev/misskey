import { types, bool } from '../../../../misc/schema';

export const logSchema = {
	/**
	 * 投稿された数
	 */
	count: {
		type: types.number,
		optional: bool.false, nullable: bool.false,
		description: '投稿された数',
	},
};

/**
 * ハッシュタグに関するチャート
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

export const name = 'hashtag';
