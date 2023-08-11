export const packedAntennaSchema = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
		},
		createdAt: {
			type: 'string',
			optional: false, nullable: false,
			format: 'date-time',
		},
		name: {
			type: 'string',
			optional: false, nullable: false,
		},
		keywords: {
			type: 'array',
			optional: false, nullable: false,
			items: {
				type: 'array',
				optional: false, nullable: false,
				items: {
					type: 'string',
					optional: false, nullable: false,
				},
			},
		},
		excludeKeywords: {
			type: 'array',
			optional: false, nullable: false,
			items: {
				type: 'array',
				optional: false, nullable: false,
				items: {
					type: 'string',
					optional: false, nullable: false,
				},
			},
		},
		src: {
			type: 'string',
			optional: false, nullable: false,
			enum: ['home', 'all', 'users', 'list'],
		},
		userListId: {
			type: 'string',
			optional: false, nullable: true,
			format: 'id',
		},
		users: {
			type: 'array',
			optional: false, nullable: false,
			items: {
				type: 'string',
				optional: false, nullable: false,
			},
		},
		caseSensitive: {
			type: 'boolean',
			optional: false, nullable: false,
			default: false,
		},
		notify: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		withReplies: {
			type: 'boolean',
			optional: false, nullable: false,
			default: false,
		},
		withFile: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		isActive: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		hasUnreadNote: {
			type: 'boolean',
			optional: false, nullable: false,
			default: false,
		},
	},
} as const;
