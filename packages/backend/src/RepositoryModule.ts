import { Module } from '@nestjs/common';
import { AbuseUserReports, AccessTokens, Ads, AnnouncementReads, Announcements, AntennaNotes, Antennas, Apps, AttestationChallenges, AuthSessions, Blockings, ChannelFollowings, ChannelNotePinings, Channels, ClipNotes, Clips, DriveFiles, DriveFolders, Emojis, Followings, FollowRequests, GalleryLikes, GalleryPosts, Hashtags, Instances, MessagingMessages, Metas, ModerationLogs, MutedNotes, Mutings, NoteFavorites, NoteReactions, Notes, NoteThreadMutings, NoteUnreads, Notifications, PageLikes, Pages, PasswordResetRequests, Polls, PollVotes, PromoNotes, PromoReads, RegistrationTickets, RegistryItems, Relays, Signins, SwSubscriptions, UsedUsernames, UserGroupInvitations, UserGroupJoinings, UserGroups, UserIps, UserKeypairs, UserListJoinings, UserLists, UserNotePinings, UserPendings, UserProfiles, UserPublickeys, Users, UserSecurityKeys, Webhooks } from '@/models/index.js';
import { DI } from '@/di-symbols.js';
import type { Provider } from '@nestjs/common';

const $usersRepository: Provider = {
	provide: DI.usersRepository,
	useValue: Users,
};

const $notesRepository: Provider = {
	provide: DI.notesRepository,
	useValue: Notes,
};

const $announcementsRepository: Provider = {
	provide: DI.announcementsRepository,
	useValue: Announcements,
};

const $announcementReadsRepository: Provider = {
	provide: DI.announcementReadsRepository,
	useValue: AnnouncementReads,
};

const $appsRepository: Provider = {
	provide: DI.appsRepository,
	useValue: Apps,
};

const $noteFavoritesRepository: Provider = {
	provide: DI.noteFavoritesRepository,
	useValue: NoteFavorites,
};

const $noteThreadMutingsRepository: Provider = {
	provide: DI.noteThreadMutingsRepository,
	useValue: NoteThreadMutings,
};

const $noteReactionsRepository: Provider = {
	provide: DI.noteReactionsRepository,
	useValue: NoteReactions,
};

const $noteUnreadsRepository: Provider = {
	provide: DI.noteUnreadsRepository,
	useValue: NoteUnreads,
};

const $pollsRepository: Provider = {
	provide: DI.pollsRepository,
	useValue: Polls,
};

const $pollVotesRepository: Provider = {
	provide: DI.pollVotesRepository,
	useValue: PollVotes,
};

const $userProfilesRepository: Provider = {
	provide: DI.userProfilesRepository,
	useValue: UserProfiles,
};

const $userKeypairsRepository: Provider = {
	provide: DI.userKeypairsRepository,
	useValue: UserKeypairs,
};

const $userPendingsRepository: Provider = {
	provide: DI.userPendingsRepository,
	useValue: UserPendings,
};

const $attestationChallengesRepository: Provider = {
	provide: DI.attestationChallengesRepository,
	useValue: AttestationChallenges,
};

const $userSecurityKeysRepository: Provider = {
	provide: DI.userSecurityKeysRepository,
	useValue: UserSecurityKeys,
};

const $userPublickeysRepository: Provider = {
	provide: DI.userPublickeysRepository,
	useValue: UserPublickeys,
};

const $userListsRepository: Provider = {
	provide: DI.userListsRepository,
	useValue: UserLists,
};

const $userListJoiningsRepository: Provider = {
	provide: DI.userListJoiningsRepository,
	useValue: UserListJoinings,
};

const $userGroupsRepository: Provider = {
	provide: DI.userGroupsRepository,
	useValue: UserGroups,
};

const $userGroupJoiningsRepository: Provider = {
	provide: DI.userGroupJoiningsRepository,
	useValue: UserGroupJoinings,
};

const $userGroupInvitationsRepository: Provider = {
	provide: DI.userGroupInvitationsRepository,
	useValue: UserGroupInvitations,
};

const $userNotePiningsRepository: Provider = {
	provide: DI.userNotePiningsRepository,
	useValue: UserNotePinings,
};

const $userIpsRepository: Provider = {
	provide: DI.userIpsRepository,
	useValue: UserIps,
};

