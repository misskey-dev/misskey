/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { packedAnnouncementSchema } from '@/models/schema/announcement.js';
import { packedNoteSchema } from '@/models/schema/note.js';
import { packedPageSchema } from '@/models/schema/page.js';
import { packedRoleLiteSchema, packedRolePoliciesSchema } from '@/models/schema/role.js';
import { packedAchievementSchema } from '@/models/schema/achievement.js';

/**
 * 通知の受信条件 (legacy `notificationRecieveConfig`)。
 *
 * 判別キー `type` を持つ oneOf なので `v.variant` (cookbook R10)。
 */
export const notificationRecieveConfigSchema = v.variant('type', [
	v.object({
		type: v.picklist(['all', 'following', 'follower', 'mutualFollow', 'followingOrFollower', 'never']),
	}),
	v.object({
		type: v.literal('list'),
		userListId: mi.misskeyId(),
	}),
]);

// NOTE: user.ts ↔ note.ts / page.ts / drive-file.ts は ESM の循環 import になるため、
// この SCC を跨ぐ entity 参照は必ず `v.lazy()` 経由にする (どのモジュールから評価が
// 始まっても TDZ にならないようにするため)。announcement.ts は循環しないので直接参照。

export const packedUserLiteSchema = v.object({
	id: mi.example(mi.idString(), 'xxxxxxxxxx'),
	name: mi.example(v.nullable(v.string()), '藍'),
	username: mi.example(v.string(), 'ai'),
	host: v.pipe(
		v.nullable(v.string()),
		mi.example('misskey.example.com'),
		v.description('The local host is represented with `null`.'),
	),
	avatarUrl: mi.urlString(),
	avatarBlurhash: v.nullable(v.string()),
	avatarDecorations: v.array(v.object({
		id: mi.idString(),
		angle: v.optional(v.number()),
		flipH: v.optional(v.boolean()),
		url: mi.urlString(),
		offsetX: v.optional(v.number()),
		offsetY: v.optional(v.number()),
	})),
	isBot: v.optional(v.boolean()),
	isCat: v.optional(v.boolean()),
	requireSigninToViewContents: v.optional(v.boolean()),
	makeNotesFollowersOnlyBefore: v.nullish(v.number()),
	makeNotesHiddenBefore: v.nullish(v.number()),
	instance: v.optional(v.object({
		name: v.nullable(v.string()),
		softwareName: v.nullable(v.string()),
		softwareVersion: v.nullable(v.string()),
		iconUrl: v.nullable(v.string()),
		faviconUrl: v.nullable(v.string()),
		themeColor: v.nullable(v.string()),
	})),
	emojis: v.record(v.string(), v.string()),
	onlineStatus: v.picklist(['unknown', 'online', 'active', 'offline']),
	badgeRoles: v.optional(v.array(v.object({
		name: v.string(),
		iconUrl: v.nullable(v.string()),
		displayOrder: v.number(),
	}))),
});
mi.defineEntity('UserLite', packedUserLiteSchema);

export type PackedUserLite = v.InferOutput<typeof packedUserLiteSchema>;

