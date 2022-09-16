import { Module } from '@nestjs/common';
import { AbuseUserReports, AccessTokens, Ads, AnnouncementReads, Announcements, AntennaNotes, Antennas, Apps, AttestationChallenges, AuthSessions, Blockings, ChannelFollowings, ChannelNotePinings, Channels, ClipNotes, Clips, DriveFiles, DriveFolders, Emojis, Followings, FollowRequests, GalleryLikes, GalleryPosts, Hashtags, Instances, MessagingMessages, Metas, ModerationLogs, MutedNotes, Mutings, NoteFavorites, NoteReactions, Notes, NoteThreadMutings, NoteUnreads, Notifications, PageLikes, Pages, PasswordResetRequests, Polls, PollVotes, PromoNotes, PromoReads, RegistrationTickets, RegistryItems, Relays, Signins, SwSubscriptions, UsedUsernames, UserGroupInvitations, UserGroupJoinings, UserGroups, UserIps, UserKeypairs, UserListJoinings, UserLists, UserNotePinings, UserPendings, UserProfiles, UserPublickeys, Users, UserSecurityKeys, Webhooks } from '@/models/index.js';
import type { Provider } from '@nestjs/common';

const $usersRepository: Provider = {
	provide: 'usersRepository',
	useValue: Users,
};

const $notesRepository: Provider = {
	provide: 'notesRepository',
	useValue: Notes,
};

const $announcementsRepository: Provider = {
	provide: 'announcementsRepository',
	useValue: Announcements,
};

const $announcementReadsRepository: Provider = {
	provide: 'announcementReadsRepository',
	useValue: AnnouncementReads,
};

const $appsRepository: Provider = {
	provide: 'appsRepository',
	useValue: Apps,
};

const $noteFavoritesRepository: Provider = {
	provide: 'noteFavoritesRepository',
	useValue: NoteFavorites,
};

const $noteThreadMutingsRepository: Provider = {
	provide: 'noteThreadMutingsRepository',
	useValue: NoteThreadMutings,
};

const $noteReactionsRepository: Provider = {
	provide: 'noteReactionsRepository',
	useValue: NoteReactions,
};

const $noteUnreadsRepository: Provider = {
	provide: 'noteUnreadsRepository',
	useValue: NoteUnreads,
};

const $pollsRepository: Provider = {
	provide: 'pollsRepository',
	useValue: Polls,
};

const $pollVotesRepository: Provider = {
	provide: 'pollVotesRepository',
	useValue: PollVotes,
};

const $userProfilesRepository: Provider = {
	provide: 'userProfilesRepository',
	useValue: UserProfiles,
};

const $userKeypairsRepository: Provider = {
	provide: 'userKeypairsRepository',
	useValue: UserKeypairs,
};

const $userPendingsRepository: Provider = {
	provide: 'userPendingsRepository',
	useValue: UserPendings,
};

const $attestationChallengesRepository: Provider = {
	provide: 'attestationChallengesRepository',
	useValue: AttestationChallenges,
};

const $userSecurityKeysRepository: Provider = {
	provide: 'userSecurityKeysRepository',
	useValue: UserSecurityKeys,
};

const $userPublickeysRepository: Provider = {
	provide: 'userPublickeysRepository',
	useValue: UserPublickeys,
};

const $userListsRepository: Provider = {
	provide: 'userListsRepository',
	useValue: UserLists,
};

const $userListJoiningsRepository: Provider = {
	provide: 'userListJoiningsRepository',
	useValue: UserListJoinings,
};

const $userGroupsRepository: Provider = {
	provide: 'userGroupsRepository',
	useValue: UserGroups,
};

const $userGroupJoiningsRepository: Provider = {
	provide: 'userGroupJoiningsRepository',
	useValue: UserGroupJoinings,
};

const $userGroupInvitationsRepository: Provider = {
	provide: 'userGroupInvitationsRepository',
	useValue: UserGroupInvitations,
};

const $userNotePiningsRepository: Provider = {
	provide: 'userNotePiningsRepository',
	useValue: UserNotePinings,
};

const $userIpsRepository: Provider = {
	provide: 'userIpsRepository',
	useValue: UserIps,
};

const $usedUsernamesRepository: Provider = {
	provide: 'usedUsernamesRepository',
	useValue: UsedUsernames,
};

const $followingsRepository: Provider = {
	provide: 'followingsRepository',
	useValue: Followings,
};

