export const packedEmojiSchema = {
	type: 'object' as const,
	optional: false as const, nullable: false as const,
	properties: {
		id: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		aliases: {
			type: 'array' as const,
			optional: false as const, nullable: false as const,
			items: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
				format: 'id',
			},
		},
		name: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
		},
		category: {
			type: 'string' as const,
			optional: false as const, nullable: true as const,
		},
		host: {
			type: 'string' as const,
			optional: false as const, nullable: true as const,
		},
		url: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
		},
	},
};