export const packedUserDetailedNotMeOnlySchema = v.object({
	url: v.nullable(mi.urlString()),
	uri: v.nullable(v.pipe(v.string(), mi.format('uri'))),
	movedTo: v.nullable(v.pipe(v.string(), mi.format('uri'))),
	alsoKnownAs: v.nullable(v.array(mi.idString())),
	createdAt: mi.dateTimeString(),
	updatedAt: v.nullable(mi.dateTimeString()),
	lastFetchedAt: v.nullable(mi.dateTimeString()),
	bannerUrl: v.nullable(mi.urlString()),
	bannerBlurhash: v.nullable(v.string()),
	isLocked: v.boolean(),
	isSilenced: v.boolean(),
	isSuspended: mi.example(v.boolean(), false),
	description: mi.example(v.nullable(v.string()), 'Hi masters, I am Ai!'),
	location: v.nullable(v.string()),
	birthday: mi.example(v.nullable(v.string()), '2018-03-12'),
	lang: mi.example(v.nullable(v.string()), 'ja-JP'),
	fields: v.pipe(v.array(v.object({
		name: v.string(),
		value: v.string(),
	})), v.maxLength(16)),
	verifiedLinks: v.array(mi.urlString()),
	followersCount: v.number(),
	followingCount: v.number(),
	notesCount: v.number(),
	pinnedNoteIds: v.array(mi.idString()),
	pinnedNotes: v.array(v.lazy(() => packedNoteSchema)),
	pinnedPageId: v.nullable(v.string()),
	pinnedPage: v.nullable(v.lazy(() => packedPageSchema)),
	publicReactions: v.boolean(),
	followingVisibility: v.picklist(['public', 'followers', 'private']),
	followersVisibility: v.picklist(['public', 'followers', 'private']),
	chatScope: v.picklist(['everyone', 'following', 'followers', 'mutual', 'none']),
	canChat: v.boolean(),
	roles: v.array(packedRoleLiteSchema),
	followedMessage: v.nullish(v.string()),
	memo: v.nullable(v.string()),
	moderationNote: v.optional(v.string()),
	twoFactorEnabled: v.optional(v.boolean()),
	usePasswordLessLogin: v.optional(v.boolean()),
	securityKeys: v.optional(v.boolean()),
	//#region relations
	isFollowing: v.optional(v.boolean()),
	isFollowed: v.optional(v.boolean()),
	hasPendingFollowRequestFromYou: v.optional(v.boolean()),
	hasPendingFollowRequestToYou: v.optional(v.boolean()),
	isBlocking: v.optional(v.boolean()),
	isBlocked: v.optional(v.boolean()),
	isMuted: v.optional(v.boolean()),
	isRenoteMuted: v.optional(v.boolean()),
	notify: v.optional(v.picklist(['normal', 'none'])),
	withReplies: v.optional(v.boolean()),
	//#endregion
});
mi.defineEntity('UserDetailedNotMeOnly', packedUserDetailedNotMeOnlySchema);

export type PackedUserDetailedNotMeOnly = v.InferOutput<typeof packedUserDetailedNotMeOnlySchema>;

export const packedMeDetailedOnlySchema = v.object({
	avatarId: v.nullable(mi.idString()),
	bannerId: v.nullable(mi.idString()),
	followedMessage: v.nullable(v.string()),
	isModerator: v.boolean(),
	isAdmin: v.boolean(),
	injectFeaturedNote: v.boolean(),
	receiveAnnouncementEmail: v.boolean(),
	alwaysMarkNsfw: v.boolean(),
	autoSensitive: v.boolean(),
	carefulBot: v.boolean(),
	autoAcceptFollowed: v.boolean(),
	noCrawle: v.boolean(),
	preventAiLearning: v.boolean(),
	isExplorable: v.boolean(),
	isDeleted: v.boolean(),
	twoFactorBackupCodesStock: v.picklist(['full', 'partial', 'none']),
	hideOnlineStatus: v.boolean(),
	hasUnreadSpecifiedNotes: v.boolean(),
	hasUnreadMentions: v.boolean(),
	hasUnreadAnnouncement: v.boolean(),
	unreadAnnouncements: v.array(packedAnnouncementSchema),
	hasUnreadAntenna: v.boolean(),
	hasUnreadChannel: v.boolean(),
	hasUnreadChatMessages: v.boolean(),
	hasUnreadNotification: v.boolean(),
	hasPendingReceivedFollowRequest: v.boolean(),
	unreadNotificationsCount: v.number(),
	mutedWords: v.array(v.array(v.string())),
	hardMutedWords: v.array(v.array(v.string())),
	mutedInstances: v.array(v.string()),
	notificationRecieveConfig: v.object({
		note: v.optional(notificationRecieveConfigSchema),
		follow: v.optional(notificationRecieveConfigSchema),
		mention: v.optional(notificationRecieveConfigSchema),
		reply: v.optional(notificationRecieveConfigSchema),
		renote: v.optional(notificationRecieveConfigSchema),
		quote: v.optional(notificationRecieveConfigSchema),
		reaction: v.optional(notificationRecieveConfigSchema),
		pollEnded: v.optional(notificationRecieveConfigSchema),
		scheduledNotePosted: v.optional(notificationRecieveConfigSchema),
		scheduledNotePostFailed: v.optional(notificationRecieveConfigSchema),
		receiveFollowRequest: v.optional(notificationRecieveConfigSchema),
		followRequestAccepted: v.optional(notificationRecieveConfigSchema),
		roleAssigned: v.optional(notificationRecieveConfigSchema),
		chatRoomInvitationReceived: v.optional(notificationRecieveConfigSchema),
		achievementEarned: v.optional(notificationRecieveConfigSchema),
		app: v.optional(notificationRecieveConfigSchema),
		test: v.optional(notificationRecieveConfigSchema),
		login: v.optional(notificationRecieveConfigSchema),
		createToken: v.optional(notificationRecieveConfigSchema),
		exportCompleted: v.optional(notificationRecieveConfigSchema),
	}),
	emailNotificationTypes: v.array(v.string()),
	achievements: v.array(packedAchievementSchema),
	loggedInDays: v.number(),
	policies: packedRolePoliciesSchema,
	// NOTE: legacy 側は `optional: false` かつ `default` 付き (= required のまま default を出す)
	// なので `v.optional()` では包まず openApi() で default だけを出力する
	twoFactorEnabled: v.pipe(v.boolean(), mi.openApi({ default: false })),
	usePasswordLessLogin: v.pipe(v.boolean(), mi.openApi({ default: false })),
	securityKeys: v.pipe(v.boolean(), mi.openApi({ default: false })),
	//#region secrets
	email: v.nullish(v.string()),
	emailVerified: v.nullish(v.boolean()),
	securityKeysList: v.optional(v.array(v.object({
		id: mi.example(mi.idString(), 'xxxxxxxxxx'),
		name: v.string(),
		lastUsed: mi.dateTimeString(),
	}))),
	//#endregion
});
mi.defineEntity('MeDetailedOnly', packedMeDetailedOnlySchema);

