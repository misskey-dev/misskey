export const packedBlockingSchema = {
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
		blockeeId: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
		},
		blockee: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'User',
		},
	},
} as const;
