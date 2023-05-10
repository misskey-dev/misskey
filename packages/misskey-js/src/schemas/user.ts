import type { JSONSchema7Definition } from 'schema-type';

export const packedUserLiteSchema = {
	$id: 'https://misskey-hub.net/api/schemas/UserLite',

	type: 'object',
	properties: {
		id: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
		name: {
			type: ['string', 'null'],
			examples: '藍',
		},
		username: {
			type: 'string',
			examples: 'ai',
		},
		host: {
			type: ['string', 'null'],
			examples: 'misskey.example.com',
			description: 'The local host is represented with `null`.',
		},
		avatarUrl: {
			oneOf: [{
				type: 'string',
				format: 'url',
			}, {
				type: 'null',
			}],
		},
		avatarBlurhash: {
			type: ['string', 'null'],
		},
		isAdmin: {
			type: 'boolean',
			default: false,
		},
		isModerator: {
			type: 'boolean',
			default: false,
		},
		isBot: {
			type: 'boolean',
		},
		isCat: {
			type: 'boolean',
		},
		onlineStatus: {
			type: ['string', 'null'],
			enum: ['unknown', 'online', 'active', 'offline', null],
		},
	},
	required: [
		'id',
		'name',
		'username',
		'host',
		'avatarUrl',
		'avatarBlurhash',
		'onlineStatus',
	],
} as const satisfies JSONSchema7Definition;

export const packedUserDetailedNotMeOnlySchema = {
	$id: 'https://misskey-hub.net/api/schemas/UserDetailedNotMeOnly',

	oneOf: [{
		$ref: '#/$defs/base',
	}, {
		allOf: [{ $ref: '#/$defs/base', }, { $ref: '#/$defs/relations' }],
	}],
	$defs: {
		base: {
			type: 'object',
			properties: {
				url: {
					oneOf: [{
						type: 'string',
						format: 'url',
					}, {
						type: 'null',
					}],
				},
				uri: {
					oneOf: [{
						type: 'string',
						format: 'uri',
					}, {
						type: 'null',
					}],
				},
				movedToUri: {
					oneOf: [{
						type: 'string',
						format: 'uri',
					}, {
						type: 'null',
					}],
				},
				alsoKnownAs: {
					oneOf: [{
						type: 'array',
						items: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
					}, {
						type: 'null',
					}],
				},
				createdAt: {
					type: 'string',
					format: 'date-time',
				},
				updatedAt: {
					oneOf: [{
						type: 'string',
						format: 'date-time',
					}, {
						type: 'null',
					}],
				},
				lastFetchedAt: {
					oneOf: [{
						type: 'string',
						format: 'date-time',
					}, {
						type: 'null',
					}],
				},
				bannerUrl: {
					oneOf: [{
						type: 'string',
						format: 'url',
					}, {
						type: 'null',
					}],
				},
				bannerBlurhash: {
					type: ['string', 'null'],
				},
				isLocked: {
					type: 'boolean',
				},
				isSilenced: {
					type: 'boolean',
				},
				isSuspended: {
					type: 'boolean',
					examples: false,
				},
				description: {
					type: ['string', 'null'],
					examples: 'Hi masters, I am Ai!',
				},
				location: {
					type: ['string', 'null'],
				},
				birthday: {
					type: ['string', 'null'],
					examples: '2018-03-12',
				},
				lang: {
					type: ['string', 'null'],
					examples: 'ja-JP',
				},
				fields: {
					type: 'array',
					maxLength: 4,
					items: {
						type: 'object',
						properties: {
							name: {
								type: 'string',
							},
							value: {
								type: 'string',
							},
						},
						required: ['name', 'value'],
					},
				},
				followersCount: {
					type: 'number',
				},
				followingCount: {
					type: 'number',
				},
				notesCount: {
					type: 'number',
				},
				pinnedNoteIds: {
					type: 'array',
					items: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
				},
				pinnedNotes: {
					type: 'array',
					items: { $ref: 'https://misskey-hub.net/api/schemas/Note' },
				},
				pinnedPageId: {
					type: ['string', 'null'],
				},
				pinnedPage: {
					oneOf: [{
						$ref: 'https://misskey-hub.net/api/schemas/Page',
					}, {
						type: 'null',
					}],
				},
				publicReactions: {
					type: 'boolean',
				},
				twoFactorEnabled: {
					type: 'boolean',
					default: false,
				},
				usePasswordLessLogin: {
					type: 'boolean',
					default: false,
				},
				securityKeys: {
					type: 'boolean',
					default: false,
				},
			},
			required: [
				'url',
				'uri',
				'movedToUri',
				'alsoKnownAs',
				'createdAt',
				'updatedAt',
				'lastFetchedAt',
				'bannerUrl',
				'bannerBlurhash',
				'isLocked',
				'isSilenced',
				'isSuspended',
				'description',
				'location',
				'birthday',
				'lang',
				'fields',
				'followersCount',
				'followingCount',
				'notesCount',
				'pinnedNoteIds',
				'pinnedNotes',
				'pinnedPageId',
				'pinnedPage',
				'publicReactions',
				'twoFactorEnabled',
				'usePasswordLessLogin',
				'securityKeys',
			],
		},
		relations: {
			type: 'object',
			properties: {
				isFollowing: {
					type: 'boolean',
				},
				isFollowed: {
					type: 'boolean',
				},
				hasPendingFollowRequestFromYou: {
					type: 'boolean',
				},
				hasPendingFollowRequestToYou: {
					type: 'boolean',
				},
				isBlocking: {
					type: 'boolean',
				},
				isBlocked: {
					type: 'boolean',
				},
				isMuted: {
					type: 'boolean',
				},
				isRenoteMuted: {
					type: 'boolean',
				},
				memo: {
					type: 'string',
				},
			},
			required: [
				'isFollowing',
				'isFollowed',
				'hasPendingFollowRequestFromYou',
				'hasPendingFollowRequestToYou',
				'isBlocking',
				'isBlocked',
				'isMuted',
				'isRenoteMuted',
				'memo',
			],
		},
	},
} as const satisfies JSONSchema7Definition;

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
			nullable: true, optional: false,
		},
		preventAiLarning: {
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

export const localUsernameSchema = { type: 'string', pattern: /^\w{1,20}$/.toString().slice(1, -1) } as const;
export const passwordSchema = { type: 'string', minLength: 1 } as const;
export const nameSchema = { type: 'string', minLength: 1, maxLength: 50 } as const;
export const descriptionSchema = { type: 'string', minLength: 1, maxLength: 1500 } as const;
export const locationSchema = { type: 'string', minLength: 1, maxLength: 50 } as const;
export const birthdaySchema = { type: 'string', pattern: /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.toString().slice(1, -1) } as const;
