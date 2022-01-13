export const packedNoteFavoriteSchema = {
	type: 'object' as const,
	optional: false as const, nullable: false as const,
	properties: {
		id: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		createdAt: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'date-time',
		},
		note: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			ref: 'Note' as const,
		},
		noteId: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'id',
		},
	},
};
