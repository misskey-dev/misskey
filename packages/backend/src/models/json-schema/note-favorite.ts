export const packedNoteFavoriteSchema = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		createdAt: {
			type: 'string',
			optional: false, nullable: false,
			format: 'date-time',
		},
		note: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Note',
		},
		noteId: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
		},
	},
} as const;
