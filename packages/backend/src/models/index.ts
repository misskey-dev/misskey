import { AbuseUserReport } from '@/models/entities/AbuseUserReport.js';
import { AccessToken } from '@/models/entities/AccessToken.js';
import { Ad } from '@/models/entities/Ad.js';
import { Announcement } from '@/models/entities/Announcement.js';
import { AnnouncementRead } from '@/models/entities/AnnouncementRead.js';
import { Antenna } from '@/models/entities/Antenna.js';
import { App } from '@/models/entities/App.js';
import { AttestationChallenge } from '@/models/entities/AttestationChallenge.js';
import { AuthSession } from '@/models/entities/AuthSession.js';
import { Blocking } from '@/models/entities/Blocking.js';
import { ChannelFollowing } from '@/models/entities/ChannelFollowing.js';
import { ChannelFavorite } from '@/models/entities/ChannelFavorite.js';
import { Clip } from '@/models/entities/Clip.js';
import { ClipNote } from '@/models/entities/ClipNote.js';
import { ClipFavorite } from '@/models/entities/ClipFavorite.js';
import { DriveFile } from '@/models/entities/DriveFile.js';
import { DriveFolder } from '@/models/entities/DriveFolder.js';
import { Emoji } from '@/models/entities/Emoji.js';
import { Following } from '@/models/entities/Following.js';
import { FollowRequest } from '@/models/entities/FollowRequest.js';
import { GalleryLike } from '@/models/entities/GalleryLike.js';
import { GalleryPost } from '@/models/entities/GalleryPost.js';
import { Hashtag } from '@/models/entities/Hashtag.js';
import { Instance } from '@/models/entities/Instance.js';
import { Meta } from '@/models/entities/Meta.js';
import { ModerationLog } from '@/models/entities/ModerationLog.js';
import { MutedNote } from '@/models/entities/MutedNote.js';
import { Muting } from '@/models/entities/Muting.js';
import { RenoteMuting } from '@/models/entities/RenoteMuting.js';
import { Note } from '@/models/entities/Note.js';
import { NoteFavorite } from '@/models/entities/NoteFavorite.js';
import { NoteReaction } from '@/models/entities/NoteReaction.js';
import { NoteThreadMuting } from '@/models/entities/NoteThreadMuting.js';
import { NoteUnread } from '@/models/entities/NoteUnread.js';
import { Page } from '@/models/entities/Page.js';
import { PageLike } from '@/models/entities/PageLike.js';
import { PasswordResetRequest } from '@/models/entities/PasswordResetRequest.js';
import { Poll } from '@/models/entities/Poll.js';
import { PollVote } from '@/models/entities/PollVote.js';
import { PromoNote } from '@/models/entities/PromoNote.js';
import { PromoRead } from '@/models/entities/PromoRead.js';
import { RegistrationTicket } from '@/models/entities/RegistrationTicket.js';
import { RegistryItem } from '@/models/entities/RegistryItem.js';
import { Relay } from '@/models/entities/Relay.js';
import { Signin } from '@/models/entities/Signin.js';
import { SwSubscription } from '@/models/entities/SwSubscription.js';
import { UsedUsername } from '@/models/entities/UsedUsername.js';
import { User } from '@/models/entities/User.js';
import { UserIp } from '@/models/entities/UserIp.js';
import { UserKeypair } from '@/models/entities/UserKeypair.js';
import { UserList } from '@/models/entities/UserList.js';
import { UserListJoining } from '@/models/entities/UserListJoining.js';
import { UserNotePining } from '@/models/entities/UserNotePining.js';
import { UserPending } from '@/models/entities/UserPending.js';
import { UserProfile } from '@/models/entities/UserProfile.js';
import { UserPublickey } from '@/models/entities/UserPublickey.js';
import { UserSecurityKey } from '@/models/entities/UserSecurityKey.js';
import { UserMemo } from '@/models/entities/UserMemo.js';
import { Webhook } from '@/models/entities/Webhook.js';
import { Channel } from '@/models/entities/Channel.js';
import { RetentionAggregation } from '@/models/entities/RetentionAggregation.js';
import { Role } from '@/models/entities/Role.js';
import { RoleAssignment } from '@/models/entities/RoleAssignment.js';
import { Flash } from '@/models/entities/Flash.js';
import { FlashLike } from '@/models/entities/FlashLike.js';
import type { Repository } from 'typeorm';

