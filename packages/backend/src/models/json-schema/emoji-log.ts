export const packedEmojiChangeInfoSchema = {
	type: 'object',
	properties: {
		before: {
			type: 'any',
			optional: false, nullable: false,
		},
		after: {
			type: 'any',
			optional: false, nullable: false,
		},
	},
} as const;

export const packedEmojiChangesPropertySchema = {
	type: 'object',
	properties: {
		type: {
			type: 'string',
			optional: false, nullable: false,
		},
		changeInfo: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'EmojiChangeInfo',
		},
	},
} as const;

export const packedEmojiChangeLogSchema = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
		},
		createDate: {
			type: 'string',
			optional: false, nullable: false,
			format: 'date-time',
		},
		userId: {
			type: 'string',
			optional: false, nullable: true,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		user: {
			type: 'object',
			optional: true, nullable: true,
			ref: 'UserLite',
		},
		type: {
			type: 'string',
			optional: false, nullable: false,
		},
		changesProperties: {
			type: 'array',
			optional: false, nullable: false,
			items: {
				type: 'object',
				optional: false, nullable: false,
				ref: 'EmojiChangesProperty',
			},
		},
	},
} as const;

export const packedEmojiChangeLogsSchema = {
	type: 'array',
	optional: false, nullable: false,
	items: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'EmojiChangeLog',
	},
} as const;
