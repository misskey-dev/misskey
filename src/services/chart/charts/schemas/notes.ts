const logSchema = {
	total: {
		type: 'number' as const,
		optional: false as const, nullable: false as const,
		description: '集計期間時点での、全投稿数'
	},

	inc: {
		type: 'number' as const,
		optional: false as const, nullable: false as const,
		description: '増加した投稿数'
	},

	dec: {
		type: 'number' as const,
		optional: false as const, nullable: false as const,
		description: '減少した投稿数'
	},

	diffs: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		properties: {
			normal: {
				type: 'number' as const,
				optional: false as const, nullable: false as const,
				description: '通常の投稿数の差分'
			},

			reply: {
				type: 'number' as const,
				optional: false as const, nullable: false as const,
				description: 'リプライの投稿数の差分'
			},

			renote: {
				type: 'number' as const,
				optional: false as const, nullable: false as const,
				description: 'Renoteの投稿数の差分'
			},
		}
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

export const name = 'notes';
