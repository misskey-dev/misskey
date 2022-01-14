import { Obj } from "@/misc/schema";

const packedUserLiteProps: Obj = {
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
	onlineStatus: {
		type: 'string' as const,
		format: 'url',
		nullable: true as const, optional: false as const,
		enum: ['unknown', 'online', 'active', 'offline'],
	},
};

const packedUserDetailedProps: Obj = {
	url: {
		type: 'string' as const,
		format: 'url',
		nullable: true as const, optional: false as const,
	},
	uri: {
		type: 'string' as const,
		format: 'uri',
		nullable: true as const, optional: false as const,
	},
	createdAt: {
		type: 'string' as const,
		nullable: false as const, optional: false as const,
		format: 'date-time',
	},
	updatedAt: {
		type: 'string' as const,
		nullable: true as const, optional: false as const,
		format: 'date-time',
	},
	lastFetchedAt: {
		type: 'string' as const,
		nullable: true as const, optional: false as const,
		format: 'date-time',
	},
	bannerUrl: {
		type: 'string' as const,
		format: 'url',
		nullable: true as const, optional: false as const,
	},
	bannerBlurhash: {
		type: 'any' as const,
		nullable: true as const, optional: false as const,
	},
	bannerColor: {
		type: 'any' as const,
		nullable: true as const, optional: false as const,
		default: null,
	},
	isLocked: {
		type: 'boolean' as const,
		nullable: false as const, optional: false as const,
	},
	isSilenced: {
		type: 'boolean' as const,
		nullable: false as const, optional: false as const,
	},
	isSuspended: {
		type: 'boolean' as const,
		nullable: false as const, optional: false as const,
		example: false,
	},
	description: {
		type: 'string' as const,
		nullable: true as const, optional: false as const,
		example: 'Hi masters, I am Ai!',
	},
	location: {
		type: 'string' as const,
		nullable: true as const, optional: false as const,
	},
	birthday: {
		type: 'string' as const,
		nullable: true as const, optional: false as const,
		example: '2018-03-12',
	},
	lang: {
		type: 'string' as const,
		nullable: true as const, optional: false as const,
		example: 'ja-JP',
	},
	fields: {
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
		nullable: false as const, optional: false as const,
	},
	followingCount: {
		type: 'number' as const,
		nullable: false as const, optional: false as const,
	},
	notesCount: {
		type: 'number' as const,
		nullable: false as const, optional: false as const,
	},
	pinnedNoteIds: {
		type: 'array' as const,
		nullable: false as const, optional: false as const,
		items: {
			type: 'string' as const,
			nullable: false as const, optional: false as const,
			format: 'id',
		},
	},
	pinnedNotes: {
		type: 'array' as const,
		nullable: false as const, optional: false as const,
		items: {
			type: 'object' as const,
			nullable: false as const, optional: false as const,
			ref: 'Note' as const,
		},
	},
	pinnedPageId: {
		type: 'string' as const,
		nullable: true as const, optional: false as const,
	},
	pinnedPage: {
		type: 'object' as const,
		nullable: true as const, optional: false as const,
		ref: 'Page' as const,
	},
	publicReactions: {
		type: 'boolean' as const,
		nullable: false as const, optional: false as const,
	},
	twoFactorEnabled: {
		type: 'boolean' as const,
		nullable: false as const, optional: false as const,
		default: false,
	},
	usePasswordLessLogin: {
		type: 'boolean' as const,
		nullable: false as const, optional: false as const,
		default: false,
	},
	securityKeys: {
		type: 'boolean' as const,
		nullable: false as const, optional: false as const,
		default: false,
	},
	//#region relations
	isFollowing: {
		type: 'boolean' as const,
		nullable: false as const, optional: true as const,
	},
	isFollowed: {
		type: 'boolean' as const,
		nullable: false as const, optional: true as const,
	},
	hasPendingFollowRequestFromYou: {
		type: 'boolean' as const,
		nullable: false as const, optional: true as const,
	},
	hasPendingFollowRequestToYou: {
		type: 'boolean' as const,
		nullable: false as const, optional: true as const,
	},
	isBlocking: {
		type: 'boolean' as const,
		nullable: false as const, optional: true as const,
	},
	isBlocked: {
		type: 'boolean' as const,
		nullable: false as const, optional: true as const,
	},
	isMuted: {
		type: 'boolean' as const,
		nullable: false as const, optional: true as const,
	},
	//#endregion
};

