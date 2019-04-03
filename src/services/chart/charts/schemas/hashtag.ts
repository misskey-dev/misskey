export const logSchema = {
	/**
	 * 投稿された数
	 */
	count: {
		type: 'number' as 'number',
		description: '投稿された数',
	},
};

/**
 * ハッシュタグに関するチャート
 */
export const schema = {
	type: 'object' as 'object',
	properties: {
		local: {
			type: 'object' as 'object',
			properties: logSchema
		},
		remote: {
			type: 'object' as 'object',
			properties: logSchema
		},
	}
};

export const name = 'hashtag';
