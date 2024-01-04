/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const notificationRecieveConfig = {
	type: 'object',
	nullable: false, optional: true,
	properties: {
		type: {
			type: 'string',
			nullable: false, optional: false,
			enum: ['all', 'following', 'follower', 'mutualFollow', 'list', 'never'],
		},
	},
} as const;

export const packedUserLiteSchema = {
	type: 'object',
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
			description: 'The local host is represented with `null`.',
		},
		avatarUrl: {
			type: 'string',
			format: 'url',
			nullable: true, optional: false,
		},
		avatarBlurhash: {
			type: 'string',
			nullable: true, optional: false,
		},
		avatarDecorations: {
			type: 'array',
			nullable: false, optional: false,
			items: {
				type: 'object',
				nullable: false, optional: false,
				properties: {
					id: {
						type: 'string',
						nullable: false, optional: false,
						format: 'id',
					},
					angle: {
						type: 'number',
						nullable: false, optional: true,
					},
					flipH: {
						type: 'boolean',
						nullable: false, optional: true,
					},
					url: {
						type: 'string',
						format: 'url',
						nullable: false, optional: false,
					},
					offsetX: {
						type: 'number',
						nullable: false, optional: true,
					},
					offsetY: {
						type: 'number',
						nullable: false, optional: true,
					},
				},
			},
		},
		isBot: {
			type: 'boolean',
			nullable: false, optional: true,
		},
		isCat: {
			type: 'boolean',
			nullable: false, optional: true,
		},
		instance: {
			type: 'object',
			nullable: false, optional: true,
			properties: {
				name: {
					type: 'string',
					nullable: true, optional: false,
				},
				softwareName: {
					type: 'string',
					nullable: true, optional: false,
				},
				softwareVersion: {
					type: 'string',
					nullable: true, optional: false,
				},
				iconUrl: {
					type: 'string',
					nullable: true, optional: false,
				},
				faviconUrl: {
					type: 'string',
					nullable: true, optional: false,
				},
				themeColor: {
					type: 'string',
					nullable: true, optional: false,
				},
			},
		},
		emojis: {
			type: 'object',
			nullable: false, optional: false,
		},
		onlineStatus: {
			type: 'string',
			nullable: false, optional: false,
			enum: ['unknown', 'online', 'active', 'offline'],
		},
		badgeRoles: {
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
					iconUrl: {
						type: 'string',
						nullable: true, optional: false,
					},
					displayOrder: {
						type: 'number',
						nullable: false, optional: false,
					},
				},
			},
		},
	},
} as const;

