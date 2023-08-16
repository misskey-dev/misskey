/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { MiAbuseUserReport } from '@/models/entities/AbuseUserReport.js';
import { MiAccessToken } from '@/models/entities/AccessToken.js';
import { MiAd } from '@/models/entities/Ad.js';
import { MiAnnouncement } from '@/models/entities/Announcement.js';
import { MiAnnouncementRead } from '@/models/entities/AnnouncementRead.js';
import { MiAntenna } from '@/models/entities/Antenna.js';
import { MiApp } from '@/models/entities/App.js';
import { MiAttestationChallenge } from '@/models/entities/AttestationChallenge.js';
import { MiAuthSession } from '@/models/entities/AuthSession.js';
import { MiBlocking } from '@/models/entities/Blocking.js';
import { MiChannelFollowing } from '@/models/entities/ChannelFollowing.js';
import { MiChannelFavorite } from '@/models/entities/ChannelFavorite.js';
import { MiClip } from '@/models/entities/Clip.js';
import { MiClipNote } from '@/models/entities/ClipNote.js';
import { MiClipFavorite } from '@/models/entities/ClipFavorite.js';
import { MiDriveFile } from '@/models/entities/DriveFile.js';
import { MiDriveFolder } from '@/models/entities/DriveFolder.js';
import { MiEmoji } from '@/models/entities/Emoji.js';
import { MiFollowing } from '@/models/entities/Following.js';
import { MiFollowRequest } from '@/models/entities/FollowRequest.js';
import { MiGalleryLike } from '@/models/entities/GalleryLike.js';
import { MiGalleryPost } from '@/models/entities/GalleryPost.js';
import { MiHashtag } from '@/models/entities/Hashtag.js';
import { MiInstance } from '@/models/entities/Instance.js';
import { MiMeta } from '@/models/entities/Meta.js';
import { MiModerationLog } from '@/models/entities/ModerationLog.js';
import { MiMutedNote } from '@/models/entities/MutedNote.js';
import { MiMuting } from '@/models/entities/Muting.js';
import { MiRenoteMuting } from '@/models/entities/RenoteMuting.js';
import { MiNote } from '@/models/entities/Note.js';
import { MiNoteFavorite } from '@/models/entities/NoteFavorite.js';
import { MiNoteReaction } from '@/models/entities/NoteReaction.js';
import { MiNoteThreadMuting } from '@/models/entities/NoteThreadMuting.js';
import { MiNoteUnread } from '@/models/entities/NoteUnread.js';
import { MiPage } from '@/models/entities/Page.js';
import { MiPageLike } from '@/models/entities/PageLike.js';
import { MiPasswordResetRequest } from '@/models/entities/PasswordResetRequest.js';
import { MiPoll } from '@/models/entities/Poll.js';
import { MiPollVote } from '@/models/entities/PollVote.js';
import { MiPromoNote } from '@/models/entities/PromoNote.js';
import { MiPromoRead } from '@/models/entities/PromoRead.js';
import { MiRegistrationTicket } from '@/models/entities/RegistrationTicket.js';
import { MiRegistryItem } from '@/models/entities/RegistryItem.js';
import { MiRelay } from '@/models/entities/Relay.js';
import { MiSignin } from '@/models/entities/Signin.js';
import { MiSwSubscription } from '@/models/entities/SwSubscription.js';
import { MiUsedUsername } from '@/models/entities/UsedUsername.js';
import { MiUser } from '@/models/entities/User.js';
import { MiUserIp } from '@/models/entities/UserIp.js';
import { MiUserKeypair } from '@/models/entities/UserKeypair.js';
import { MiUserList } from '@/models/entities/UserList.js';
import { MiUserListJoining } from '@/models/entities/UserListJoining.js';
import { MiUserNotePining } from '@/models/entities/UserNotePining.js';
import { MiUserPending } from '@/models/entities/UserPending.js';
import { MiUserProfile } from '@/models/entities/UserProfile.js';
import { MiUserPublickey } from '@/models/entities/UserPublickey.js';
import { MiUserSecurityKey } from '@/models/entities/UserSecurityKey.js';
import { MiUserMemo } from '@/models/entities/UserMemo.js';
import { MiWebhook } from '@/models/entities/Webhook.js';
import { MiChannel } from '@/models/entities/Channel.js';
import { MiRetentionAggregation } from '@/models/entities/RetentionAggregation.js';
import { MiRole } from '@/models/entities/Role.js';
import { MiRoleAssignment } from '@/models/entities/RoleAssignment.js';
import { MiFlash } from '@/models/entities/Flash.js';
import { MiFlashLike } from '@/models/entities/FlashLike.js';
import { MiUserListFavorite } from './entities/UserListFavorite.js';
import type { Repository } from 'typeorm';

