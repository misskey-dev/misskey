const logSchema = {
	/**
	 * 集計期間時点での、全ユーザー数
	 */
	total: {
		type: 'number' as const,
		optional: false as const, nullable: false as const,
	},

	/**
	 * 増加したユーザー数
	 */
	inc: {
		type: 'number' as const,
		optional: false as const, nullable: false as const,
	},

	/**
	 * 減少したユーザー数
	 */
	dec: {
		type: 'number' as const,
		optional: false as const, nullable: false as const,
	},
};

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

export const name = 'users';
