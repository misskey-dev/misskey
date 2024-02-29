export const packedEmojiSchema = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			optional: true, nullable: false,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		aliases: {
			type: 'array',
			optional: false, nullable: false,
			items: {
				type: 'string',
				optional: false, nullable: false,
				format: 'id',
			},
		},
		name: {
			type: 'string',
			optional: false, nullable: false,
		},
		category: {
			type: 'string',
			optional: false, nullable: true,
		},
		host: {
			type: 'string',
			optional: true, nullable: true,
			description: 'The local host is represented with `null`.',
		},
		url: {
			type: 'string',
			optional: true, nullable: false,
		},
	},
} as const;
