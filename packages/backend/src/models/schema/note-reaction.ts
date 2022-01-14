export const packedNoteReactionSchema = {
	type: 'object',
	optional: false, nullable: false,
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
		user: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'User',
		},
		type: {
			type: 'string',
			optional: false, nullable: false,
		},
	},
} as const;
