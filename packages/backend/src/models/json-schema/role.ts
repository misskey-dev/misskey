const rolePolicyValue = {
	type: 'object',
	properties: {
		value: {
			oneOf: [
				{
					type: 'integer',
					optional: false, nullable: false,
				},
				{
					type: 'boolean',
					optional: false, nullable: false,
				},
			],
		},
		priority: {
			type: 'integer',
			optional: false, nullable: false,
		},
		useDefault: {
			type: 'boolean',
			optional: false, nullable: false,
		},
	},
} as const;

export const packedRoleLiteSchema = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		name: {
			type: 'string',
			optional: false, nullable: false,
			example: 'New Role',
		},
		color: {
			type: 'string',
			optional: false, nullable: true,
			example: '#000000',
		},
		iconUrl: {
			type: 'string',
			optional: false, nullable: true,
		},
		description: {
			type: 'string',
			optional: false, nullable: false,
		},
		isModerator: {
			type: 'boolean',
			optional: false, nullable: false,
			example: false,
		},
		isAdministrator: {
			type: 'boolean',
			optional: false, nullable: false,
			example: false,
		},
		displayOrder: {
			type: 'integer',
			optional: false, nullable: false,
			example: 0,
		},
	},
} as const;

export const packedRoleSchema = {
	type: 'object',
	allOf: [
		{
			type: 'object',
			ref: 'RoleLite',
		},
		{
			type: 'object',
			properties: {
				createdAt: {
					type: 'string',
					optional: false, nullable: false,
					format: 'date-time',
				},
				updatedAt: {
					type: 'string',
					optional: false, nullable: false,
					format: 'date-time',
				},
				target: {
					type: 'string',
					optional: false, nullable: false,
					enum: ['manual', 'conditional'],
				},
				condFormula: {
					type: 'object',
					optional: false, nullable: false,
				},
				isPublic: {
					type: 'boolean',
					optional: false, nullable: false,
					example: false,
				},
				isExplorable: {
					type: 'boolean',
					optional: false, nullable: false,
					example: false,
				},
				asBadge: {
					type: 'boolean',
					optional: false, nullable: false,
					example: false,
				},
				canEditMembersByModerator: {
					type: 'boolean',
					optional: false, nullable: false,
					example: false,
				},
				policies: {
					type: 'object',
					optional: false, nullable: false,
					properties: {
						pinLimit: rolePolicyValue,
						canInvite: rolePolicyValue,
						clipLimit: rolePolicyValue,
						canHideAds: rolePolicyValue,
						inviteLimit: rolePolicyValue,
						antennaLimit: rolePolicyValue,
						gtlAvailable: rolePolicyValue,
						ltlAvailable: rolePolicyValue,
						webhookLimit: rolePolicyValue,
						canPublicNote: rolePolicyValue,
						userListLimit: rolePolicyValue,
						wordMuteLimit: rolePolicyValue,
						alwaysMarkNsfw: rolePolicyValue,
						canSearchNotes: rolePolicyValue,
						driveCapacityMb: rolePolicyValue,
						rateLimitFactor: rolePolicyValue,
						inviteLimitCycle: rolePolicyValue,
						noteEachClipsLimit: rolePolicyValue,
						inviteExpirationTime: rolePolicyValue,
						canManageCustomEmojis: rolePolicyValue,
						userEachUserListsLimit: rolePolicyValue,
						canManageAvatarDecorations: rolePolicyValue,
						canUseTranslator: rolePolicyValue,
						avatarDecorationLimit: rolePolicyValue,
					},
				},
				usersCount: {
					type: 'integer',
					optional: false, nullable: false,
				},
			},
		},
	],
} as const;