const $usedUsernamesRepository: Provider = {
	provide: DI.usedUsernamesRepository,
	useValue: UsedUsernames,
};

const $followingsRepository: Provider = {
	provide: DI.followingsRepository,
	useValue: Followings,
};

const $followRequestsRepository: Provider = {
	provide: DI.followRequestsRepository,
	useValue: FollowRequests,
};

const $instancesRepository: Provider = {
	provide: DI.instancesRepository,
	useValue: Instances,
};

const $emojisRepository: Provider = {
	provide: DI.emojisRepository,
	useValue: Emojis,
};

const $driveFilesRepository: Provider = {
	provide: DI.driveFilesRepository,
	useValue: DriveFiles,
};

const $driveFoldersRepository: Provider = {
	provide: DI.driveFoldersRepository,
	useValue: DriveFolders,
};

const $notificationsRepository: Provider = {
	provide: DI.notificationsRepository,
	useValue: Notifications,
};

const $metasRepository: Provider = {
	provide: DI.metasRepository,
	useValue: Metas,
};

const $mutingsRepository: Provider = {
	provide: DI.mutingsRepository,
	useValue: Mutings,
};

const $blockingsRepository: Provider = {
	provide: DI.blockingsRepository,
	useValue: Blockings,
};

const $swSubscriptionsRepository: Provider = {
	provide: DI.swSubscriptionsRepository,
	useValue: SwSubscriptions,
};

const $hashtagsRepository: Provider = {
	provide: DI.hashtagsRepository,
	useValue: Hashtags,
};

const $abuseUserReportsRepository: Provider = {
	provide: DI.abuseUserReportsRepository,
	useValue: AbuseUserReports,
};

const $registrationTicketsRepository: Provider = {
	provide: DI.registrationTicketsRepository,
	useValue: RegistrationTickets,
};

const $authSessionsRepository: Provider = {
	provide: DI.authSessionsRepository,
	useValue: AuthSessions,
};

const $accessTokensRepository: Provider = {
	provide: DI.accessTokensRepository,
	useValue: AccessTokens,
};

const $signinsRepository: Provider = {
	provide: DI.signinsRepository,
	useValue: Signins,
};

const $messagingMessagesRepository: Provider = {
	provide: DI.messagingMessagesRepository,
	useValue: MessagingMessages,
};

const $pagesRepository: Provider = {
	provide: DI.pagesRepository,
	useValue: Pages,
};

const $pageLikesRepository: Provider = {
	provide: DI.pageLikesRepository,
	useValue: PageLikes,
};

const $galleryPostsRepository: Provider = {
	provide: DI.galleryPostsRepository,
	useValue: GalleryPosts,
};

const $galleryLikesRepository: Provider = {
	provide: DI.galleryLikesRepository,
	useValue: GalleryLikes,
};

const $moderationLogsRepository: Provider = {
	provide: DI.moderationLogsRepository,
	useValue: ModerationLogs,
};

const $clipsRepository: Provider = {
	provide: DI.clipsRepository,
	useValue: Clips,
};

const $clipNotesRepository: Provider = {
	provide: DI.clipNotesRepository,
	useValue: ClipNotes,
};

const $antennasRepository: Provider = {
	provide: DI.antennasRepository,
	useValue: Antennas,
};

const $antennaNotesRepository: Provider = {
	provide: DI.antennaNotesRepository,
	useValue: AntennaNotes,
};

const $promoNotesRepository: Provider = {
	provide: DI.promoNotesRepository,
	useValue: PromoNotes,
};

const $promoReadsRepository: Provider = {
	provide: DI.promoReadsRepository,
	useValue: PromoReads,
};

const $relaysRepository: Provider = {
	provide: DI.relaysRepository,
	useValue: Relays,
};

const $mutedNotesRepository: Provider = {
	provide: DI.mutedNotesRepository,
	useValue: MutedNotes,
};

const $channelsRepository: Provider = {
	provide: DI.channelsRepository,
	useValue: Channels,
};

const $channelFollowingsRepository: Provider = {
	provide: DI.channelFollowingsRepository,
	useValue: ChannelFollowings,
};

const $channelNotePiningsRepository: Provider = {
	provide: DI.channelNotePiningsRepository,
	useValue: ChannelNotePinings,
};

const $registryItemsRepository: Provider = {
	provide: DI.registryItemsRepository,
	useValue: RegistryItems,
};

