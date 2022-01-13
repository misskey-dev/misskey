export const packedHashtagSchema = {
	type: 'object' as const,
	optional: false as const, nullable: false as const,
	properties: {
		tag: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			example: 'misskey',
		},
		mentionedUsersCount: {
			type: 'number' as const,
			optional: false as const, nullable: false as const,
		},
		mentionedLocalUsersCount: {
			type: 'number' as const,
			optional: false as const, nullable: false as const,
		},
		mentionedRemoteUsersCount: {
			type: 'number' as const,
			optional: false as const, nullable: false as const,
		},
		attachedUsersCount: {
			type: 'number' as const,
			optional: false as const, nullable: false as const,
		},
		attachedLocalUsersCount: {
			type: 'number' as const,
			optional: false as const, nullable: false as const,
		},
		attachedRemoteUsersCount: {
			type: 'number' as const,
			optional: false as const, nullable: false as const,
		},
	},
};
