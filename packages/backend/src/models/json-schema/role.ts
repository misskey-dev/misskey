export const packedRolePoliciesSchema = {
	type: 'object',
	optional: false, nullable: false,
	properties: {
		gtlAvailable: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		ltlAvailable: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		canPublicNote: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		canScheduleNote: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		canInvite: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		inviteLimit: {
			type: 'integer',
			optional: false, nullable: false,
		},
		inviteLimitCycle: {
			type: 'integer',
			optional: false, nullable: false,
		},
		inviteExpirationTime: {
			type: 'integer',
			optional: false, nullable: false,
		},
		canManageCustomEmojis: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		canManageAvatarDecorations: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		canSearchNotes: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		canUseTranslator: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		canHideAds: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		driveCapacityMb: {
			type: 'integer',
			optional: false, nullable: false,
		},
		alwaysMarkNsfw: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		pinLimit: {
			type: 'integer',
			optional: false, nullable: false,
		},
		antennaLimit: {
			type: 'integer',
			optional: false, nullable: false,
		},
		wordMuteLimit: {
			type: 'integer',
			optional: false, nullable: false,
		},
		webhookLimit: {
			type: 'integer',
			optional: false, nullable: false,
		},
		clipLimit: {
			type: 'integer',
			optional: false, nullable: false,
		},
		noteEachClipsLimit: {
			type: 'integer',
			optional: false, nullable: false,
		},
		userListLimit: {
			type: 'integer',
			optional: false, nullable: false,
		},
		userEachUserListsLimit: {
			type: 'integer',
			optional: false, nullable: false,
		},
		rateLimitFactor: {
			type: 'integer',
			optional: false, nullable: false,
		},
		avatarDecorationLimit: {
			type: 'integer',
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
					additionalProperties: {
						anyOf: [{
							type: 'object',
							properties: {
								value: {
									oneOf: [
										{
											type: 'integer',
										},
										{
											type: 'boolean',
										},
									],
								},
								priority: {
									type: 'integer',
								},
								useDefault: {
									type: 'boolean',
								},
							},
						}],
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