export const packedUserDetailedNotMeOnlySchema = {
	type: 'object',
	properties: {
		url: {
			type: 'string',
			format: 'url',
			nullable: true, optional: false,
		},
		uri: {
			type: 'string',
			format: 'uri',
			nullable: true, optional: false,
		},
		movedTo: {
			type: 'string',
			format: 'uri',
			nullable: true, optional: false,
		},
		alsoKnownAs: {
			type: 'array',
			nullable: true, optional: false,
			items: {
				type: 'string',
				format: 'id',
				nullable: false, optional: false,
			},
		},
		createdAt: {
			type: 'string',
			nullable: false, optional: false,
			format: 'date-time',
		},
		updatedAt: {
			type: 'string',
			nullable: true, optional: false,
			format: 'date-time',
		},
		lastFetchedAt: {
			type: 'string',
			nullable: true, optional: false,
			format: 'date-time',
		},
		bannerUrl: {
			type: 'string',
			format: 'url',
			nullable: true, optional: false,
		},
		bannerBlurhash: {
			type: 'string',
			nullable: true, optional: false,
		},
		isLocked: {
			type: 'boolean',
			nullable: false, optional: false,
		},
		isSilenced: {
			type: 'boolean',
			nullable: false, optional: false,
		},
		isSuspended: {
			type: 'boolean',
			nullable: false, optional: false,
			example: false,
		},
		description: {
			type: 'string',
			nullable: true, optional: false,
			example: 'Hi masters, I am Ai!',
		},
		location: {
			type: 'string',
			nullable: true, optional: false,
		},
		birthday: {
			type: 'string',
			nullable: true, optional: false,
			example: '2018-03-12',
		},
		lang: {
			type: 'string',
			nullable: true, optional: false,
			example: 'ja-JP',
		},
		fields: {
			type: 'array',
			nullable: false, optional: false,
			maxItems: 16,
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
			},
		},
		verifiedLinks: {
			type: 'array',
			nullable: false, optional: false,
			items: {
				type: 'string',
				nullable: false, optional: false,
				format: 'url',
			},
		},
		followersCount: {
			type: 'number',
			nullable: false, optional: false,
		},
		followingCount: {
			type: 'number',
			nullable: false, optional: false,
		},
		notesCount: {
			type: 'number',
			nullable: false, optional: false,
		},
		pinnedNoteIds: {
			type: 'array',
			nullable: false, optional: false,
			items: {
				type: 'string',
				nullable: false, optional: false,
				format: 'id',
			},
		},
		pinnedNotes: {
			type: 'array',
			nullable: false, optional: false,
			items: {
				type: 'object',
				nullable: false, optional: false,
				ref: 'Note',
			},
		},
		pinnedPageId: {
			type: 'string',
			nullable: true, optional: false,
		},
		pinnedPage: {
			type: 'object',
			nullable: true, optional: false,
			ref: 'Page',
		},
		publicReactions: {
			type: 'boolean',
			nullable: false, optional: false,
		},
		followingVisibility: {
			type: 'string',
			nullable: false, optional: false,
			enum: ['public', 'followers', 'private'],
		},
		followersVisibility: {
			type: 'string',
			nullable: false, optional: false,
			enum: ['public', 'followers', 'private'],
		},
		twoFactorEnabled: {
			type: 'boolean',
			nullable: false, optional: false,
			default: false,
		},
		usePasswordLessLogin: {
			type: 'boolean',
			nullable: false, optional: false,
			default: false,
		},
		securityKeys: {
			type: 'boolean',
			nullable: false, optional: false,
			default: false,
		},
		roles: {
			type: 'array',
			nullable: false, optional: false,
			items: {
				type: 'object',
				nullable: false, optional: false,
				ref: 'RoleLite',
			},
		},
		memo: {
			type: 'string',
			nullable: true, optional: false,
		},
		moderationNote: {
			type: 'string',
			nullable: false, optional: true,
		},
		//#region relations
		isFollowing: {
			type: 'boolean',
			nullable: false, optional: true,
		},
		isFollowed: {
			type: 'boolean',
			nullable: false, optional: true,
		},
		hasPendingFollowRequestFromYou: {
			type: 'boolean',
			nullable: false, optional: true,
		},
		hasPendingFollowRequestToYou: {
			type: 'boolean',
			nullable: false, optional: true,
		},
		isBlocking: {
			type: 'boolean',
			nullable: false, optional: true,
		},
		isBlocked: {
			type: 'boolean',
			nullable: false, optional: true,
		},
		isMuted: {
			type: 'boolean',
			nullable: false, optional: true,
		},
		isRenoteMuted: {
			type: 'boolean',
			nullable: false, optional: true,
		},
		notify: {
			type: 'string',
			nullable: false, optional: true,
			enum: ['normal', 'none'],
		},
		withReplies: {
			type: 'boolean',
			nullable: false, optional: true,
		},
		//#endregion
	},
} as const;