export {
	AbuseUserReport,
	AccessToken,
	Ad,
	Announcement,
	AnnouncementRead,
	Antenna,
	App,
	AttestationChallenge,
	AuthSession,
	Blocking,
	ChannelFollowing,
	ChannelFavorite,
	Clip,
	ClipNote,
	ClipFavorite,
	DriveFile,
	DriveFolder,
	Emoji,
	Following,
	FollowRequest,
	GalleryLike,
	GalleryPost,
	Hashtag,
	Instance,
	Meta,
	ModerationLog,
	MutedNote,
	Muting,
	RenoteMuting,
	Note,
	NoteFavorite,
	NoteReaction,
	NoteThreadMuting,
	NoteUnread,
	Page,
	PageLike,
	PasswordResetRequest,
	Poll,
	PollVote,
	PromoNote,
	PromoRead,
	RegistrationTicket,
	RegistryItem,
	Relay,
	Signin,
	SwSubscription,
	UsedUsername,
	User,
	UserIp,
	UserKeypair,
	UserList,
	UserListJoining,
	UserNotePining,
	UserPending,
	UserProfile,
	UserPublickey,
	UserSecurityKey,
	Webhook,
	Channel,
	RetentionAggregation,
	Role,
	RoleAssignment,
	Flash,
	FlashLike,
	UserMemo,
};

export type AbuseUserReportsRepository = Repository<AbuseUserReport>;
export type AccessTokensRepository = Repository<AccessToken>;
export type AdsRepository = Repository<Ad>;
export type AnnouncementsRepository = Repository<Announcement>;
export type AnnouncementReadsRepository = Repository<AnnouncementRead>;
export type AntennasRepository = Repository<Antenna>;
export type AppsRepository = Repository<App>;
export type AttestationChallengesRepository = Repository<AttestationChallenge>;
export type AuthSessionsRepository = Repository<AuthSession>;
export type BlockingsRepository = Repository<Blocking>;
export type ChannelFollowingsRepository = Repository<ChannelFollowing>;
export type ChannelFavoritesRepository = Repository<ChannelFavorite>;
export type ClipsRepository = Repository<Clip>;
export type ClipNotesRepository = Repository<ClipNote>;
export type ClipFavoritesRepository = Repository<ClipFavorite>;
export type DriveFilesRepository = Repository<DriveFile>;
export type DriveFoldersRepository = Repository<DriveFolder>;
export type EmojisRepository = Repository<Emoji>;
export type FollowingsRepository = Repository<Following>;
export type FollowRequestsRepository = Repository<FollowRequest>;
export type GalleryLikesRepository = Repository<GalleryLike>;
export type GalleryPostsRepository = Repository<GalleryPost>;
export type HashtagsRepository = Repository<Hashtag>;
export type InstancesRepository = Repository<Instance>;
export type MetasRepository = Repository<Meta>;
export type ModerationLogsRepository = Repository<ModerationLog>;
export type MutedNotesRepository = Repository<MutedNote>;
export type MutingsRepository = Repository<Muting>;
export type RenoteMutingsRepository = Repository<RenoteMuting>;
export type NotesRepository = Repository<Note>;
export type NoteFavoritesRepository = Repository<NoteFavorite>;
export type NoteReactionsRepository = Repository<NoteReaction>;
export type NoteThreadMutingsRepository = Repository<NoteThreadMuting>;
export type NoteUnreadsRepository = Repository<NoteUnread>;
export type PagesRepository = Repository<Page>;
export type PageLikesRepository = Repository<PageLike>;
export type PasswordResetRequestsRepository = Repository<PasswordResetRequest>;
export type PollsRepository = Repository<Poll>;
export type PollVotesRepository = Repository<PollVote>;
export type PromoNotesRepository = Repository<PromoNote>;
export type PromoReadsRepository = Repository<PromoRead>;
export type RegistrationTicketsRepository = Repository<RegistrationTicket>;
export type RegistryItemsRepository = Repository<RegistryItem>;
export type RelaysRepository = Repository<Relay>;
export type SigninsRepository = Repository<Signin>;
export type SwSubscriptionsRepository = Repository<SwSubscription>;
export type UsedUsernamesRepository = Repository<UsedUsername>;
export type UsersRepository = Repository<User>;
export type UserIpsRepository = Repository<UserIp>;
export type UserKeypairsRepository = Repository<UserKeypair>;
export type UserListsRepository = Repository<UserList>;
export type UserListJoiningsRepository = Repository<UserListJoining>;
export type UserNotePiningsRepository = Repository<UserNotePining>;
export type UserPendingsRepository = Repository<UserPending>;
export type UserProfilesRepository = Repository<UserProfile>;
export type UserPublickeysRepository = Repository<UserPublickey>;
export type UserSecurityKeysRepository = Repository<UserSecurityKey>;
export type WebhooksRepository = Repository<Webhook>;
export type ChannelsRepository = Repository<Channel>;
export type RetentionAggregationsRepository = Repository<RetentionAggregation>;
export type RolesRepository = Repository<Role>;
export type RoleAssignmentsRepository = Repository<RoleAssignment>;
export type FlashsRepository = Repository<Flash>;
export type FlashLikesRepository = Repository<FlashLike>;
export type UserMemoRepository = Repository<UserMemo>;
