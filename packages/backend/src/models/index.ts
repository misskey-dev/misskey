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

export type MiAbuseUserReportsRepository = Repository<MiAbuseUserReport>;
export type MiAccessTokensRepository = Repository<MiAccessToken>;
export type MiAdsRepository = Repository<MiAd>;
export type MiAnnouncementsRepository = Repository<MiAnnouncement>;
export type MiAnnouncementReadsRepository = Repository<MiAnnouncementRead>;
export type MiAntennasRepository = Repository<MiAntenna>;
export type MiAppsRepository = Repository<MiApp>;
export type MiAttestationChallengesRepository = Repository<MiAttestationChallenge>;
export type MiAuthSessionsRepository = Repository<MiAuthSession>;
export type MiBlockingsRepository = Repository<MiBlocking>;
export type MiChannelFollowingsRepository = Repository<MiChannelFollowing>;
export type MiChannelFavoritesRepository = Repository<MiChannelFavorite>;
export type MiClipsRepository = Repository<MiClip>;
export type MiClipNotesRepository = Repository<MiClipNote>;
export type MiClipFavoritesRepository = Repository<MiClipFavorite>;
export type MiDriveFilesRepository = Repository<MiDriveFile>;
export type MiDriveFoldersRepository = Repository<MiDriveFolder>;
export type MiEmojisRepository = Repository<MiEmoji>;
export type MiFollowingsRepository = Repository<MiFollowing>;
export type MiFollowRequestsRepository = Repository<MiFollowRequest>;
export type MiGalleryLikesRepository = Repository<MiGalleryLike>;
export type MiGalleryPostsRepository = Repository<MiGalleryPost>;
export type MiHashtagsRepository = Repository<MiHashtag>;
export type MiInstancesRepository = Repository<MiInstance>;
export type MiMetasRepository = Repository<MiMeta>;
export type MiModerationLogsRepository = Repository<MiModerationLog>;
export type MiMutedNotesRepository = Repository<MiMutedNote>;
export type MiMutingsRepository = Repository<MiMuting>;
export type MiRenoteMutingsRepository = Repository<MiRenoteMuting>;
export type MiNotesRepository = Repository<MiNote>;
export type MiNoteFavoritesRepository = Repository<MiNoteFavorite>;
export type MiNoteReactionsRepository = Repository<MiNoteReaction>;
export type MiNoteThreadMutingsRepository = Repository<MiNoteThreadMuting>;
export type MiNoteUnreadsRepository = Repository<MiNoteUnread>;
export type MiPagesRepository = Repository<MiPage>;
export type MiPageLikesRepository = Repository<MiPageLike>;
export type MiPasswordResetRequestsRepository = Repository<MiPasswordResetRequest>;
export type MiPollsRepository = Repository<MiPoll>;
export type MiPollVotesRepository = Repository<MiPollVote>;
export type MiPromoNotesRepository = Repository<MiPromoNote>;
export type MiPromoReadsRepository = Repository<MiPromoRead>;
export type MiRegistrationTicketsRepository = Repository<MiRegistrationTicket>;
export type MiRegistryItemsRepository = Repository<MiRegistryItem>;
export type MiRelaysRepository = Repository<MiRelay>;
export type MiSigninsRepository = Repository<MiSignin>;
export type MiSwSubscriptionsRepository = Repository<MiSwSubscription>;
export type MiUsedUsernamesRepository = Repository<MiUsedUsername>;
export type MiUsersRepository = Repository<MiUser>;
export type MiUserIpsRepository = Repository<MiUserIp>;
export type MiUserKeypairsRepository = Repository<MiUserKeypair>;
export type MiUserListsRepository = Repository<MiUserList>;
export type MiUserListFavoritesRepository = Repository<MiUserListFavorite>;
export type MiUserListJoiningsRepository = Repository<MiUserListJoining>;
export type MiUserNotePiningsRepository = Repository<MiUserNotePining>;
export type MiUserPendingsRepository = Repository<MiUserPending>;
export type MiUserProfilesRepository = Repository<MiUserProfile>;
export type MiUserPublickeysRepository = Repository<MiUserPublickey>;
export type MiUserSecurityKeysRepository = Repository<MiUserSecurityKey>;
export type MiWebhooksRepository = Repository<MiWebhook>;
export type MiChannelsRepository = Repository<MiChannel>;
export type MiRetentionAggregationsRepository = Repository<MiRetentionAggregation>;
export type MiRolesRepository = Repository<MiRole>;
export type MiRoleAssignmentsRepository = Repository<MiRoleAssignment>;
export type MiFlashsRepository = Repository<MiFlash>;
export type MiFlashLikesRepository = Repository<MiFlashLike>;
export type MiUserMemoRepository = Repository<MiUserMemo>;
