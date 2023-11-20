/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * note - 通知オンにしているユーザーが投稿した
 * follow - フォローされた
 * mention - 投稿で自分が言及された
 * reply - 投稿に返信された
 * renote - 投稿がRenoteされた
 * quote - 投稿が引用Renoteされた
 * reaction - 投稿にリアクションされた
 * pollEnded - 自分のアンケートもしくは自分が投票したアンケートが終了した
 * receiveFollowRequest - フォローリクエストされた
 * followRequestAccepted - 自分の送ったフォローリクエストが承認された
 * achievementEarned - 実績を獲得
 * app - アプリ通知
 * test - テスト通知（サーバー側）
 */
export const notificationTypes = ['note', 'follow', 'mention', 'reply', 'renote', 'quote', 'reaction', 'pollEnded', 'receiveFollowRequest', 'followRequestAccepted', 'achievementEarned', 'app', 'test'] as const;
export const obsoleteNotificationTypes = ['pollVote', 'groupInvited'] as const;

export const noteVisibilities = ['public', 'home', 'followers', 'specified'] as const;

export const mutedNoteReasons = ['word', 'manual', 'spam', 'other'] as const;

export const ffVisibility = ['public', 'followers', 'private'] as const;

export const moderationLogTypes = [
	'updateServerSettings',
	'suspend',
	'unsuspend',
	'updateUserNote',
	'addCustomEmoji',
	'updateCustomEmoji',
	'deleteCustomEmoji',
	'assignRole',
	'unassignRole',
	'createRole',
	'updateRole',
	'deleteRole',
	'clearQueue',
	'promoteQueue',
	'deleteDriveFile',
	'deleteNote',
	'createGlobalAnnouncement',
	'createUserAnnouncement',
	'updateGlobalAnnouncement',
	'updateUserAnnouncement',
	'deleteGlobalAnnouncement',
	'deleteUserAnnouncement',
	'resetPassword',
	'suspendRemoteInstance',
	'unsuspendRemoteInstance',
	'markSensitiveDriveFile',
	'unmarkSensitiveDriveFile',
	'resolveAbuseReport',
	'createInvitation',
	'createAd',
	'updateAd',
	'deleteAd',
	'createAvatarDecoration',
	'updateAvatarDecoration',
	'deleteAvatarDecoration',
] as const;

export type ModerationLogPayloads = {
	updateServerSettings: {
		before: any | null;
		after: any | null;
	};
	suspend: {
		userId: string;
		userUsername: string;
		userHost: string | null;
	};
	unsuspend: {
		userId: string;
		userUsername: string;
		userHost: string | null;
	};
	updateUserNote: {
		userId: string;
		userUsername: string;
		userHost: string | null;
		before: string | null;
		after: string | null;
	};
	addCustomEmoji: {
		emojiId: string;
		emoji: any;
	};
	updateCustomEmoji: {
		emojiId: string;
		before: any;
		after: any;
	};
	deleteCustomEmoji: {
		emojiId: string;
		emoji: any;
	};
	assignRole: {
		userId: string;
		userUsername: string;
		userHost: string | null;
		roleId: string;
		roleName: string;
		expiresAt: string | null;
	};
	unassignRole: {
		userId: string;
		userUsername: string;
		userHost: string | null;
		roleId: string;
		roleName: string;
	};
	createRole: {
		roleId: string;
		role: any;
	};
	updateRole: {
		roleId: string;
		before: any;
		after: any;
	};
	deleteRole: {
		roleId: string;
		role: any;
	};
	clearQueue: Record<string, never>;
	promoteQueue: Record<string, never>;
	deleteDriveFile: {
		fileId: string;
		fileUserId: string | null;
		fileUserUsername: string | null;
		fileUserHost: string | null;
	};
	deleteNote: {
		noteId: string;
		noteUserId: string;
		noteUserUsername: string;
		noteUserHost: string | null;
		note: any;
	};
	createGlobalAnnouncement: {
		announcementId: string;
		announcement: any;
	};
	createUserAnnouncement: {
		announcementId: string;
		announcement: any;
		userId: string;
		userUsername: string;
		userHost: string | null;
	};
	updateGlobalAnnouncement: {
		announcementId: string;
		before: any;
		after: any;
	};
	updateUserAnnouncement: {
		announcementId: string;
		before: any;
		after: any;
		userId: string;
		userUsername: string;
		userHost: string | null;
	};
	deleteGlobalAnnouncement: {
		announcementId: string;
		announcement: any;
	};
	deleteUserAnnouncement: {
		announcementId: string;
		announcement: any;
		userId: string;
		userUsername: string;
		userHost: string | null;
	};
	resetPassword: {
		userId: string;
		userUsername: string;
		userHost: string | null;
	};
	suspendRemoteInstance: {
		id: string;
		host: string;
	};
	unsuspendRemoteInstance: {
		id: string;
		host: string;
	};
	markSensitiveDriveFile: {
		fileId: string;
		fileUserId: string | null;
		fileUserUsername: string | null;
		fileUserHost: string | null;
	};
	unmarkSensitiveDriveFile: {
		fileId: string;
		fileUserId: string | null;
		fileUserUsername: string | null;
		fileUserHost: string | null;
	};
	resolveAbuseReport: {
		reportId: string;
		report: any;
		forwarded: boolean;
	};
	createInvitation: {
		invitations: any[];
	};
	createAd: {
		adId: string;
		ad: any;
	};
	updateAd: {
		adId: string;
		before: any;
		after: any;
	};
	deleteAd: {
		adId: string;
		ad: any;
	};
	createAvatarDecoration: {
		avatarDecorationId: string;
		avatarDecoration: any;
	};
	updateAvatarDecoration: {
		avatarDecorationId: string;
		before: any;
		after: any;
	};
	deleteAvatarDecoration: {
		avatarDecorationId: string;
		avatarDecoration: any;
	};
};

export type Serialized<T> = {
	[K in keyof T]:
		T[K] extends Date
			? string
			: T[K] extends (Date | null)
				? (string | null)
				: T[K] extends Record<string, any>
					? Serialized<T[K]>
					: T[K];
};

export type FilterUnionByProperty<
  Union,
  Property extends string | number | symbol,
  Condition
> = Union extends Record<Property, Condition> ? Union : never;
