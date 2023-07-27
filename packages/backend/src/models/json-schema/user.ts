/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

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
		onlineStatus: {
			type: 'string',
			format: 'url',
			nullable: true, optional: false,
			enum: ['unknown', 'online', 'active', 'offline'],
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
		movedToUri: {
			type: 'string',
			format: 'uri',
			nullable: true,
			optional: false,
		},
		alsoKnownAs: {
			type: 'array',
			nullable: true,
			optional: false,
			items: {
				type: 'string',
				format: 'id',
				nullable: false,
				optional: false,
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
		memo: {
			type: 'string',
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
		injectFeaturedNote: {
			type: 'boolean',
			nullable: true, optional: false,
		},
		receiveAnnouncementEmail: {
			type: 'boolean',
			nullable: true, optional: false,
		},
		alwaysMarkNsfw: {
			type: 'boolean',
			nullable: true, optional: false,
		},
		autoSensitive: {
			type: 'boolean',
			nullable: true, optional: false,
		},
		carefulBot: {
			type: 'boolean',
			nullable: true, optional: false,
		},
		autoAcceptFollowed: {
			type: 'boolean',
			nullable: true, optional: false,
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
		hasUnreadAntenna: {
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
		mutedInstances: {
			type: 'array',
			nullable: true, optional: false,
			items: {
				type: 'string',
				nullable: false, optional: false,
			},
		},
		mutingNotificationTypes: {
			type: 'array',
			nullable: true, optional: false,
			items: {
				type: 'string',
				nullable: false, optional: false,
			},
		},
		emailNotificationTypes: {
			type: 'array',
			nullable: true, optional: false,
			items: {
				type: 'string',
				nullable: false, optional: false,
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
	],
} as const;
