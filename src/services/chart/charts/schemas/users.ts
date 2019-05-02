const logSchema = {
	/**
	 * 集計期間時点での、全ユーザー数
	 */
	total: {
		type: 'number' as 'number',
		description: '集計期間時点での、全ユーザー数'
	},

	/**
	 * 増加したユーザー数
	 */
	inc: {
		type: 'number' as 'number',
		description: '増加したユーザー数'
	},

	/**
	 * 減少したユーザー数
	 */
	dec: {
		type: 'number' as 'number',
		description: '減少したユーザー数'
	},
};

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

export const name = 'users';
