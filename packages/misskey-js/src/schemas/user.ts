import type { JSONSchema7, JSONSchema7Definition } from 'schema-type';

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

	type: 'object',
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
	$id: 'https://misskey-hub.net/api/schemas/MeDetailedOnly',

	type: 'object',
	oneOf: [{
		$ref: '#/$defs/base',
	}, {
		allOf: [{ $ref: '#/$defs/base' }, { $ref: '#/$defs/secrets' }],
	}],
	$defs: {
		base: {
			type: 'object',
			properties: {
				avatarId: {
					oneOf: [{
						$ref: 'https://misskey-hub.net/api/schemas/Id',
					}, {
						type: 'null',
					}],
				},
				bannerId: {
					oneOf: [{
						$ref: 'https://misskey-hub.net/api/schemas/Id',
					}, {
						type: 'null',
					}],
				},
				injectFeaturedNote: {
					type: ['boolean', 'null'],
				},
				receiveAnnouncementEmail: {
					type: ['boolean', 'null'],
				},
				alwaysMarkNsfw: {
					type: ['boolean', 'null'],
				},
				autoSensitive: {
					type: ['boolean', 'null'],
				},
				carefulBot: {
					type: ['boolean', 'null'],
				},
				autoAcceptFollowed: {
					type: ['boolean', 'null'],
				},
				noCrawle: {
					type: ['boolean', 'null'],
				},
				preventAiLarning: {
					type: 'boolean',
				},
				isExplorable: {
					type: 'boolean',
				},
				isDeleted: {
					type: 'boolean',
				},
				hideOnlineStatus: {
					type: 'boolean',
				},
				hasUnreadSpecifiedNotes: {
					type: 'boolean',
				},
				hasUnreadMentions: {
					type: 'boolean',
				},
				hasUnreadAnnouncement: {
					type: 'boolean',
				},
				hasUnreadAntenna: {
					type: 'boolean',
				},
				hasUnreadNotification: {
					type: 'boolean',
				},
				hasPendingReceivedFollowRequest: {
					type: 'boolean',
				},
				mutedWords: {
					type: 'array',
					items: {
						type: 'array',
						items: {
							type: 'string',
						},
					},
				},
				mutedInstances: {
					oneOf: [{
						type: 'array',
						items: {
							type: 'string',
						},
					}, {
						type: 'null',
					}],
				},
				mutingNotificationTypes: {
					oneOf: [{
						type: 'array',
						items: {
							type: 'string',
						},
					}, {
						type: 'null',
					}],
				},
				emailNotificationTypes: {
					oneOf: [{
						type: 'array',
						items: {
							type: 'string',
						},
					}, {
						type: 'null',
					}],
				},
			},
		},
		secrets: {
			type: 'object',
			properties: {
				email: {
					type: ['string', 'null'],
				},
				emailVerified: {
					type: ['boolean', 'null'],
				},
				securityKeysList: {
					type: 'array',
					items: {
						type: 'object',
						additionalProperties: true,
					},
				},
			},
			required: [
				'email',
				'emailVerified',
				'securityKeysList',
			],
		},
	},
} as const satisfies JSONSchema7Definition;

export const packedUserDetailedNotMeSchema = {
	$id: 'https://misskey-hub.net/api/schemas/UserDetailedNotMe',

	type: 'object',
	allOf: [{
		$ref: 'https://misskey-hub.net/api/schemas/UserLite',
	}, {
		$ref: 'https://misskey-hub.net/api/schemas/UserDetailedNotMeOnly',
	}],
} as const satisfies JSONSchema7Definition;

export const packedMeDetailedSchema = {
	$id: 'https://misskey-hub.net/api/schemas/MeDetailed',

	type: 'object',
	allOf: [{
		$ref: 'https://misskey-hub.net/api/schemas/UserLite',
	}, {
		$ref: 'https://misskey-hub.net/api/schemas/UserDetailedNotMeOnly',
	}, {
		$ref: 'https://misskey-hub.net/api/schemas/MeDetailedOnly',
	}],
} as const satisfies JSONSchema7Definition;

export const packedUserDetailedSchema = {
	$id: 'https://misskey-hub.net/api/schemas/UserDetailed',

	type: 'object',
	oneOf: [{
		$ref: 'https://misskey-hub.net/api/schemas/UserDetailedNotMe',
	}, {
		$ref: 'https://misskey-hub.net/api/schemas/MeDetailed',
	}],
} as const satisfies JSONSchema7Definition;

export const packedUserSchema = {
	$id: 'https://misskey-hub.net/api/schemas/User',

	type: 'object',
	oneOf: [{
		$ref: 'https://misskey-hub.net/api/schemas/UserLite',
	}, {
		$ref: 'https://misskey-hub.net/api/schemas/UserDetailed',
	}],
} as const satisfies JSONSchema7Definition;

export const localUsernameSchema = { type: 'string', pattern: /^\w{1,20}$/.toString().slice(1, -1) } as const satisfies JSONSchema7;
export const passwordSchema = { type: 'string', minLength: 1 } as const satisfies JSONSchema7;
export const nameSchema = { type: 'string', minLength: 1, maxLength: 50 } as const satisfies JSONSchema7;
export const descriptionSchema = { type: 'string', minLength: 1, maxLength: 1500 } as const satisfies JSONSchema7;
export const locationSchema = { type: 'string', minLength: 1, maxLength: 50 } as const satisfies JSONSchema7;
export const birthdaySchema = { type: 'string', pattern: /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.toString().slice(1, -1) } as const satisfies JSONSchema7;
