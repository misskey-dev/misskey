export const packedChannelSchema = {
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
		lastNotedAt: {
			type: 'string' as const,
			optional: false as const, nullable: true as const,
			format: 'date-time',
		},
		name: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
		},
		description: {
			type: 'string' as const,
			nullable: true as const, optional: false as const,
		},
		bannerUrl: {
			type: 'string' as const,
			format: 'url',
			nullable: true as const, optional: false as const,
		},
		notesCount: {
			type: 'number' as const,
			nullable: false as const, optional: false as const,
		},
		usersCount: {
			type: 'number' as const,
			nullable: false as const, optional: false as const,
		},
		isFollowing: {
			type: 'boolean' as const,
			optional: true as const, nullable: false as const,
		},
		userId: {
			type: 'string' as const,
			nullable: true as const, optional: false as const,
			format: 'id',
		},
	},
};
