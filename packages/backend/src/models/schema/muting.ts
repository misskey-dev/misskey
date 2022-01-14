export const packedMutingSchema = {
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
		muteeId: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
		},
		mutee: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'User',
		},
	},
} as const;