export type PackedMeDetailedOnly = v.InferOutput<typeof packedMeDetailedOnlySchema>;

/**
 * 合成 entity (`allOf`) の公開型を作る。
 *
 * `infer` を挟んだ union → intersection 変換で、TypeScript の
 * 「型のインスタンス化が深すぎる (TS2589)」判定を回避する
 * (misskey#8535 と同じ手法。素の `A & B & C` で書くと `UserEntityService.packMany` のように
 * ジェネリクス越しに合成型を展開する箇所で TS2589 になる)。
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MergeParts<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

// NOTE: 合成 entity の公開型は `v.InferOutput<typeof ...>` (= composeEntity の
// Flatten<MergeTuple<...>>) ではなく上記の交差型で書く (legacy の `allOf` 型と同形)。
export const packedUserDetailedNotMeSchema = mi.composeEntity('UserDetailedNotMe', [
	packedUserLiteSchema,
	packedUserDetailedNotMeOnlySchema,
]);

export type PackedUserDetailedNotMe = MergeParts<PackedUserLite | PackedUserDetailedNotMeOnly>;

export const packedMeDetailedSchema = mi.composeEntity('MeDetailed', [
	packedUserLiteSchema,
	packedUserDetailedNotMeOnlySchema,
	packedMeDetailedOnlySchema,
]);

export type PackedMeDetailed = MergeParts<PackedUserLite | PackedUserDetailedNotMeOnly | PackedMeDetailedOnly>;

export const packedUserDetailedSchema = v.pipe(
	v.union([packedUserDetailedNotMeSchema, packedMeDetailedSchema]),
	mi.asOneOf(),
);
mi.defineEntity('UserDetailed', packedUserDetailedSchema);

// NOTE: `v.InferOutput<typeof packedUserDetailedSchema>` にすると composeEntity の推論
// (Flatten<MergeTuple<...>>) を展開してしまい TS2589 の原因になるので、legacy の
// `UnionSchemaType<oneOf>` と同じく合成済みの公開型の union で書く
export type PackedUserDetailed = PackedUserDetailedNotMe | PackedMeDetailed;

export const packedUserSchema = v.pipe(
	v.union([packedUserLiteSchema, packedUserDetailedSchema]),
	mi.asOneOf(),
);
mi.defineEntity('User', packedUserSchema);

export type PackedUser = PackedUserLite | PackedUserDetailed;