const packedMeDetailedProps: Obj = {
	avatarId: {
		type: 'string' as const,
		nullable: true as const, optional: false as const,
		format: 'id',
	},
	bannerId: {
		type: 'string' as const,
		nullable: true as const, optional: false as const,
		format: 'id',
	},
	injectFeaturedNote: {
		type: 'boolean' as const,
		nullable: true as const, optional: false as const,
	},
	receiveAnnouncementEmail: {
		type: 'boolean' as const,
		nullable: true as const, optional: false as const,
	},
	alwaysMarkNsfw: {
		type: 'boolean' as const,
		nullable: true as const, optional: false as const,
	},
	carefulBot: {
		type: 'boolean' as const,
		nullable: true as const, optional: false as const,
	},
	autoAcceptFollowed: {
		type: 'boolean' as const,
		nullable: true as const, optional: false as const,
	},
	noCrawle: {
		type: 'boolean' as const,
		nullable: true as const, optional: false as const,
	},
	isExplorable: {
		type: 'boolean' as const,
		nullable: false as const, optional: false as const,
	},
	isDeleted: {
		type: 'boolean' as const,
		nullable: false as const, optional: false as const,
	},
	hideOnlineStatus: {
		type: 'boolean' as const,
		nullable: false as const, optional: false as const,
	},
	hasUnreadSpecifiedNotes: {
		type: 'boolean' as const,
		nullable: false as const, optional: false as const,
	},
	hasUnreadMentions: {
		type: 'boolean' as const,
		nullable: false as const, optional: false as const,
	},
	hasUnreadAnnouncement: {
		type: 'boolean' as const,
		nullable: false as const, optional: false as const,
	},
	hasUnreadAntenna: {
		type: 'boolean' as const,
		nullable: false as const, optional: false as const,
	},
	hasUnreadChannel: {
		type: 'boolean' as const,
		nullable: false as const, optional: false as const,
	},
	hasUnreadMessagingMessage: {
		type: 'boolean' as const,
		nullable: false as const, optional: false as const,
	},
	hasUnreadNotification: {
		type: 'boolean' as const,
		nullable: false as const, optional: false as const,
	},
	hasPendingReceivedFollowRequest: {
		type: 'boolean' as const,
		nullable: false as const, optional: false as const,
	},
	integrations: {
		type: 'object' as const,
		nullable: true as const, optional: false as const,
	},
	mutedWords: {
		type: 'array' as const,
		nullable: false as const, optional: false as const,
		items: {
			type: 'array' as const,
			nullable: false as const, optional: false as const,
			items: {
				type: 'string' as const,
				nullable: false as const, optional: false as const,
			},
		},
	},
	mutedInstances: {
		type: 'array' as const,
		nullable: true as const, optional: false as const,
		items: {
			type: 'string' as const,
			nullable: false as const, optional: false as const,
		},
	},
	mutingNotificationTypes: {
		type: 'array' as const,
		nullable: true as const, optional: false as const,
		items: {
			type: 'string' as const,
			nullable: false as const, optional: false as const,
		},
	},
	emailNotificationTypes: {
		type: 'array' as const,
		nullable: true as const, optional: false as const,
		items: {
			type: 'string' as const,
			nullable: false as const, optional: false as const,
		},
	},
	//#region secrets
	email: {
		type: 'string' as const,
		nullable: true as const, optional: true as const,
	},
	emailVerified: {
		type: 'boolean' as const,
		nullable: true as const, optional: true as const,
	},
	securityKeysList: {
		type: 'array' as const,
		nullable: false as const, optional: true as const,
		items: {
			type: 'object' as const,
			nullable: false as const, optional: false as const,
		},
	},
	//#endregion
};

function allOptional(props: Obj): Obj {
	const result: Obj = {};
	for (const key in props) {
		result[key] = {
			...props[key],
			optional: true,
		};
	}
	return props;
}

export const packedUserLiteSchema = {
	type: 'object' as const,
	nullable:false as const, optional: false as const,
	properties: packedUserLiteProps,
};

export const packedUserDetailedNotMeSchema = {
	type: 'object' as const,
	nullable:false as const, optional: false as const,
	properties: {
		...packedUserLiteProps,
		...packedUserDetailedProps,
	},
};

export const packedMeDetailedSchema = {
	type: 'object' as const,
	nullable:false as const, optional: false as const,
	properties: {
		...packedUserLiteProps,
		...packedUserDetailedProps,
		...packedMeDetailedProps,
	},
};

export const packedUserDetailedSchema = {
	type: 'object' as const,
	nullable:false as const, optional: false as const,
	properties: {
		...packedUserLiteProps,
		...packedUserDetailedProps,
		...allOptional(packedMeDetailedProps),
	},
};

export const packedUserSchema = {
	type: 'object' as const,
	nullable:false as const, optional: false as const,
	properties: {
		...packedUserLiteProps,
		...allOptional(packedUserDetailedProps),
		...allOptional(packedMeDetailedProps),
	},
};
