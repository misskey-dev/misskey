/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Module } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import { MiAbuseUserReport, MiAccessToken, MiAd, MiAnnouncement, MiAnnouncementRead, MiAntenna, MiApp, MiAuthSession, MiAvatarDecoration, MiBlocking, MiChannel, MiChannelFavorite, MiChannelFollowing, MiClip, MiClipFavorite, MiClipNote, MiDriveFile, MiDriveFolder, MiEmoji, MiFlash, MiFlashLike, MiFollowRequest, MiFollowing, MiGalleryLike, MiGalleryPost, MiHashtag, MiInstance, MiMeta, MiModerationLog, MiMuting, MiNote, MiNoteFavorite, MiNoteReaction, MiNoteThreadMuting, MiNoteUnread, MiPage, MiPageLike, MiPasswordResetRequest, MiPoll, MiPollVote, MiPromoNote, MiPromoRead, MiRegistrationTicket, MiRegistryItem, MiRelay, MiRenoteMuting, MiRetentionAggregation, MiRole, MiRoleAssignment, MiSignin, MiSwSubscription, MiUsedUsername, MiUser, MiUserIp, MiUserKeypair, MiUserList, MiUserListFavorite, MiUserListMembership, MiUserMemo, MiUserNotePining, MiUserPending, MiUserProfile, MiUserPublickey, MiUserSecurityKey, MiWebhook } from './_.js';
import type { DataSource } from 'typeorm';
import type { Provider } from '@nestjs/common';

const $usersRepository: Provider = {
	provide: DI.usersRepository,
	useFactory: (db: DataSource) => db.getRepository(MiUser),
	inject: [DI.db],
};

const $notesRepository: Provider = {
	provide: DI.notesRepository,
	useFactory: (db: DataSource) => db.getRepository(MiNote),
	inject: [DI.db],
};

const $announcementsRepository: Provider = {
	provide: DI.announcementsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiAnnouncement),
	inject: [DI.db],
};

const $announcementReadsRepository: Provider = {
	provide: DI.announcementReadsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiAnnouncementRead),
	inject: [DI.db],
};

const $appsRepository: Provider = {
	provide: DI.appsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiApp),
	inject: [DI.db],
};

const $avatarDecorationsRepository: Provider = {
	provide: DI.avatarDecorationsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiAvatarDecoration),
	inject: [DI.db],
};

const $noteFavoritesRepository: Provider = {
	provide: DI.noteFavoritesRepository,
	useFactory: (db: DataSource) => db.getRepository(MiNoteFavorite),
	inject: [DI.db],
};

const $noteThreadMutingsRepository: Provider = {
	provide: DI.noteThreadMutingsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiNoteThreadMuting),
	inject: [DI.db],
};

const $noteReactionsRepository: Provider = {
	provide: DI.noteReactionsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiNoteReaction),
	inject: [DI.db],
};

const $noteUnreadsRepository: Provider = {
	provide: DI.noteUnreadsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiNoteUnread),
	inject: [DI.db],
};

const $pollsRepository: Provider = {
	provide: DI.pollsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiPoll),
	inject: [DI.db],
};

const $pollVotesRepository: Provider = {
	provide: DI.pollVotesRepository,
	useFactory: (db: DataSource) => db.getRepository(MiPollVote),
	inject: [DI.db],
};

const $userProfilesRepository: Provider = {
	provide: DI.userProfilesRepository,
	useFactory: (db: DataSource) => db.getRepository(MiUserProfile),
	inject: [DI.db],
};

const $userKeypairsRepository: Provider = {
	provide: DI.userKeypairsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiUserKeypair),
	inject: [DI.db],
};

const $userPendingsRepository: Provider = {
	provide: DI.userPendingsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiUserPending),
	inject: [DI.db],
};

const $userSecurityKeysRepository: Provider = {
	provide: DI.userSecurityKeysRepository,
	useFactory: (db: DataSource) => db.getRepository(MiUserSecurityKey),
	inject: [DI.db],
};

