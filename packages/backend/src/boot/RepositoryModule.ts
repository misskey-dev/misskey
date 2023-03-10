import { DataSource, EntityTarget, ObjectLiteral } from 'typeorm';
import {
	IServiceCollection,
	addSingletonFactory,
	getRequiredService,
} from 'yohira';
import { DI } from '@/di-symbols.js';
import { User, Note, Announcement, AnnouncementRead, App, NoteFavorite, NoteThreadMuting, NoteReaction, NoteUnread, Notification, Poll, PollVote, UserProfile, UserKeypair, UserPending, AttestationChallenge, UserSecurityKey, UserPublickey, UserList, UserListJoining, UserNotePining, UserIp, UsedUsername, Following, FollowRequest, Instance, Emoji, DriveFile, DriveFolder, Meta, Muting, RenoteMuting, Blocking, SwSubscription, Hashtag, AbuseUserReport, RegistrationTicket, AuthSession, AccessToken, Signin, Page, PageLike, GalleryPost, GalleryLike, ModerationLog, Clip, ClipNote, Antenna, AntennaNote, PromoNote, PromoRead, Relay, MutedNote, Channel, ChannelFollowing, ChannelNotePining, RegistryItem, Webhook, Ad, PasswordResetRequest, RetentionAggregation, FlashLike, Flash, Role, RoleAssignment } from '@/models/index.js';

const RepositoryServices: readonly (readonly [
	symbol,
	EntityTarget<ObjectLiteral>,
])[] = [
	[DI.usersRepository, User],
	[DI.notesRepository, Note],
	[DI.announcementsRepository, Announcement],
	[DI.announcementReadsRepository, AnnouncementRead],
	[DI.appsRepository, App],
	[DI.noteFavoritesRepository, NoteFavorite],
	[DI.noteThreadMutingsRepository, NoteThreadMuting],
	[DI.noteReactionsRepository, NoteReaction],
	[DI.noteUnreadsRepository, NoteUnread],
	[DI.pollsRepository, Poll],
	[DI.pollVotesRepository, PollVote],
	[DI.userProfilesRepository, UserProfile],
	[DI.userKeypairsRepository, UserKeypair],
	[DI.userPendingsRepository, UserPending],
	[DI.attestationChallengesRepository, AttestationChallenge],
	[DI.userSecurityKeysRepository, UserSecurityKey],
	[DI.userPublickeysRepository, UserPublickey],
	[DI.userListsRepository, UserList],
	[DI.userListJoiningsRepository, UserListJoining],
	[DI.userNotePiningsRepository, UserNotePining],
	[DI.userIpsRepository, UserIp],
	[DI.usedUsernamesRepository, UsedUsername],
	[DI.followingsRepository, Following],
	[DI.followRequestsRepository, FollowRequest],
	[DI.instancesRepository, Instance],
	[DI.emojisRepository, Emoji],
	[DI.driveFilesRepository, DriveFile],
	[DI.driveFoldersRepository, DriveFolder],
	[DI.notificationsRepository, Notification],
	[DI.metasRepository, Meta],
	[DI.mutingsRepository, Muting],
	[DI.renoteMutingsRepository, RenoteMuting],
	[DI.blockingsRepository, Blocking],
	[DI.swSubscriptionsRepository, SwSubscription],
	[DI.hashtagsRepository, Hashtag],
	[DI.abuseUserReportsRepository, AbuseUserReport],
	[DI.registrationTicketsRepository, RegistrationTicket],
	[DI.authSessionsRepository, AuthSession],
	[DI.accessTokensRepository, AccessToken],
	[DI.signinsRepository, Signin],
	[DI.pagesRepository, Page],
	[DI.pageLikesRepository, PageLike],
	[DI.galleryPostsRepository, GalleryPost],
	[DI.galleryLikesRepository, GalleryLike],
	[DI.moderationLogsRepository, ModerationLog],
	[DI.clipsRepository, Clip],
	[DI.clipNotesRepository, ClipNote],
	[DI.antennasRepository, Antenna],
	[DI.antennaNotesRepository, AntennaNote],
	[DI.promoNotesRepository, PromoNote],
	[DI.promoReadsRepository, PromoRead],
	[DI.relaysRepository, Relay],
	[DI.mutedNotesRepository, MutedNote],
	[DI.channelsRepository, Channel],
	[DI.channelFollowingsRepository, ChannelFollowing],
	[DI.channelNotePiningsRepository, ChannelNotePining],
	[DI.registryItemsRepository, RegistryItem],
	[DI.webhooksRepository, Webhook],
	[DI.adsRepository, Ad],
	[DI.passwordResetRequestsRepository, PasswordResetRequest],
	[DI.retentionAggregationsRepository, RetentionAggregation],
	[DI.rolesRepository, Role],
	[DI.roleAssignmentsRepository, RoleAssignment],
	[DI.flashsRepository, Flash],
	[DI.flashLikesRepository, FlashLike],
];

export function addRepositoryServices(services: IServiceCollection): void {
	for (const [serviceType, target] of RepositoryServices) {
		addSingletonFactory(services, serviceType, (services) => {
			const db = getRequiredService<DataSource>(services, DI.db);
			return db.getRepository(target);
		});
	}
}
