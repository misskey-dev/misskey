export const packedAntennaSchema = {
	type: 'object' as const,
	optional: false as const, nullable: false as const,
	properties: {
		id: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'id',
		},
		createdAt: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'date-time',
		},
		name: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
		},
		keywords: {
			type: 'array' as const,
			optional: false as const, nullable: false as const,
			items: {
				type: 'array' as const,
				optional: false as const, nullable: false as const,
				items: {
					type: 'string' as const,
					optional: false as const, nullable: false as const,
				},
			},
		},
		excludeKeywords: {
			type: 'array' as const,
			optional: false as const, nullable: false as const,
			items: {
				type: 'array' as const,
				optional: false as const, nullable: false as const,
				items: {
					type: 'string' as const,
					optional: false as const, nullable: false as const,
				},
			},
		},
		src: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			enum: ['home', 'all', 'users', 'list', 'group'],
		},
		userListId: {
			type: 'string' as const,
			optional: false as const, nullable: true as const,
			format: 'id',
		},
		userGroupId: {
			type: 'string' as const,
			optional: false as const, nullable: true as const,
			format: 'id',
		},
		users: {
			type: 'array' as const,
			optional: false as const, nullable: false as const,
			items: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
			},
		},
		caseSensitive: {
			type: 'boolean' as const,
			optional: false as const, nullable: false as const,
			default: false,
		},
		notify: {
			type: 'boolean' as const,
			optional: false as const, nullable: false as const,
		},
		withReplies: {
			type: 'boolean' as const,
			optional: false as const, nullable: false as const,
			default: false,
		},
		withFile: {
			type: 'boolean' as const,
			optional: false as const, nullable: false as const,
		},
		hasUnreadNote: {
			type: 'boolean' as const,
			optional: false as const, nullable: false as const,
			default: false,
		},
	},
};
