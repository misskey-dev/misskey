export const packedUserListSchema = {
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
		name: {
			type: 'string',
			optional: false, nullable: false,
		},
		userIds: {
			type: 'array',
			nullable: false, optional: true,
			items: {
				type: 'string',
				nullable: false, optional: false,
				format: 'id',
			},
		},
	},
} as const;
