export const logSchema = {
	/**
	 * フォローしている合計
	 */
	count: {
		type: 'number' as 'number',
		description: 'リアクションされた数',
	},
};

/**
 * ユーザーごとのリアクションに関するチャート
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

export const name = 'perUserReaction';