export {
	MiAbuseUserReport,
	MiAccessToken,
	MiAd,
	MiAnnouncement,
	MiAnnouncementRead,
	MiAntenna,
	MiApp,
	MiAttestationChallenge,
	MiAuthSession,
	MiBlocking,
	MiChannelFollowing,
	MiChannelFavorite,
	MiClip,
	MiClipNote,
	MiClipFavorite,
	MiDriveFile,
	MiDriveFolder,
	MiEmoji,
	MiFollowing,
	MiFollowRequest,
	MiGalleryLike,
	MiGalleryPost,
	MiHashtag,
	MiInstance,
	MiMeta,
	MiModerationLog,
	MiMutedNote,
	MiMuting,
	MiRenoteMuting,
	MiNote,
	MiNoteFavorite,
	MiNoteReaction,
	MiNoteThreadMuting,
	MiNoteUnread,
	MiPage,
	MiPageLike,
	MiPasswordResetRequest,
	MiPoll,
	MiPollVote,
	MiPromoNote,
	MiPromoRead,
	MiRegistrationTicket,
	MiRegistryItem,
	MiRelay,
	MiSignin,
	MiSwSubscription,
	MiUsedUsername,
	MiUser,
	MiUserIp,
	MiUserKeypair,
	MiUserList,
	MiUserListFavorite,
	MiUserListJoining,
	MiUserNotePining,
	MiUserPending,
	MiUserProfile,
	MiUserPublickey,
	MiUserSecurityKey,
	MiWebhook,
	MiChannel,
	MiRetentionAggregation,
	MiRole,
	MiRoleAssignment,
	MiFlash,
	MiFlashLike,
	MiUserMemo,
};

export type AbuseUserReportsRepository = Repository<MiAbuseUserReport>;
export type AccessTokensRepository = Repository<MiAccessToken>;
export type AdsRepository = Repository<MiAd>;
export type AnnouncementsRepository = Repository<MiAnnouncement>;
export type AnnouncementReadsRepository = Repository<MiAnnouncementRead>;
export type AntennasRepository = Repository<MiAntenna>;
export type AppsRepository = Repository<MiApp>;
export type AttestationChallengesRepository = Repository<MiAttestationChallenge>;
export type AuthSessionsRepository = Repository<MiAuthSession>;
export type BlockingsRepository = Repository<MiBlocking>;
export type ChannelFollowingsRepository = Repository<MiChannelFollowing>;
export type ChannelFavoritesRepository = Repository<MiChannelFavorite>;
export type ClipsRepository = Repository<MiClip>;
export type ClipNotesRepository = Repository<MiClipNote>;
export type ClipFavoritesRepository = Repository<MiClipFavorite>;
export type DriveFilesRepository = Repository<MiDriveFile>;
export type DriveFoldersRepository = Repository<MiDriveFolder>;
export type EmojisRepository = Repository<MiEmoji>;
export type FollowingsRepository = Repository<MiFollowing>;
export type FollowRequestsRepository = Repository<MiFollowRequest>;
export type GalleryLikesRepository = Repository<MiGalleryLike>;
export type GalleryPostsRepository = Repository<MiGalleryPost>;
export type HashtagsRepository = Repository<MiHashtag>;
export type InstancesRepository = Repository<MiInstance>;
export type MetasRepository = Repository<MiMeta>;
export type ModerationLogsRepository = Repository<MiModerationLog>;
export type MutedNotesRepository = Repository<MiMutedNote>;
export type MutingsRepository = Repository<MiMuting>;
export type RenoteMutingsRepository = Repository<MiRenoteMuting>;
export type NotesRepository = Repository<MiNote>;
export type NoteFavoritesRepository = Repository<MiNoteFavorite>;
export type NoteReactionsRepository = Repository<MiNoteReaction>;
export type NoteThreadMutingsRepository = Repository<MiNoteThreadMuting>;
export type NoteUnreadsRepository = Repository<MiNoteUnread>;
export type PagesRepository = Repository<MiPage>;
export type PageLikesRepository = Repository<MiPageLike>;
export type PasswordResetRequestsRepository = Repository<MiPasswordResetRequest>;
export type PollsRepository = Repository<MiPoll>;
export type PollVotesRepository = Repository<MiPollVote>;
export type PromoNotesRepository = Repository<MiPromoNote>;
export type PromoReadsRepository = Repository<MiPromoRead>;
export type RegistrationTicketsRepository = Repository<MiRegistrationTicket>;
export type RegistryItemsRepository = Repository<MiRegistryItem>;
export type RelaysRepository = Repository<MiRelay>;
export type SigninsRepository = Repository<MiSignin>;
export type SwSubscriptionsRepository = Repository<MiSwSubscription>;
export type UsedUsernamesRepository = Repository<MiUsedUsername>;
export type UsersRepository = Repository<MiUser>;
export type UserIpsRepository = Repository<MiUserIp>;
export type UserKeypairsRepository = Repository<MiUserKeypair>;
export type UserListsRepository = Repository<MiUserList>;
export type UserListFavoritesRepository = Repository<MiUserListFavorite>;
export type UserListJoiningsRepository = Repository<MiUserListJoining>;
export type UserNotePiningsRepository = Repository<MiUserNotePining>;
export type UserPendingsRepository = Repository<MiUserPending>;
export type UserProfilesRepository = Repository<MiUserProfile>;
export type UserPublickeysRepository = Repository<MiUserPublickey>;
export type UserSecurityKeysRepository = Repository<MiUserSecurityKey>;
export type WebhooksRepository = Repository<MiWebhook>;
export type ChannelsRepository = Repository<MiChannel>;
export type RetentionAggregationsRepository = Repository<MiRetentionAggregation>;
export type RolesRepository = Repository<MiRole>;
export type RoleAssignmentsRepository = Repository<MiRoleAssignment>;
export type FlashsRepository = Repository<MiFlash>;
export type FlashLikesRepository = Repository<MiFlashLike>;
export type UserMemoRepository = Repository<MiUserMemo>;