export const packedMeDetailedOnlySchema = {
	type: 'object',
	properties: {
		avatarId: {
			type: 'string',
			nullable: true, optional: false,
			format: 'id',
		},
		bannerId: {
			type: 'string',
			nullable: true, optional: false,
			format: 'id',
		},
		isModerator: {
			type: 'boolean',
			nullable: true, optional: false,
		},
		isAdmin: {
			type: 'boolean',
			nullable: true, optional: false,
		},
		injectFeaturedNote: {
			type: 'boolean',
			nullable: false, optional: false,
		},
		receiveAnnouncementEmail: {
			type: 'boolean',
			nullable: false, optional: false,
		},
		alwaysMarkNsfw: {
			type: 'boolean',
			nullable: false, optional: false,
		},
		autoSensitive: {
			type: 'boolean',
			nullable: false, optional: false,
		},
		carefulBot: {
			type: 'boolean',
			nullable: false, optional: false,
		},
		autoAcceptFollowed: {
			type: 'boolean',
			nullable: false, optional: false,
		},
		noCrawle: {
			type: 'boolean',
			nullable: false, optional: false,
		},
		preventAiLearning: {
			type: 'boolean',
			nullable: false, optional: false,
		},
		isExplorable: {
			type: 'boolean',
			nullable: false, optional: false,
		},
		isDeleted: {
			type: 'boolean',
			nullable: false, optional: false,
		},
		twoFactorBackupCodesStock: {
			type: 'string',
			enum: ['full', 'partial', 'none'],
			nullable: false, optional: false,
		},
		hideOnlineStatus: {
			type: 'boolean',
			nullable: false, optional: false,
		},
		hasUnreadSpecifiedNotes: {
			type: 'boolean',
			nullable: false, optional: false,
		},
		hasUnreadMentions: {
			type: 'boolean',
			nullable: false, optional: false,
		},
		hasUnreadAnnouncement: {
			type: 'boolean',
			nullable: false, optional: false,
		},
		unreadAnnouncements: {
			type: 'array',
			nullable: false, optional: false,
			items: {
				type: 'object',
				nullable: false, optional: false,
				ref: 'Announcement',
			},
		},
		hasUnreadAntenna: {
			type: 'boolean',
			nullable: false, optional: false,
		},
		hasUnreadChannel: {
			type: 'boolean',
			nullable: false, optional: false,
		},
		hasUnreadNotification: {
			type: 'boolean',
			nullable: false, optional: false,
		},
		hasPendingReceivedFollowRequest: {
			type: 'boolean',
			nullable: false, optional: false,
		},
		unreadNotificationsCount: {
			type: 'number',
			nullable: false, optional: false,
		},
		mutedWords: {
			type: 'array',
			nullable: false, optional: false,
			items: {
				type: 'array',
				nullable: false, optional: false,
				items: {
					type: 'string',
					nullable: false, optional: false,
				},
			},
		},
		hardMutedWords: {
			type: 'array',
			nullable: false, optional: false,
			items: {
				type: 'array',
				nullable: false, optional: false,
				items: {
					type: 'string',
					nullable: false, optional: false,
				},
			},
		},
		mutedInstances: {
			type: 'array',
			nullable: true, optional: false,
			items: {
				type: 'string',
				nullable: false, optional: false,
			},
		},
		notificationRecieveConfig: {
			type: 'object',
			nullable: false, optional: false,
			properties: {
				app: notificationRecieveConfig,
				quote: notificationRecieveConfig,
				reply: notificationRecieveConfig,
				follow: notificationRecieveConfig,
				renote: notificationRecieveConfig,
				mention: notificationRecieveConfig,
				reaction: notificationRecieveConfig,
				pollEnded: notificationRecieveConfig,
				receiveFollowRequest: notificationRecieveConfig,
			},
		},
		emailNotificationTypes: {
			type: 'array',
			nullable: false, optional: false,
			items: {
				type: 'string',
				nullable: false, optional: false,
			},
		},
		achievements: {
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
					unlockedAt: {
						type: 'number',
						nullable: false, optional: false,
					},
				},
			},
		},
		loggedInDays: {
			type: 'number',
			nullable: false, optional: false,
		},
		policies: {
			type: 'object',
			nullable: false, optional: false,
			properties: {
				gtlAvailable: {
					type: 'boolean',
					nullable: false, optional: false,
				},
				ltlAvailable: {
					type: 'boolean',
					nullable: false, optional: false,
				},
				canPublicNote: {
					type: 'boolean',
					nullable: false, optional: false,
				},
				canInvite: {
					type: 'boolean',
					nullable: false, optional: false,
				},
				inviteLimit: {
					type: 'number',
					nullable: false, optional: false,
				},
				inviteLimitCycle: {
					type: 'number',
					nullable: false, optional: false,
				},
				inviteExpirationTime: {
					type: 'number',
					nullable: false, optional: false,
				},
				canManageCustomEmojis: {
					type: 'boolean',
					nullable: false, optional: false,
				},
				canManageAvatarDecorations: {
					type: 'boolean',
					nullable: false, optional: false,
				},
				canSearchNotes: {
					type: 'boolean',
					nullable: false, optional: false,
				},
				canUseTranslator: {
					type: 'boolean',
					nullable: false, optional: false,
				},
				canHideAds: {
					type: 'boolean',
					nullable: false, optional: false,
				},
				driveCapacityMb: {
					type: 'number',
					nullable: false, optional: false,
				},
				alwaysMarkNsfw: {
					type: 'boolean',
					nullable: false, optional: false,
				},
				pinLimit: {
					type: 'number',
					nullable: false, optional: false,
				},
				antennaLimit: {
					type: 'number',
					nullable: false, optional: false,
				},
				wordMuteLimit: {
					type: 'number',
					nullable: false, optional: false,
				},
				webhookLimit: {
					type: 'number',
					nullable: false, optional: false,
				},
				clipLimit: {
					type: 'number',
					nullable: false, optional: false,
				},
				noteEachClipsLimit: {
					type: 'number',
					nullable: false, optional: false,
				},
				userListLimit: {
					type: 'number',
					nullable: false, optional: false,
				},
				userEachUserListsLimit: {
					type: 'number',
					nullable: false, optional: false,
				},
				rateLimitFactor: {
					type: 'number',
					nullable: false, optional: false,
				},
				avatarDecorationLimit: {
					type: 'number',
					nullable: false, optional: false,
				},
			},
		},
		//#region secrets
		email: {
			type: 'string',
			nullable: true, optional: true,
		},
		emailVerified: {
			type: 'boolean',
			nullable: true, optional: true,
		},
		securityKeysList: {
			type: 'array',
			nullable: false, optional: true,
			items: {
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
						nullable: false, optional: false,
					},
					lastUsed: {
						type: 'string',
						nullable: false, optional: false,
						format: 'date-time',
					},
				},
			},
		},
		//#endregion
	},
} as const;

export const packedUserDetailedNotMeSchema = {
	type: 'object',
	allOf: [
		{
			type: 'object',
			ref: 'UserLite',
		},
		{
			type: 'object',
			ref: 'UserDetailedNotMeOnly',
		},
	],
} as const;

export const packedMeDetailedSchema = {
	type: 'object',
	allOf: [
		{
			type: 'object',
			ref: 'UserLite',
		},
		{
			type: 'object',
			ref: 'UserDetailedNotMeOnly',
		},
		{
			type: 'object',
			ref: 'MeDetailedOnly',
		},
	],
} as const;

export const packedUserDetailedSchema = {
	oneOf: [
		{
			type: 'object',
			ref: 'UserDetailedNotMe',
		},
		{
			type: 'object',
			ref: 'MeDetailed',
		},
	],
} as const;

export const packedUserSchema = {
	oneOf: [
		{
			type: 'object',
			ref: 'UserLite',
		},
		{
			type: 'object',
			ref: 'UserDetailed',
		},
		{
			type: 'object',
			ref: 'UserDetailedNotMe',
		},
		{
			type: 'object',
			ref: 'MeDetailed',
		},
	],
} as const;