const $followRequestsRepository: Provider = {
	provide: 'followRequestsRepository',
	useValue: FollowRequests,
};

const $instancesRepository: Provider = {
	provide: 'instancesRepository',
	useValue: Instances,
};

const $emojisRepository: Provider = {
	provide: 'emojisRepository',
	useValue: Emojis,
};

const $driveFilesRepository: Provider = {
	provide: 'driveFilesRepository',
	useValue: DriveFiles,
};

const $driveFoldersRepository: Provider = {
	provide: 'driveFoldersRepository',
	useValue: DriveFolders,
};

const $notificationsRepository: Provider = {
	provide: 'notificationsRepository',
	useValue: Notifications,
};

const $metasRepository: Provider = {
	provide: 'metasRepository',
	useValue: Metas,
};

const $mutingsRepository: Provider = {
	provide: 'mutingsRepository',
	useValue: Mutings,
};

const $blockingsRepository: Provider = {
	provide: 'blockingsRepository',
	useValue: Blockings,
};

const $swSubscriptionsRepository: Provider = {
	provide: 'swSubscriptionsRepository',
	useValue: SwSubscriptions,
};

const $hashtagsRepository: Provider = {
	provide: 'hashtagsRepository',
	useValue: Hashtags,
};

const $abuseUserReportsRepository: Provider = {
	provide: 'abuseUserReportsRepository',
	useValue: AbuseUserReports,
};

const $registrationTicketsRepository: Provider = {
	provide: 'registrationTicketsRepository',
	useValue: RegistrationTickets,
};

const $authSessionsRepository: Provider = {
	provide: 'authSessionsRepository',
	useValue: AuthSessions,
};

const $accessTokensRepository: Provider = {
	provide: 'accessTokensRepository',
	useValue: AccessTokens,
};

const $signinsRepository: Provider = {
	provide: 'signinsRepository',
	useValue: Signins,
};

const $messagingMessagesRepository: Provider = {
	provide: 'messagingMessagesRepository',
	useValue: MessagingMessages,
};

const $pagesRepository: Provider = {
	provide: 'pagesRepository',
	useValue: Pages,
};

const $pageLikesRepository: Provider = {
	provide: 'pageLikesRepository',
	useValue: PageLikes,
};

const $galleryPostsRepository: Provider = {
	provide: 'galleryPostsRepository',
	useValue: GalleryPosts,
};

const $galleryLikesRepository: Provider = {
	provide: 'galleryLikesRepository',
	useValue: GalleryLikes,
};

const $moderationLogsRepository: Provider = {
	provide: 'moderationLogsRepository',
	useValue: ModerationLogs,
};

const $clipsRepository: Provider = {
	provide: 'clipsRepository',
	useValue: Clips,
};

const $clipNotesRepository: Provider = {
	provide: 'clipNotesRepository',
	useValue: ClipNotes,
};

const $antennasRepository: Provider = {
	provide: 'antennasRepository',
	useValue: Antennas,
};

const $antennaNotesRepository: Provider = {
	provide: 'antennaNotesRepository',
	useValue: AntennaNotes,
};

const $promoNotesRepository: Provider = {
	provide: 'promoNotesRepository',
	useValue: PromoNotes,
};

const $promoReadsRepository: Provider = {
	provide: 'promoReadsRepository',
	useValue: PromoReads,
};

const $relaysRepository: Provider = {
	provide: 'relaysRepository',
	useValue: Relays,
};

const $mutedNotesRepository: Provider = {
	provide: 'mutedNotesRepository',
	useValue: MutedNotes,
};

const $channelsRepository: Provider = {
	provide: 'channelsRepository',
	useValue: Channels,
};

const $channelFollowingsRepository: Provider = {
	provide: 'channelFollowingsRepository',
	useValue: ChannelFollowings,
};

const $channelNotePiningsRepository: Provider = {
	provide: 'channelNotePiningsRepository',
	useValue: ChannelNotePinings,
};

const $registryItemsRepository: Provider = {
	provide: 'registryItemsRepository',
	useValue: RegistryItems,
};

const $webhooksRepository: Provider = {
	provide: 'webhooksRepository',
	useValue: Webhooks,
};

const $adsRepository: Provider = {
	provide: 'adsRepository',
	useValue: Ads,
};

const $passwordResetRequestsRepository: Provider = {
	provide: 'passwordResetRequestsRepository',
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