const $webhooksRepository: Provider = {
	provide: DI.webhooksRepository,
	useValue: Webhooks,
};

const $adsRepository: Provider = {
	provide: DI.adsRepository,
	useValue: Ads,
};

const $passwordResetRequestsRepository: Provider = {
	provide: DI.passwordResetRequestsRepository,
	useValue: PasswordResetRequests,
};

@Module({
	imports: [
	],
	providers: [
		$usersRepository,
		$notesRepository,
		$announcementsRepository,
		$announcementReadsRepository,
		$appsRepository,
		$noteFavoritesRepository,
		$noteThreadMutingsRepository,
		$noteReactionsRepository,
		$noteUnreadsRepository,
		$pollsRepository,
		$pollVotesRepository,
		$userProfilesRepository,
		$userKeypairsRepository,
		$userPendingsRepository,
		$attestationChallengesRepository,
		$userSecurityKeysRepository,
		$userPublickeysRepository,
		$userListsRepository,
		$userListJoiningsRepository,
		$userGroupsRepository,
		$userGroupJoiningsRepository,
		$userGroupInvitationsRepository,
		$userNotePiningsRepository,
		$userIpsRepository,
		$usedUsernamesRepository,
		$followingsRepository,
		$followRequestsRepository,
		$instancesRepository,
		$emojisRepository,
		$driveFilesRepository,
		$driveFoldersRepository,
		$notificationsRepository,
		$metasRepository,
		$mutingsRepository,
		$blockingsRepository,
		$swSubscriptionsRepository,
		$hashtagsRepository,
		$abuseUserReportsRepository,
		$registrationTicketsRepository,
		$authSessionsRepository,
		$accessTokensRepository,
		$signinsRepository,
		$messagingMessagesRepository,
		$pagesRepository,
		$pageLikesRepository,
		$galleryPostsRepository,
		$galleryLikesRepository,
		$moderationLogsRepository,
		$clipsRepository,
		$clipNotesRepository,
		$antennasRepository,
		$antennaNotesRepository,
		$promoNotesRepository,
		$promoReadsRepository,
		$relaysRepository,
		$mutedNotesRepository,
		$channelsRepository,
		$channelFollowingsRepository,
		$channelNotePiningsRepository,
		$registryItemsRepository,
		$webhooksRepository,
		$adsRepository,
		$passwordResetRequestsRepository,
	],
	exports: [
		$usersRepository,
		$notesRepository,
		$announcementsRepository,
		$announcementReadsRepository,
		$appsRepository,
		$noteFavoritesRepository,
		$noteThreadMutingsRepository,
		$noteReactionsRepository,
		$noteUnreadsRepository,
		$pollsRepository,
		$pollVotesRepository,
		$userProfilesRepository,
		$userKeypairsRepository,
		$userPendingsRepository,
		$attestationChallengesRepository,
		$userSecurityKeysRepository,
		$userPublickeysRepository,
		$userListsRepository,
		$userListJoiningsRepository,
		$userGroupsRepository,
		$userGroupJoiningsRepository,
		$userGroupInvitationsRepository,
		$userNotePiningsRepository,
		$userIpsRepository,
		$usedUsernamesRepository,
		$followingsRepository,
		$followRequestsRepository,
		$instancesRepository,
		$emojisRepository,
		$driveFilesRepository,
		$driveFoldersRepository,
		$notificationsRepository,
		$metasRepository,
		$mutingsRepository,
		$blockingsRepository,
		$swSubscriptionsRepository,
		$hashtagsRepository,
		$abuseUserReportsRepository,
		$registrationTicketsRepository,
		$authSessionsRepository,
		$accessTokensRepository,
		$signinsRepository,
		$messagingMessagesRepository,
		$pagesRepository,
		$pageLikesRepository,
		$galleryPostsRepository,
		$galleryLikesRepository,
		$moderationLogsRepository,
		$clipsRepository,
		$clipNotesRepository,
		$antennasRepository,
		$antennaNotesRepository,
		$promoNotesRepository,
		$promoReadsRepository,
		$relaysRepository,
		$mutedNotesRepository,
		$channelsRepository,
		$channelFollowingsRepository,
		$channelNotePiningsRepository,
		$registryItemsRepository,
		$webhooksRepository,
		$adsRepository,
		$passwordResetRequestsRepository,
	],
})
export class RepositoryModule {}
