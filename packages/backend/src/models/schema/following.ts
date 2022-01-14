export const packedFollowingSchema = {
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
		followeeId: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
		},
		followee: {
			type: 'object',
			optional: true, nullable: false,
			ref: 'User',
		},
		followerId: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
		},
		follower: {
			type: 'object',
			optional: true, nullable: false,
			ref: 'User',
		},
	},
} as const;
