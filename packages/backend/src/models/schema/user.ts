export const packedUserSchema = {
	type: 'object',
	nullable: false, optional: false,
	properties: {
		id: {
			type: 'string',
			nullable: false, optional: false,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		name: {
			type: 'string',
			nullable: true, optional: false,
			example: '藍',
		},
		username: {
			type: 'string',
			nullable: false, optional: false,
			example: 'ai',
		},
		host: {
			type: 'string',
			nullable: true, optional: false,
			example: 'misskey.example.com',
		},
		avatarUrl: {
			type: 'string',
			format: 'url',
			nullable: true, optional: false,
		},
		avatarBlurhash: {
			type: 'any',
			nullable: true, optional: false,
		},
		avatarColor: {
			type: 'any',
			nullable: true, optional: false,
			default: null,
		},
		isAdmin: {
			type: 'boolean',
			nullable: false, optional: true,
			default: false,
		},
		isModerator: {
			type: 'boolean',
			nullable: false, optional: true,
			default: false,
		},
		isBot: {
			type: 'boolean',
			nullable: false, optional: true,
		},
		isCat: {
			type: 'boolean',
			nullable: false, optional: true,
		},
		emojis: {
			type: 'array',
			nullable: false, optional: false,
			items: {
				type: 'object',
				nullable: false, optional: false,
				properties: {
					name: {
						type: 'string',
						nullable: false, optional: false,
					},
					url: {
						type: 'string',
						nullable: false, optional: false,
						format: 'url',
					},
				},
			},
		},
		url: {
			type: 'string',
			format: 'url',
			nullable: true, optional: true,
		},
		createdAt: {
			type: 'string',
			nullable: false, optional: true,
			format: 'date-time',
		},
		updatedAt: {
			type: 'string',
			nullable: true, optional: true,
			format: 'date-time',
		},
		bannerUrl: {
			type: 'string',
			format: 'url',
			nullable: true, optional: true,
		},
		bannerBlurhash: {
			type: 'any',
			nullable: true, optional: true,
		},
		bannerColor: {
			type: 'any',
			nullable: true, optional: true,
			default: null,
		},
		isLocked: {
			type: 'boolean',
			nullable: false, optional: true,
		},
		isSuspended: {
			type: 'boolean',
			nullable: false, optional: true,
			example: false,
		},
		description: {
			type: 'string',
			nullable: true, optional: true,
			example: 'Hi masters, I am Ai!',
		},
		location: {
			type: 'string',
			nullable: true, optional: true,
		},
		birthday: {
			type: 'string',
			nullable: true, optional: true,
			example: '2018-03-12',
		},
		fields: {
			type: 'array',
			nullable: false, optional: true,
			items: {
				type: 'object',
				nullable: false, optional: false,
				properties: {
					name: {
						type: 'string',
						nullable: false, optional: false,
					},
					value: {
						type: 'string',
						nullable: false, optional: false,
					},
				},
				maxLength: 4,
			},
		},
		followersCount: {
			type: 'number',
			nullable: false, optional: true,
		},
		followingCount: {
			type: 'number',
			nullable: false, optional: true,
		},
		notesCount: {
			type: 'number',
			nullable: false, optional: true,
		},
		pinnedNoteIds: {
			type: 'array',
			nullable: false, optional: true,
			items: {
				type: 'string',
				nullable: false, optional: false,
				format: 'id',
			},
		},
		pinnedNotes: {
			type: 'array',
			nullable: false, optional: true,
			items: {
				type: 'object',
				nullable: false, optional: false,
				ref: 'Note',
			},
		},
		pinnedPageId: {
			type: 'string',
			nullable: true, optional: true,
		},
		pinnedPage: {
			type: 'object',
			nullable: true, optional: true,
			ref: 'Page',
		},
		twoFactorEnabled: {
			type: 'boolean',
			nullable: false, optional: true,
			default: false,
		},
		usePasswordLessLogin: {
			type: 'boolean',
			nullable: false, optional: true,
			default: false,
		},
		securityKeys: {
			type: 'boolean',
			nullable: false, optional: true,
			default: false,
		},
		avatarId: {
			type: 'string',
			nullable: true, optional: true,
			format: 'id',
		},
		bannerId: {
			type: 'string',
			nullable: true, optional: true,
			format: 'id',
		},
		autoWatch: {
			type: 'boolean',
			nullable: false, optional: true,
		},
		injectFeaturedNote: {
			type: 'boolean',
			nullable: false, optional: true,
		},
		alwaysMarkNsfw: {
			type: 'boolean',
			nullable: false, optional: true,
		},
		carefulBot: {
			type: 'boolean',
			nullable: false, optional: true,
		},
		autoAcceptFollowed: {
			type: 'boolean',
			nullable: false, optional: true,
		},
		hasUnreadSpecifiedNotes: {
			type: 'boolean',
			nullable: false, optional: true,
		},
		hasUnreadMentions: {
			type: 'boolean',
			nullable: false, optional: true,
		},
		hasUnreadAnnouncement: {
			type: 'boolean',
			nullable: false, optional: true,
		},
		hasUnreadAntenna: {
			type: 'boolean',
			nullable: false, optional: true,
		},
		hasUnreadChannel: {
			type: 'boolean',
			nullable: false, optional: true,
		},
		hasUnreadMessagingMessage: {
			type: 'boolean',
			nullable: false, optional: true,
		},
		hasUnreadNotification: {
			type: 'boolean',
			nullable: false, optional: true,
		},
		hasPendingReceivedFollowRequest: {
			type: 'boolean',
			nullable: false, optional: true,
		},
		integrations: {
			type: 'object',
			nullable: false, optional: true,
		},
		mutedWords: {
			type: 'array',
			nullable: false, optional: true,
		},
		mutedInstances: {
			type: 'array',
			nullable: false, optional: true,
		},
		mutingNotificationTypes: {
			type: 'array',
			nullable: false, optional: true,
		},
		isFollowing: {
			type: 'boolean',
			optional: true, nullable: false,
		},
		hasPendingFollowRequestFromYou: {
			type: 'boolean',
			optional: true, nullable: false,
		},
		hasPendingFollowRequestToYou: {
			type: 'boolean',
			optional: true, nullable: false,
		},
		isFollowed: {
			type: 'boolean',
			optional: true, nullable: false,
		},
		isBlocking: {
			type: 'boolean',
			optional: true, nullable: false,
		},
		isBlocked: {
			type: 'boolean',
			optional: true, nullable: false,
		},
		isMuted: {
			type: 'boolean',
			optional: true, nullable: false,
		},
	},
} as const;
