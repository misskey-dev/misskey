export const logSchema = {
	/**
	 * アクティブユーザー数
	 */
	count: {
		type: 'number' as 'number',
		description: 'アクティブユーザー数',
	},
};

/**
 * アクティブユーザーに関するチャート
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

export const name = 'activeUsers';
