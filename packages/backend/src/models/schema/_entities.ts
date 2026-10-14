/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * packed entity の索引。
 *
 * 2 つの役割がある:
 *
 * 1. **登録の実行**: 各 entity モジュールを side-effect import して `mi.defineEntity()` を走らせる。
 *    entity モジュールがどこからも import されないと `components.schemas` から漏れるため、
 *    ここが「全 entity が必ず読み込まれる」ことの保証点になっている。
 * 2. **entity 名の型**: {@link PackedEntityMap} のキーが
 *    [EntityName](../../misc/schema/metadata.ts) (= `#/components/schemas/X` の `X`) の定義になる。
 *
 * **`PackedX` 型そのものはここから import しないこと。** 参照側は各 entity モジュール
 * (`@/models/schema/note.js` など) から直接 import する。このマップは entity 名の集合を
 * 型として得るためだけの索引で、型の配布経路ではない。
 */

// #region defineEntity() の副作用を実行するための side-effect import
import '@/models/schema/signin.js';
import '@/models/schema/ad.js';
import '@/models/schema/emoji.js';
import '@/models/schema/system-webhook.js';
import '@/models/schema/federation-instance.js';
import '@/models/schema/app.js';
import '@/models/schema/antenna.js';
import '@/models/schema/user-webhook.js';
import '@/models/schema/hashtag.js';
import '@/models/schema/announcement.js';
import '@/models/schema/user-list.js';
import '@/models/schema/role.js';
import '@/models/schema/achievement.js';
import '@/models/schema/user.js';
import '@/models/schema/note.js';
import '@/models/schema/notification.js';
import '@/models/schema/drive-file.js';
import '@/models/schema/drive-folder.js';
import '@/models/schema/page.js';
import '@/models/schema/channel.js';
import '@/models/schema/meta.js';
import '@/models/schema/note-draft.js';
import '@/models/schema/chat-room.js';
import '@/models/schema/chat-room-invitation.js';
import '@/models/schema/chat-room-membership.js';
import '@/models/schema/chat-message.js';
import '@/models/schema/following.js';
import '@/models/schema/blocking.js';
import '@/models/schema/muting.js';
import '@/models/schema/renote-muting.js';
import '@/models/schema/clip.js';
import '@/models/schema/note-favorite.js';
import '@/models/schema/note-reaction.js';
import '@/models/schema/flash.js';
import '@/models/schema/gallery-post.js';
import '@/models/schema/invite-code.js';
import '@/models/schema/abuse-report-notification-recipient.js';
import '@/models/schema/reversi-game.js';
import '@/models/schema/queue.js';
// #endregion

import type { PackedSignin } from '@/models/schema/signin.js';
import type { PackedAd } from '@/models/schema/ad.js';
import type { PackedEmojiSimple, PackedEmojiDetailed, PackedEmojiDetailedAdmin } from '@/models/schema/emoji.js';
import type { PackedSystemWebhook } from '@/models/schema/system-webhook.js';
import type { PackedFederationInstance } from '@/models/schema/federation-instance.js';
import type { PackedApp } from '@/models/schema/app.js';
import type { PackedAntenna } from '@/models/schema/antenna.js';
import type { PackedUserWebhook } from '@/models/schema/user-webhook.js';
import type { PackedHashtag } from '@/models/schema/hashtag.js';
import type { PackedAnnouncement } from '@/models/schema/announcement.js';
import type { PackedUserList } from '@/models/schema/user-list.js';
import type {
	PackedRoleCondFormulaLogics,
	PackedRoleCondFormulaValueNot,
	PackedRoleCondFormulaValueIsLocalOrRemote,
	PackedRoleCondFormulaValueUserSettingBoolean,
	PackedRoleCondFormulaValueAssignedRole,
	PackedRoleCondFormulaValueCreated,
	PackedRoleCondFormulaFollowersOrFollowingOrNotes,
	PackedRoleCondFormulaValue,
	PackedRoleLite,
	PackedRolePolicies,
	PackedRole,
} from '@/models/schema/role.js';
import type { PackedAchievementName, PackedAchievement } from '@/models/schema/achievement.js';
import type {
	PackedUserLite,
	PackedUserDetailedNotMeOnly,
	PackedMeDetailedOnly,
	PackedUserDetailedNotMe,
	PackedMeDetailed,
	PackedUserDetailed,
	PackedUser,
} from '@/models/schema/user.js';
import type { PackedNote } from '@/models/schema/note.js';
import type { PackedNotification } from '@/models/schema/notification.js';
import type { PackedDriveFile } from '@/models/schema/drive-file.js';
import type { PackedDriveFolder } from '@/models/schema/drive-folder.js';
import type { PackedPage, PackedPageBlock } from '@/models/schema/page.js';
import type { PackedChannel } from '@/models/schema/channel.js';
import type {
	PackedMetaLite,
	PackedMetaDetailedOnly,
	PackedMetaDetailed,
	PackedMetaClientOptions,
} from '@/models/schema/meta.js';
import type { PackedNoteDraft } from '@/models/schema/note-draft.js';
import type { PackedChatRoom } from '@/models/schema/chat-room.js';
import type { PackedChatRoomInvitation } from '@/models/schema/chat-room-invitation.js';
import type { PackedChatRoomMembership } from '@/models/schema/chat-room-membership.js';
import type {
	PackedChatMessage,
	PackedChatMessageLite,
	PackedChatMessageLiteFor1on1,
	PackedChatMessageLiteForRoom,
} from '@/models/schema/chat-message.js';
import type { PackedFollowing } from '@/models/schema/following.js';
import type { PackedBlocking } from '@/models/schema/blocking.js';
import type { PackedMuting } from '@/models/schema/muting.js';
import type { PackedRenoteMuting } from '@/models/schema/renote-muting.js';
import type { PackedClip } from '@/models/schema/clip.js';
import type { PackedNoteFavorite } from '@/models/schema/note-favorite.js';
import type { PackedNoteReaction, PackedNoteReactionWithNote } from '@/models/schema/note-reaction.js';
import type { PackedFlash } from '@/models/schema/flash.js';
import type { PackedGalleryPost } from '@/models/schema/gallery-post.js';
import type { PackedInviteCode } from '@/models/schema/invite-code.js';
import type { PackedAbuseReportNotificationRecipient } from '@/models/schema/abuse-report-notification-recipient.js';
import type { PackedReversiGameLite, PackedReversiGameDetailed } from '@/models/schema/reversi-game.js';
import type { PackedQueueCount, PackedQueueMetrics, PackedQueueJob } from '@/models/schema/queue.js';