const $userPublickeysRepository: Provider = {
	provide: DI.userPublickeysRepository,
	useFactory: (db: DataSource) => db.getRepository(MiUserPublickey),
	inject: [DI.db],
};

const $userListsRepository: Provider = {
	provide: DI.userListsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiUserList),
	inject: [DI.db],
};

const $userListFavoritesRepository: Provider = {
	provide: DI.userListFavoritesRepository,
	useFactory: (db: DataSource) => db.getRepository(MiUserListFavorite),
	inject: [DI.db],
};

const $userListMembershipsRepository: Provider = {
	provide: DI.userListMembershipsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiUserListMembership),
	inject: [DI.db],
};

const $userNotePiningsRepository: Provider = {
	provide: DI.userNotePiningsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiUserNotePining),
	inject: [DI.db],
};

const $userIpsRepository: Provider = {
	provide: DI.userIpsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiUserIp),
	inject: [DI.db],
};

const $usedUsernamesRepository: Provider = {
	provide: DI.usedUsernamesRepository,
	useFactory: (db: DataSource) => db.getRepository(MiUsedUsername),
	inject: [DI.db],
};

const $followingsRepository: Provider = {
	provide: DI.followingsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiFollowing),
	inject: [DI.db],
};

const $followRequestsRepository: Provider = {
	provide: DI.followRequestsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiFollowRequest),
	inject: [DI.db],
};

const $instancesRepository: Provider = {
	provide: DI.instancesRepository,
	useFactory: (db: DataSource) => db.getRepository(MiInstance),
	inject: [DI.db],
};

const $emojisRepository: Provider = {
	provide: DI.emojisRepository,
	useFactory: (db: DataSource) => db.getRepository(MiEmoji),
	inject: [DI.db],
};

const $driveFilesRepository: Provider = {
	provide: DI.driveFilesRepository,
	useFactory: (db: DataSource) => db.getRepository(MiDriveFile),
	inject: [DI.db],
};

const $driveFoldersRepository: Provider = {
	provide: DI.driveFoldersRepository,
	useFactory: (db: DataSource) => db.getRepository(MiDriveFolder),
	inject: [DI.db],
};

const $metasRepository: Provider = {
	provide: DI.metasRepository,
	useFactory: (db: DataSource) => db.getRepository(MiMeta),
	inject: [DI.db],
};

const $mutingsRepository: Provider = {
	provide: DI.mutingsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiMuting),
	inject: [DI.db],
};

const $renoteMutingsRepository: Provider = {
	provide: DI.renoteMutingsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiRenoteMuting),
	inject: [DI.db],
};

const $blockingsRepository: Provider = {
	provide: DI.blockingsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiBlocking),
	inject: [DI.db],
};

const $swSubscriptionsRepository: Provider = {
	provide: DI.swSubscriptionsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiSwSubscription),
	inject: [DI.db],
};

const $hashtagsRepository: Provider = {
	provide: DI.hashtagsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiHashtag),
	inject: [DI.db],
};

const $abuseUserReportsRepository: Provider = {
	provide: DI.abuseUserReportsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiAbuseUserReport),
	inject: [DI.db],
};

const $registrationTicketsRepository: Provider = {
	provide: DI.registrationTicketsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiRegistrationTicket),
	inject: [DI.db],
};

const $authSessionsRepository: Provider = {
	provide: DI.authSessionsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiAuthSession),
	inject: [DI.db],
};

const $accessTokensRepository: Provider = {
	provide: DI.accessTokensRepository,
	useFactory: (db: DataSource) => db.getRepository(MiAccessToken),
	inject: [DI.db],
};

const $signinsRepository: Provider = {
	provide: DI.signinsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiSignin),
	inject: [DI.db],
};

const $pagesRepository: Provider = {
	provide: DI.pagesRepository,
	useFactory: (db: DataSource) => db.getRepository(MiPage),
	inject: [DI.db],
};

