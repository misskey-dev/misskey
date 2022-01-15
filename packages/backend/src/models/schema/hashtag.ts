export const packedHashtagSchema = {
	type: 'object',
	properties: {
		tag: {
			type: 'string',
			optional: false, nullable: false,
			example: 'misskey',
		},
		mentionedUsersCount: {
			type: 'number',
			optional: false, nullable: false,
		},
		mentionedLocalUsersCount: {
			type: 'number',
			optional: false, nullable: false,
		},
		mentionedRemoteUsersCount: {
			type: 'number',
			optional: false, nullable: false,
		},
		attachedUsersCount: {
			type: 'number',
			optional: false, nullable: false,
		},
		attachedLocalUsersCount: {
			type: 'number',
			optional: false, nullable: false,
		},
		attachedRemoteUsersCount: {
			type: 'number',
			optional: false, nullable: false,
		},
	},
} as const;