/** 「`#/components/schemas` 名 → packed 出力型」対応表 */
export type PackedEntityMap = {
	Signin: PackedSignin;
	Ad: PackedAd;
	EmojiSimple: PackedEmojiSimple;
	EmojiDetailed: PackedEmojiDetailed;
	EmojiDetailedAdmin: PackedEmojiDetailedAdmin;
	SystemWebhook: PackedSystemWebhook;
	FederationInstance: PackedFederationInstance;
	App: PackedApp;
	Antenna: PackedAntenna;
	UserWebhook: PackedUserWebhook;
	Hashtag: PackedHashtag;
	Announcement: PackedAnnouncement;
	UserList: PackedUserList;
	RoleCondFormulaLogics: PackedRoleCondFormulaLogics;
	RoleCondFormulaValueNot: PackedRoleCondFormulaValueNot;
	RoleCondFormulaValueIsLocalOrRemote: PackedRoleCondFormulaValueIsLocalOrRemote;
	RoleCondFormulaValueUserSettingBooleanSchema: PackedRoleCondFormulaValueUserSettingBoolean;
	RoleCondFormulaValueAssignedRole: PackedRoleCondFormulaValueAssignedRole;
	RoleCondFormulaValueCreated: PackedRoleCondFormulaValueCreated;
	RoleCondFormulaFollowersOrFollowingOrNotes: PackedRoleCondFormulaFollowersOrFollowingOrNotes;
	RoleCondFormulaValue: PackedRoleCondFormulaValue;
	RoleLite: PackedRoleLite;
	RolePolicies: PackedRolePolicies;
	Role: PackedRole;
	Achievement: PackedAchievement;
	AchievementName: PackedAchievementName;
	UserLite: PackedUserLite;
	UserDetailedNotMeOnly: PackedUserDetailedNotMeOnly;
	MeDetailedOnly: PackedMeDetailedOnly;
	UserDetailedNotMe: PackedUserDetailedNotMe;
	MeDetailed: PackedMeDetailed;
	UserDetailed: PackedUserDetailed;
	User: PackedUser;
	Note: PackedNote;
	Notification: PackedNotification;
	DriveFile: PackedDriveFile;
	DriveFolder: PackedDriveFolder;
	Page: PackedPage;
	PageBlock: PackedPageBlock;
	Channel: PackedChannel;
	MetaLite: PackedMetaLite;
	MetaDetailedOnly: PackedMetaDetailedOnly;
	MetaDetailed: PackedMetaDetailed;
	MetaClientOptions: PackedMetaClientOptions;
	NoteDraft: PackedNoteDraft;
	ChatRoom: PackedChatRoom;
	ChatRoomInvitation: PackedChatRoomInvitation;
	ChatRoomMembership: PackedChatRoomMembership;
	ChatMessage: PackedChatMessage;
	ChatMessageLite: PackedChatMessageLite;
	ChatMessageLiteFor1on1: PackedChatMessageLiteFor1on1;
	ChatMessageLiteForRoom: PackedChatMessageLiteForRoom;
	Following: PackedFollowing;
	Blocking: PackedBlocking;
	Muting: PackedMuting;
	RenoteMuting: PackedRenoteMuting;
	Clip: PackedClip;
	NoteFavorite: PackedNoteFavorite;
	NoteReaction: PackedNoteReaction;
	NoteReactionWithNote: PackedNoteReactionWithNote;
	Flash: PackedFlash;
	GalleryPost: PackedGalleryPost;
	InviteCode: PackedInviteCode;
	AbuseReportNotificationRecipient: PackedAbuseReportNotificationRecipient;
	ReversiGameLite: PackedReversiGameLite;
	ReversiGameDetailed: PackedReversiGameDetailed;
	QueueCount: PackedQueueCount;
	QueueMetrics: PackedQueueMetrics;
	QueueJob: PackedQueueJob;
};