const $pageLikesRepository: Provider = {
	provide: DI.pageLikesRepository,
	useFactory: (db: DataSource) => db.getRepository(MiPageLike),
	inject: [DI.db],
};

const $galleryPostsRepository: Provider = {
	provide: DI.galleryPostsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiGalleryPost),
	inject: [DI.db],
};

const $galleryLikesRepository: Provider = {
	provide: DI.galleryLikesRepository,
	useFactory: (db: DataSource) => db.getRepository(MiGalleryLike),
	inject: [DI.db],
};

const $moderationLogsRepository: Provider = {
	provide: DI.moderationLogsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiModerationLog),
	inject: [DI.db],
};

const $clipsRepository: Provider = {
	provide: DI.clipsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiClip),
	inject: [DI.db],
};

const $clipNotesRepository: Provider = {
	provide: DI.clipNotesRepository,
	useFactory: (db: DataSource) => db.getRepository(MiClipNote),
	inject: [DI.db],
};

const $clipFavoritesRepository: Provider = {
	provide: DI.clipFavoritesRepository,
	useFactory: (db: DataSource) => db.getRepository(MiClipFavorite),
	inject: [DI.db],
};

const $antennasRepository: Provider = {
	provide: DI.antennasRepository,
	useFactory: (db: DataSource) => db.getRepository(MiAntenna),
	inject: [DI.db],
};

const $promoNotesRepository: Provider = {
	provide: DI.promoNotesRepository,
	useFactory: (db: DataSource) => db.getRepository(MiPromoNote),
	inject: [DI.db],
};

const $promoReadsRepository: Provider = {
	provide: DI.promoReadsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiPromoRead),
	inject: [DI.db],
};

const $relaysRepository: Provider = {
	provide: DI.relaysRepository,
	useFactory: (db: DataSource) => db.getRepository(MiRelay),
	inject: [DI.db],
};

const $channelsRepository: Provider = {
	provide: DI.channelsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiChannel),
	inject: [DI.db],
};

const $channelFollowingsRepository: Provider = {
	provide: DI.channelFollowingsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiChannelFollowing),
	inject: [DI.db],
};

const $channelFavoritesRepository: Provider = {
	provide: DI.channelFavoritesRepository,
	useFactory: (db: DataSource) => db.getRepository(MiChannelFavorite),
	inject: [DI.db],
};

const $registryItemsRepository: Provider = {
	provide: DI.registryItemsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiRegistryItem),
	inject: [DI.db],
};

const $webhooksRepository: Provider = {
	provide: DI.webhooksRepository,
	useFactory: (db: DataSource) => db.getRepository(MiWebhook),
	inject: [DI.db],
};

const $adsRepository: Provider = {
	provide: DI.adsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiAd),
	inject: [DI.db],
};

const $passwordResetRequestsRepository: Provider = {
	provide: DI.passwordResetRequestsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiPasswordResetRequest),
	inject: [DI.db],
};

const $retentionAggregationsRepository: Provider = {
	provide: DI.retentionAggregationsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiRetentionAggregation),
	inject: [DI.db],
};

const $flashsRepository: Provider = {
	provide: DI.flashsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiFlash),
	inject: [DI.db],
};

const $flashLikesRepository: Provider = {
	provide: DI.flashLikesRepository,
	useFactory: (db: DataSource) => db.getRepository(MiFlashLike),
	inject: [DI.db],
};

const $rolesRepository: Provider = {
	provide: DI.rolesRepository,
	useFactory: (db: DataSource) => db.getRepository(MiRole),
	inject: [DI.db],
};

const $roleAssignmentsRepository: Provider = {
	provide: DI.roleAssignmentsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiRoleAssignment),
	inject: [DI.db],
};

