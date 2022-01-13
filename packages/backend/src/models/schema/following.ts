export const packedFollowingSchema = {
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
		followeeId: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'id',
		},
		followee: {
			type: 'object' as const,
			optional: true as const, nullable: false as const,
			ref: 'User' as const,
		},
		followerId: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'id',
		},
		follower: {
			type: 'object' as const,
			optional: true as const, nullable: false as const,
			ref: 'User' as const,
		},
	},
};
