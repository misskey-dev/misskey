export const packedUserSchema = {
	type: 'object' as const,
	nullable: false as const, optional: false as const,
	properties: {
		id: {
			type: 'string' as const,
			nullable: false as const, optional: false as const,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		name: {
			type: 'string' as const,
			nullable: true as const, optional: false as const,
			example: '藍',
		},
		username: {
			type: 'string' as const,
			nullable: false as const, optional: false as const,
			example: 'ai',
		},
		host: {
			type: 'string' as const,
			nullable: true as const, optional: false as const,
			example: 'misskey.example.com',
		},
		avatarUrl: {
			type: 'string' as const,
			format: 'url',
			nullable: true as const, optional: false as const,
		},
		avatarBlurhash: {
			type: 'any' as const,
			nullable: true as const, optional: false as const,
		},
		avatarColor: {
			type: 'any' as const,
			nullable: true as const, optional: false as const,
			default: null,
		},
		isAdmin: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const,
			default: false,
		},
		isModerator: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const,
			default: false,
		},
		isBot: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const,
		},
		isCat: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const,
		},
		emojis: {
			type: 'array' as const,
			nullable: false as const, optional: false as const,
			items: {
				type: 'object' as const,
				nullable: false as const, optional: false as const,
				properties: {
					name: {
						type: 'string' as const,
						nullable: false as const, optional: false as const,
					},
					url: {
						type: 'string' as const,
						nullable: false as const, optional: false as const,
						format: 'url',
					},
				},
			},
		},
		url: {
			type: 'string' as const,
			format: 'url',
			nullable: true as const, optional: true as const,
		},
		createdAt: {
			type: 'string' as const,
			nullable: false as const, optional: true as const,
			format: 'date-time',
		},
		updatedAt: {
			type: 'string' as const,
			nullable: true as const, optional: true as const,
			format: 'date-time',
		},
		bannerUrl: {
			type: 'string' as const,
			format: 'url',
			nullable: true as const, optional: true as const,
		},
		bannerBlurhash: {
			type: 'any' as const,
			nullable: true as const, optional: true as const,
		},
		bannerColor: {
			type: 'any' as const,
			nullable: true as const, optional: true as const,
			default: null,
		},
		isLocked: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const,
		},
		isSuspended: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const,
			example: false,
		},
		description: {
			type: 'string' as const,
			nullable: true as const, optional: true as const,
			example: 'Hi masters, I am Ai!',
		},
		location: {
			type: 'string' as const,
			nullable: true as const, optional: true as const,
		},
		birthday: {
			type: 'string' as const,
			nullable: true as const, optional: true as const,
			example: '2018-03-12',
		},
		fields: {
			type: 'array' as const,
			nullable: false as const, optional: true as const,
			items: {
				type: 'object' as const,
				nullable: false as const, optional: false as const,
				properties: {
					name: {
						type: 'string' as const,
						nullable: false as const, optional: false as const,
					},
					value: {
						type: 'string' as const,
						nullable: false as const, optional: false as const,
					},
				},
				maxLength: 4,
			},
		},
		followersCount: {
			type: 'number' as const,
			nullable: false as const, optional: true as const,
		},
		followingCount: {
			type: 'number' as const,
			nullable: false as const, optional: true as const,
		},
		notesCount: {
			type: 'number' as const,
			nullable: false as const, optional: true as const,
		},
		pinnedNoteIds: {
			type: 'array' as const,
			nullable: false as const, optional: true as const,
			items: {
				type: 'string' as const,
				nullable: false as const, optional: false as const,
				format: 'id',
			},
		},
		pinnedNotes: {
			type: 'array' as const,
			nullable: false as const, optional: true as const,
			items: {
				type: 'object' as const,
				nullable: false as const, optional: false as const,
				ref: 'Note' as const,
			},
		},
		pinnedPageId: {
			type: 'string' as const,
			nullable: true as const, optional: true as const,
		},
		pinnedPage: {
			type: 'object' as const,
			nullable: true as const, optional: true as const,
			ref: 'Page' as const,
		},
		twoFactorEnabled: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const,
			default: false,
		},
		usePasswordLessLogin: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const,
			default: false,
		},
		securityKeys: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const,
			default: false,
		},
		avatarId: {
			type: 'string' as const,
			nullable: true as const, optional: true as const,
			format: 'id',
		},
		bannerId: {
			type: 'string' as const,
			nullable: true as const, optional: true as const,
			format: 'id',
		},
		autoWatch: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const,
		},
		injectFeaturedNote: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const,
		},
		alwaysMarkNsfw: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const,
		},
		carefulBot: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const,
		},
		autoAcceptFollowed: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const,
		},
		hasUnreadSpecifiedNotes: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const,
		},
		hasUnreadMentions: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const,
		},
		hasUnreadAnnouncement: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const,
		},
		hasUnreadAntenna: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const,
		},
		hasUnreadChannel: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const,
		},
		hasUnreadMessagingMessage: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const,
		},
		hasUnreadNotification: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const,
		},
		hasPendingReceivedFollowRequest: {
			type: 'boolean' as const,
			nullable: false as const, optional: true as const,
		},
		integrations: {
			type: 'object' as const,
			nullable: false as const, optional: true as const,
		},
		mutedWords: {
			type: 'array' as const,
			nullable: false as const, optional: true as const,
		},
		mutedInstances: {
			type: 'array' as const,
			nullable: false as const, optional: true as const,
		},
		mutingNotificationTypes: {
			type: 'array' as const,
			nullable: false as const, optional: true as const,
		},
		isFollowing: {
			type: 'boolean' as const,
			optional: true as const, nullable: false as const,
		},
		hasPendingFollowRequestFromYou: {
			type: 'boolean' as const,
			optional: true as const, nullable: false as const,
		},
		hasPendingFollowRequestToYou: {
			type: 'boolean' as const,
			optional: true as const, nullable: false as const,
		},
		isFollowed: {
			type: 'boolean' as const,
			optional: true as const, nullable: false as const,
		},
		isBlocking: {
			type: 'boolean' as const,
			optional: true as const, nullable: false as const,
		},
		isBlocked: {
			type: 'boolean' as const,
			optional: true as const, nullable: false as const,
		},
		isMuted: {
			type: 'boolean' as const,
			optional: true as const, nullable: false as const,
		},
	},
};