const $userMemosRepository: Provider = {
	provide: DI.userMemosRepository,
	useFactory: (db: DataSource) => db.getRepository(MiUserMemo),
	inject: [DI.db],
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
		$avatarDecorationsRepository,
		$noteFavoritesRepository,
		$noteThreadMutingsRepository,
		$noteReactionsRepository,
		$noteUnreadsRepository,
		$pollsRepository,
		$pollVotesRepository,
		$userProfilesRepository,
		$userKeypairsRepository,
		$userPendingsRepository,
		$userSecurityKeysRepository,
		$userPublickeysRepository,
		$userListsRepository,
		$userListFavoritesRepository,
		$userListMembershipsRepository,
		$userNotePiningsRepository,
		$userIpsRepository,
		$usedUsernamesRepository,
		$followingsRepository,
		$followRequestsRepository,
		$instancesRepository,
		$emojisRepository,
		$driveFilesRepository,
		$driveFoldersRepository,
		$metasRepository,
		$mutingsRepository,
		$renoteMutingsRepository,
		$blockingsRepository,
		$swSubscriptionsRepository,
		$hashtagsRepository,
		$abuseUserReportsRepository,
		$registrationTicketsRepository,
		$authSessionsRepository,
		$accessTokensRepository,
		$signinsRepository,
		$pagesRepository,
		$pageLikesRepository,
		$galleryPostsRepository,
		$galleryLikesRepository,
		$moderationLogsRepository,
		$clipsRepository,
		$clipNotesRepository,
		$clipFavoritesRepository,
		$antennasRepository,
		$promoNotesRepository,
		$promoReadsRepository,
		$relaysRepository,
		$channelsRepository,
		$channelFollowingsRepository,
		$channelFavoritesRepository,
		$registryItemsRepository,
		$webhooksRepository,
		$adsRepository,
		$passwordResetRequestsRepository,
		$retentionAggregationsRepository,
		$rolesRepository,
		$roleAssignmentsRepository,
		$flashsRepository,
		$flashLikesRepository,
		$userMemosRepository,
	],
	exports: [
		$usersRepository,
		$notesRepository,
		$announcementsRepository,
		$announcementReadsRepository,
		$appsRepository,
		$avatarDecorationsRepository,
		$noteFavoritesRepository,
		$noteThreadMutingsRepository,
		$noteReactionsRepository,
		$noteUnreadsRepository,
		$pollsRepository,
		$pollVotesRepository,
		$userProfilesRepository,
		$userKeypairsRepository,
		$userPendingsRepository,
		$userSecurityKeysRepository,
		$userPublickeysRepository,
		$userListsRepository,
		$userListFavoritesRepository,
		$userListMembershipsRepository,
		$userNotePiningsRepository,
		$userIpsRepository,
		$usedUsernamesRepository,
		$followingsRepository,
		$followRequestsRepository,
		$instancesRepository,
		$emojisRepository,
		$driveFilesRepository,
		$driveFoldersRepository,
		$metasRepository,
		$mutingsRepository,
		$renoteMutingsRepository,
		$blockingsRepository,
		$swSubscriptionsRepository,
		$hashtagsRepository,
		$abuseUserReportsRepository,
		$registrationTicketsRepository,
		$authSessionsRepository,
		$accessTokensRepository,
		$signinsRepository,
		$pagesRepository,
		$pageLikesRepository,
		$galleryPostsRepository,
		$galleryLikesRepository,
		$moderationLogsRepository,
		$clipsRepository,
		$clipNotesRepository,
		$clipFavoritesRepository,
		$antennasRepository,
		$promoNotesRepository,
		$promoReadsRepository,
		$relaysRepository,
		$channelsRepository,
		$channelFollowingsRepository,
		$channelFavoritesRepository,
		$registryItemsRepository,
		$webhooksRepository,
		$adsRepository,
		$passwordResetRequestsRepository,
		$retentionAggregationsRepository,
		$rolesRepository,
		$roleAssignmentsRepository,
		$flashsRepository,
		$flashLikesRepository,
		$userMemosRepository,
	],
})
export class RepositoryModule {}
