export const logSchema = {
	/**
	 * 投稿したユーザー
	 */
	users: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		description: '投稿したユーザー',
		items: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
		}
	},
};

/**
 * ハッシュタグに関するチャート
 */
export const schema = {
	type: 'object' as const,
	optional: false as const, nullable: false as const,
	properties: {
		local: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			properties: logSchema
		},
		remote: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			properties: logSchema
		},
	}
};

export const name = 'hashtag';
