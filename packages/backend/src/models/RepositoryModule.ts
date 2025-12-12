/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Module } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import {
	MiAbuseReportNotificationRecipient,
	MiAbuseUserReport,
	MiAccessToken,
	MiAd,
	MiAnnouncement,
	MiAnnouncementRead,
	MiAntenna,
	MiApp,
	MiAuthSession,
	MiAvatarDecoration,
	MiBlocking,
	MiBubbleGameRecord,
	MiChannel,
	MiChannelFavorite,
	MiChannelFollowing,
	MiClip,
	MiClipFavorite,
	MiClipNote,
	MiDriveFile,
	MiDriveFolder,
	MiDrawingRoomSettings,
	MiDrawingUserSettings,
	MiEmoji,
	MiFlash,
	MiFlashLike,
	MiFollowing,
	MiFollowRequest,
	MiGalleryLike,
	MiGalleryPost,
	MiHashtag,
	MiInstance,
	MiMeta,
	MiModerationLog,
	MiMuting,
	MiNote,
	MiNoteFavorite,
	MiNoteReaction,
	MiNoteThreadMuting,
	MiNoteDraft,
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
	MiRenoteMuting,
	MiRepository,
	miRepository,
	MiRetentionAggregation,
	MiReversiGame,
	MiRole,
	MiRoleAssignment,
	MiSignin,
	MiSwSubscription,
	MiSystemAccount,
	MiSystemWebhook,
	MiUsedUsername,
	MiUser,
	MiUserIp,
	MiUserKeypair,
	MiUserList,
	MiUserListFavorite,
	MiUserListMembership,
	MiUserMemo,
	MiUserNotePining,
	MiUserPending,
	MiUserProfile,
	MiUserPublickey,
	MiUserSecurityKey,
	MiWebhook,
	MiChatMessage,
	MiChatRoom,
	MiChatRoomMembership,
	MiChatRoomInvitation,
	MiChatApproval,
	MiChatSecretSettings,
	NoctownPlayer,
	NoctownItem,
	NoctownPlayerItem,
	NoctownWallet,
	NoctownQuest,
	NoctownNpc,
	NoctownPlacedItem,
	NoctownDroppedItem,
	NoctownWorld,
	NoctownWorldChunk,
	NoctownPlayerScore,
	NoctownPlayerStatistics,
	NoctownFarmPlot,
	NoctownCrop,
	NoctownChicken,
	NoctownCow,
	NoctownRecipe,
	NoctownRecipeIngredient,
	NoctownTrade,
	NoctownTradeItem,
	NoctownInteriorMap,
	NoctownShopInventory,
	NoctownTreasureChest,
	NoctownHouse,
	NoctownHouseWallItem,
	NoctownHouseFurniture,
	NoctownBulletinBoard,
	NoctownBulletinPost,
	NoctownBulletinLike,
	NoctownAgent,
	NoctownGacha,
	NoctownGachaItem,
	NoctownGachaPull,
	NoctownEvent,
	NoctownEventReward,
	NoctownEventParticipation,
	NoctownUniqueItem,
	NoctownRankingBoard,
} from './_.js';
import type { Provider } from '@nestjs/common';
import type { DataSource } from 'typeorm';

const $usersRepository: Provider = {
	provide: DI.usersRepository,
	useFactory: (db: DataSource) => db.getRepository(MiUser).extend(miRepository as MiRepository<MiUser>),
	inject: [DI.db],
};

const $notesRepository: Provider = {
	provide: DI.notesRepository,
	useFactory: (db: DataSource) => db.getRepository(MiNote).extend(miRepository as MiRepository<MiNote>),
	inject: [DI.db],
};

const $announcementsRepository: Provider = {
	provide: DI.announcementsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiAnnouncement).extend(miRepository as MiRepository<MiAnnouncement>),
	inject: [DI.db],
};

const $announcementReadsRepository: Provider = {
	provide: DI.announcementReadsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiAnnouncementRead).extend(miRepository as MiRepository<MiAnnouncementRead>),
	inject: [DI.db],
};

const $appsRepository: Provider = {
	provide: DI.appsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiApp).extend(miRepository as MiRepository<MiApp>),
	inject: [DI.db],
};

const $avatarDecorationsRepository: Provider = {
	provide: DI.avatarDecorationsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiAvatarDecoration).extend(miRepository as MiRepository<MiAvatarDecoration>),
	inject: [DI.db],
};

const $noteFavoritesRepository: Provider = {
	provide: DI.noteFavoritesRepository,
	useFactory: (db: DataSource) => db.getRepository(MiNoteFavorite).extend(miRepository as MiRepository<MiNoteFavorite>),
	inject: [DI.db],
};

const $noteThreadMutingsRepository: Provider = {
	provide: DI.noteThreadMutingsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiNoteThreadMuting).extend(miRepository as MiRepository<MiNoteThreadMuting>),
	inject: [DI.db],
};

const $noteReactionsRepository: Provider = {
	provide: DI.noteReactionsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiNoteReaction).extend(miRepository as MiRepository<MiNoteReaction>),
	inject: [DI.db],
};

const $noteDraftsRepository: Provider = {
	provide: DI.noteDraftsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiNoteDraft).extend(miRepository as MiRepository<MiNoteDraft>),
	inject: [DI.db],
};

const $pollsRepository: Provider = {
	provide: DI.pollsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiPoll).extend(miRepository as MiRepository<MiPoll>),
	inject: [DI.db],
};

const $pollVotesRepository: Provider = {
	provide: DI.pollVotesRepository,
	useFactory: (db: DataSource) => db.getRepository(MiPollVote).extend(miRepository as MiRepository<MiPollVote>),
	inject: [DI.db],
};

const $userProfilesRepository: Provider = {
	provide: DI.userProfilesRepository,
	useFactory: (db: DataSource) => db.getRepository(MiUserProfile).extend(miRepository as MiRepository<MiUserProfile>),
	inject: [DI.db],
};

const $userKeypairsRepository: Provider = {
	provide: DI.userKeypairsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiUserKeypair).extend(miRepository as MiRepository<MiUserKeypair>),
	inject: [DI.db],
};

const $userPendingsRepository: Provider = {
	provide: DI.userPendingsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiUserPending).extend(miRepository as MiRepository<MiUserPending>),
	inject: [DI.db],
};

const $userSecurityKeysRepository: Provider = {
	provide: DI.userSecurityKeysRepository,
	useFactory: (db: DataSource) => db.getRepository(MiUserSecurityKey).extend(miRepository as MiRepository<MiUserSecurityKey>),
	inject: [DI.db],
};

const $userPublickeysRepository: Provider = {
	provide: DI.userPublickeysRepository,
	useFactory: (db: DataSource) => db.getRepository(MiUserPublickey).extend(miRepository as MiRepository<MiUserPublickey>),
	inject: [DI.db],
};

const $userListsRepository: Provider = {
	provide: DI.userListsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiUserList).extend(miRepository as MiRepository<MiUserList>),
	inject: [DI.db],
};

const $userListFavoritesRepository: Provider = {
	provide: DI.userListFavoritesRepository,
	useFactory: (db: DataSource) => db.getRepository(MiUserListFavorite).extend(miRepository as MiRepository<MiUserListFavorite>),
	inject: [DI.db],
};

const $userListMembershipsRepository: Provider = {
	provide: DI.userListMembershipsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiUserListMembership).extend(miRepository as MiRepository<MiUserListMembership>),
	inject: [DI.db],
};

const $userNotePiningsRepository: Provider = {
	provide: DI.userNotePiningsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiUserNotePining).extend(miRepository as MiRepository<MiUserNotePining>),
	inject: [DI.db],
};

const $userIpsRepository: Provider = {
	provide: DI.userIpsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiUserIp).extend(miRepository as MiRepository<MiUserIp>),
	inject: [DI.db],
};

const $usedUsernamesRepository: Provider = {
	provide: DI.usedUsernamesRepository,
	useFactory: (db: DataSource) => db.getRepository(MiUsedUsername).extend(miRepository as MiRepository<MiUsedUsername>),
	inject: [DI.db],
};

const $followingsRepository: Provider = {
	provide: DI.followingsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiFollowing).extend(miRepository as MiRepository<MiFollowing>),
	inject: [DI.db],
};

const $followRequestsRepository: Provider = {
	provide: DI.followRequestsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiFollowRequest).extend(miRepository as MiRepository<MiFollowRequest>),
	inject: [DI.db],
};

const $instancesRepository: Provider = {
	provide: DI.instancesRepository,
	useFactory: (db: DataSource) => db.getRepository(MiInstance).extend(miRepository as MiRepository<MiInstance>),
	inject: [DI.db],
};

const $emojisRepository: Provider = {
	provide: DI.emojisRepository,
	useFactory: (db: DataSource) => db.getRepository(MiEmoji).extend(miRepository as MiRepository<MiEmoji>),
	inject: [DI.db],
};

const $drawingRoomSettingsRepository: Provider = {
	provide: DI.drawingRoomSettingsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiDrawingRoomSettings).extend(miRepository as MiRepository<MiDrawingRoomSettings>),
	inject: [DI.db],
};

const $drawingUserSettingsRepository: Provider = {
	provide: DI.drawingUserSettingsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiDrawingUserSettings).extend(miRepository as MiRepository<MiDrawingUserSettings>),
	inject: [DI.db],
};

const $driveFilesRepository: Provider = {
	provide: DI.driveFilesRepository,
	useFactory: (db: DataSource) => db.getRepository(MiDriveFile).extend(miRepository as MiRepository<MiDriveFile>),
	inject: [DI.db],
};

const $driveFoldersRepository: Provider = {
	provide: DI.driveFoldersRepository,
	useFactory: (db: DataSource) => db.getRepository(MiDriveFolder).extend(miRepository as MiRepository<MiDriveFolder>),
	inject: [DI.db],
};

const $metasRepository: Provider = {
	provide: DI.metasRepository,
	useFactory: (db: DataSource) => db.getRepository(MiMeta).extend(miRepository as MiRepository<MiMeta>),
	inject: [DI.db],
};

const $mutingsRepository: Provider = {
	provide: DI.mutingsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiMuting).extend(miRepository as MiRepository<MiMuting>),
	inject: [DI.db],
};

const $renoteMutingsRepository: Provider = {
	provide: DI.renoteMutingsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiRenoteMuting).extend(miRepository as MiRepository<MiRenoteMuting>),
	inject: [DI.db],
};

const $blockingsRepository: Provider = {
	provide: DI.blockingsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiBlocking).extend(miRepository as MiRepository<MiBlocking>),
	inject: [DI.db],
};

const $swSubscriptionsRepository: Provider = {
	provide: DI.swSubscriptionsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiSwSubscription).extend(miRepository as MiRepository<MiSwSubscription>),
	inject: [DI.db],
};

const $systemAccountsRepository: Provider = {
	provide: DI.systemAccountsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiSystemAccount).extend(miRepository as MiRepository<MiSystemAccount>),
	inject: [DI.db],
};

const $hashtagsRepository: Provider = {
	provide: DI.hashtagsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiHashtag).extend(miRepository as MiRepository<MiHashtag>),
	inject: [DI.db],
};

const $abuseUserReportsRepository: Provider = {
	provide: DI.abuseUserReportsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiAbuseUserReport).extend(miRepository as MiRepository<MiAbuseUserReport>),
	inject: [DI.db],
};

const $abuseReportNotificationRecipientRepository: Provider = {
	provide: DI.abuseReportNotificationRecipientRepository,
	useFactory: (db: DataSource) => db.getRepository(MiAbuseReportNotificationRecipient).extend(miRepository as MiRepository<MiAbuseReportNotificationRecipient>),
	inject: [DI.db],
};

const $registrationTicketsRepository: Provider = {
	provide: DI.registrationTicketsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiRegistrationTicket).extend(miRepository as MiRepository<MiRegistrationTicket>),
	inject: [DI.db],
};

const $authSessionsRepository: Provider = {
	provide: DI.authSessionsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiAuthSession).extend(miRepository as MiRepository<MiAuthSession>),
	inject: [DI.db],
};

const $accessTokensRepository: Provider = {
	provide: DI.accessTokensRepository,
	useFactory: (db: DataSource) => db.getRepository(MiAccessToken).extend(miRepository as MiRepository<MiAccessToken>),
	inject: [DI.db],
};

const $signinsRepository: Provider = {
	provide: DI.signinsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiSignin).extend(miRepository as MiRepository<MiSignin>),
	inject: [DI.db],
};

const $pagesRepository: Provider = {
	provide: DI.pagesRepository,
	useFactory: (db: DataSource) => db.getRepository(MiPage).extend(miRepository as MiRepository<MiPage>),
	inject: [DI.db],
};

const $pageLikesRepository: Provider = {
	provide: DI.pageLikesRepository,
	useFactory: (db: DataSource) => db.getRepository(MiPageLike).extend(miRepository as MiRepository<MiPageLike>),
	inject: [DI.db],
};

const $galleryPostsRepository: Provider = {
	provide: DI.galleryPostsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiGalleryPost).extend(miRepository as MiRepository<MiGalleryPost>),
	inject: [DI.db],
};

const $galleryLikesRepository: Provider = {
	provide: DI.galleryLikesRepository,
	useFactory: (db: DataSource) => db.getRepository(MiGalleryLike).extend(miRepository as MiRepository<MiGalleryLike>),
	inject: [DI.db],
};

const $moderationLogsRepository: Provider = {
	provide: DI.moderationLogsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiModerationLog).extend(miRepository as MiRepository<MiModerationLog>),
	inject: [DI.db],
};

const $clipsRepository: Provider = {
	provide: DI.clipsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiClip).extend(miRepository as MiRepository<MiClip>),
	inject: [DI.db],
};

const $clipNotesRepository: Provider = {
	provide: DI.clipNotesRepository,
	useFactory: (db: DataSource) => db.getRepository(MiClipNote).extend(miRepository as MiRepository<MiClipNote>),
	inject: [DI.db],
};

const $clipFavoritesRepository: Provider = {
	provide: DI.clipFavoritesRepository,
	useFactory: (db: DataSource) => db.getRepository(MiClipFavorite).extend(miRepository as MiRepository<MiClipFavorite>),
	inject: [DI.db],
};

const $antennasRepository: Provider = {
	provide: DI.antennasRepository,
	useFactory: (db: DataSource) => db.getRepository(MiAntenna).extend(miRepository as MiRepository<MiAntenna>),
	inject: [DI.db],
};

const $promoNotesRepository: Provider = {
	provide: DI.promoNotesRepository,
	useFactory: (db: DataSource) => db.getRepository(MiPromoNote).extend(miRepository as MiRepository<MiPromoNote>),
	inject: [DI.db],
};

const $promoReadsRepository: Provider = {
	provide: DI.promoReadsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiPromoRead).extend(miRepository as MiRepository<MiPromoRead>),
	inject: [DI.db],
};

const $relaysRepository: Provider = {
	provide: DI.relaysRepository,
	useFactory: (db: DataSource) => db.getRepository(MiRelay).extend(miRepository as MiRepository<MiRelay>),
	inject: [DI.db],
};

const $channelsRepository: Provider = {
	provide: DI.channelsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiChannel).extend(miRepository as MiRepository<MiChannel>),
	inject: [DI.db],
};

const $channelFollowingsRepository: Provider = {
	provide: DI.channelFollowingsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiChannelFollowing).extend(miRepository as MiRepository<MiChannelFollowing>),
	inject: [DI.db],
};

const $channelFavoritesRepository: Provider = {
	provide: DI.channelFavoritesRepository,
	useFactory: (db: DataSource) => db.getRepository(MiChannelFavorite).extend(miRepository as MiRepository<MiChannelFavorite>),
	inject: [DI.db],
};

const $registryItemsRepository: Provider = {
	provide: DI.registryItemsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiRegistryItem).extend(miRepository as MiRepository<MiRegistryItem>),
	inject: [DI.db],
};

const $webhooksRepository: Provider = {
	provide: DI.webhooksRepository,
	useFactory: (db: DataSource) => db.getRepository(MiWebhook).extend(miRepository as MiRepository<MiWebhook>),
	inject: [DI.db],
};

const $systemWebhooksRepository: Provider = {
	provide: DI.systemWebhooksRepository,
	useFactory: (db: DataSource) => db.getRepository(MiSystemWebhook).extend(miRepository as MiRepository<MiSystemWebhook>),
	inject: [DI.db],
};

const $adsRepository: Provider = {
	provide: DI.adsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiAd).extend(miRepository as MiRepository<MiAd>),
	inject: [DI.db],
};

const $passwordResetRequestsRepository: Provider = {
	provide: DI.passwordResetRequestsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiPasswordResetRequest).extend(miRepository as MiRepository<MiPasswordResetRequest>),
	inject: [DI.db],
};

const $retentionAggregationsRepository: Provider = {
	provide: DI.retentionAggregationsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiRetentionAggregation).extend(miRepository as MiRepository<MiRetentionAggregation>),
	inject: [DI.db],
};

const $flashsRepository: Provider = {
	provide: DI.flashsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiFlash).extend(miRepository as MiRepository<MiFlash>),
	inject: [DI.db],
};

const $flashLikesRepository: Provider = {
	provide: DI.flashLikesRepository,
	useFactory: (db: DataSource) => db.getRepository(MiFlashLike).extend(miRepository as MiRepository<MiFlashLike>),
	inject: [DI.db],
};

const $rolesRepository: Provider = {
	provide: DI.rolesRepository,
	useFactory: (db: DataSource) => db.getRepository(MiRole).extend(miRepository as MiRepository<MiRole>),
	inject: [DI.db],
};

const $roleAssignmentsRepository: Provider = {
	provide: DI.roleAssignmentsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiRoleAssignment).extend(miRepository as MiRepository<MiRoleAssignment>),
	inject: [DI.db],
};

const $userMemosRepository: Provider = {
	provide: DI.userMemosRepository,
	useFactory: (db: DataSource) => db.getRepository(MiUserMemo).extend(miRepository as MiRepository<MiUserMemo>),
	inject: [DI.db],
};

const $chatMessagesRepository: Provider = {
	provide: DI.chatMessagesRepository,
	useFactory: (db: DataSource) => db.getRepository(MiChatMessage).extend(miRepository as MiRepository<MiChatMessage>),
	inject: [DI.db],
};

const $chatRoomsRepository: Provider = {
	provide: DI.chatRoomsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiChatRoom).extend(miRepository as MiRepository<MiChatRoom>),
	inject: [DI.db],
};

const $chatRoomMembershipsRepository: Provider = {
	provide: DI.chatRoomMembershipsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiChatRoomMembership).extend(miRepository as MiRepository<MiChatRoomMembership>),
	inject: [DI.db],
};

const $chatRoomInvitationsRepository: Provider = {
	provide: DI.chatRoomInvitationsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiChatRoomInvitation).extend(miRepository as MiRepository<MiChatRoomInvitation>),
	inject: [DI.db],
};

const $chatApprovalsRepository: Provider = {
	provide: DI.chatApprovalsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiChatApproval).extend(miRepository as MiRepository<MiChatApproval>),
	inject: [DI.db],
};

const $chatSecretSettingsRepository: Provider = {
	provide: DI.chatSecretSettingsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiChatSecretSettings).extend(miRepository as MiRepository<MiChatSecretSettings>),
	inject: [DI.db],
};

const $bubbleGameRecordsRepository: Provider = {
	provide: DI.bubbleGameRecordsRepository,
	useFactory: (db: DataSource) => db.getRepository(MiBubbleGameRecord).extend(miRepository as MiRepository<MiBubbleGameRecord>),
	inject: [DI.db],
};

const $reversiGamesRepository: Provider = {
	provide: DI.reversiGamesRepository,
	useFactory: (db: DataSource) => db.getRepository(MiReversiGame).extend(miRepository as MiRepository<MiReversiGame>),
	inject: [DI.db],
};

const $noctownPlayersRepository: Provider = {
	provide: DI.noctownPlayersRepository,
	useFactory: (db: DataSource) => db.getRepository(NoctownPlayer).extend(miRepository as MiRepository<NoctownPlayer>),
	inject: [DI.db],
};

const $noctownItemsRepository: Provider = {
	provide: DI.noctownItemsRepository,
	useFactory: (db: DataSource) => db.getRepository(NoctownItem).extend(miRepository as MiRepository<NoctownItem>),
	inject: [DI.db],
};

const $noctownPlayerItemsRepository: Provider = {
	provide: DI.noctownPlayerItemsRepository,
	useFactory: (db: DataSource) => db.getRepository(NoctownPlayerItem).extend(miRepository as MiRepository<NoctownPlayerItem>),
	inject: [DI.db],
};

const $noctownWalletsRepository: Provider = {
	provide: DI.noctownWalletsRepository,
	useFactory: (db: DataSource) => db.getRepository(NoctownWallet).extend(miRepository as MiRepository<NoctownWallet>),
	inject: [DI.db],
};

const $noctownQuestsRepository: Provider = {
	provide: DI.noctownQuestsRepository,
	useFactory: (db: DataSource) => db.getRepository(NoctownQuest).extend(miRepository as MiRepository<NoctownQuest>),
	inject: [DI.db],
};

const $noctownNpcsRepository: Provider = {
	provide: DI.noctownNpcsRepository,
	useFactory: (db: DataSource) => db.getRepository(NoctownNpc).extend(miRepository as MiRepository<NoctownNpc>),
	inject: [DI.db],
};

const $noctownPlacedItemsRepository: Provider = {
	provide: DI.noctownPlacedItemsRepository,
	useFactory: (db: DataSource) => db.getRepository(NoctownPlacedItem).extend(miRepository as MiRepository<NoctownPlacedItem>),
	inject: [DI.db],
};

const $noctownDroppedItemsRepository: Provider = {
	provide: DI.noctownDroppedItemsRepository,
	useFactory: (db: DataSource) => db.getRepository(NoctownDroppedItem).extend(miRepository as MiRepository<NoctownDroppedItem>),
	inject: [DI.db],
};

const $noctownWorldsRepository: Provider = {
	provide: DI.noctownWorldsRepository,
	useFactory: (db: DataSource) => db.getRepository(NoctownWorld).extend(miRepository as MiRepository<NoctownWorld>),
	inject: [DI.db],
};

const $noctownWorldChunksRepository: Provider = {
	provide: DI.noctownWorldChunksRepository,
	useFactory: (db: DataSource) => db.getRepository(NoctownWorldChunk).extend(miRepository as MiRepository<NoctownWorldChunk>),
	inject: [DI.db],
};

const $noctownPlayerScoresRepository: Provider = {
	provide: DI.noctownPlayerScoresRepository,
	useFactory: (db: DataSource) => db.getRepository(NoctownPlayerScore).extend(miRepository as MiRepository<NoctownPlayerScore>),
	inject: [DI.db],
};

const $noctownPlayerStatisticsRepository: Provider = {
	provide: DI.noctownPlayerStatisticsRepository,
	useFactory: (db: DataSource) => db.getRepository(NoctownPlayerStatistics).extend(miRepository as MiRepository<NoctownPlayerStatistics>),
	inject: [DI.db],
};

const $noctownFarmPlotsRepository: Provider = {
	provide: DI.noctownFarmPlotsRepository,
	useFactory: (db: DataSource) => db.getRepository(NoctownFarmPlot).extend(miRepository as MiRepository<NoctownFarmPlot>),
	inject: [DI.db],
};

const $noctownCropsRepository: Provider = {
	provide: DI.noctownCropsRepository,
	useFactory: (db: DataSource) => db.getRepository(NoctownCrop).extend(miRepository as MiRepository<NoctownCrop>),
	inject: [DI.db],
};

const $noctownChickensRepository: Provider = {
	provide: DI.noctownChickensRepository,
	useFactory: (db: DataSource) => db.getRepository(NoctownChicken).extend(miRepository as MiRepository<NoctownChicken>),
	inject: [DI.db],
};

const $noctownCowsRepository: Provider = {
	provide: DI.noctownCowsRepository,
	useFactory: (db: DataSource) => db.getRepository(NoctownCow).extend(miRepository as MiRepository<NoctownCow>),
	inject: [DI.db],
};

const $noctownRecipesRepository: Provider = {
	provide: DI.noctownRecipesRepository,
	useFactory: (db: DataSource) => db.getRepository(NoctownRecipe).extend(miRepository as MiRepository<NoctownRecipe>),
	inject: [DI.db],
};

const $noctownRecipeIngredientsRepository: Provider = {
	provide: DI.noctownRecipeIngredientsRepository,
	useFactory: (db: DataSource) => db.getRepository(NoctownRecipeIngredient).extend(miRepository as MiRepository<NoctownRecipeIngredient>),
	inject: [DI.db],
};

const $noctownTradesRepository: Provider = {
	provide: DI.noctownTradesRepository,
	useFactory: (db: DataSource) => db.getRepository(NoctownTrade).extend(miRepository as MiRepository<NoctownTrade>),
	inject: [DI.db],
};

const $noctownTradeItemsRepository: Provider = {
	provide: DI.noctownTradeItemsRepository,
	useFactory: (db: DataSource) => db.getRepository(NoctownTradeItem).extend(miRepository as MiRepository<NoctownTradeItem>),
	inject: [DI.db],
};

const $noctownInteriorMapsRepository: Provider = {
	provide: DI.noctownInteriorMapsRepository,
	useFactory: (db: DataSource) => db.getRepository(NoctownInteriorMap).extend(miRepository as MiRepository<NoctownInteriorMap>),
	inject: [DI.db],
};

const $noctownShopInventoriesRepository: Provider = {
	provide: DI.noctownShopInventoriesRepository,
	useFactory: (db: DataSource) => db.getRepository(NoctownShopInventory).extend(miRepository as MiRepository<NoctownShopInventory>),
	inject: [DI.db],
};

const $noctownTreasureChestsRepository: Provider = {
	provide: DI.noctownTreasureChestsRepository,
	useFactory: (db: DataSource) => db.getRepository(NoctownTreasureChest).extend(miRepository as MiRepository<NoctownTreasureChest>),
	inject: [DI.db],
};

const $noctownHousesRepository: Provider = {
	provide: DI.noctownHousesRepository,
	useFactory: (db: DataSource) => db.getRepository(NoctownHouse).extend(miRepository as MiRepository<NoctownHouse>),
	inject: [DI.db],
};

const $noctownHouseWallItemsRepository: Provider = {
	provide: DI.noctownHouseWallItemsRepository,
	useFactory: (db: DataSource) => db.getRepository(NoctownHouseWallItem).extend(miRepository as MiRepository<NoctownHouseWallItem>),
	inject: [DI.db],
};

const $noctownHouseFurnituresRepository: Provider = {
	provide: DI.noctownHouseFurnituresRepository,
	useFactory: (db: DataSource) => db.getRepository(NoctownHouseFurniture).extend(miRepository as MiRepository<NoctownHouseFurniture>),
	inject: [DI.db],
};

const $noctownBulletinBoardsRepository: Provider = {
	provide: DI.noctownBulletinBoardsRepository,
	useFactory: (db: DataSource) => db.getRepository(NoctownBulletinBoard).extend(miRepository as MiRepository<NoctownBulletinBoard>),
	inject: [DI.db],
};

const $noctownBulletinPostsRepository: Provider = {
	provide: DI.noctownBulletinPostsRepository,
	useFactory: (db: DataSource) => db.getRepository(NoctownBulletinPost).extend(miRepository as MiRepository<NoctownBulletinPost>),
	inject: [DI.db],
};

const $noctownBulletinLikesRepository: Provider = {
	provide: DI.noctownBulletinLikesRepository,
	useFactory: (db: DataSource) => db.getRepository(NoctownBulletinLike).extend(miRepository as MiRepository<NoctownBulletinLike>),
	inject: [DI.db],
};

const $noctownAgentsRepository: Provider = {
	provide: DI.noctownAgentsRepository,
	useFactory: (db: DataSource) => db.getRepository(NoctownAgent).extend(miRepository as MiRepository<NoctownAgent>),
	inject: [DI.db],
};

const $noctownGachasRepository: Provider = {
	provide: DI.noctownGachasRepository,
	useFactory: (db: DataSource) => db.getRepository(NoctownGacha).extend(miRepository as MiRepository<NoctownGacha>),
	inject: [DI.db],
};

const $noctownGachaItemsRepository: Provider = {
	provide: DI.noctownGachaItemsRepository,
	useFactory: (db: DataSource) => db.getRepository(NoctownGachaItem).extend(miRepository as MiRepository<NoctownGachaItem>),
	inject: [DI.db],
};

const $noctownGachaPullsRepository: Provider = {
	provide: DI.noctownGachaPullsRepository,
	useFactory: (db: DataSource) => db.getRepository(NoctownGachaPull).extend(miRepository as MiRepository<NoctownGachaPull>),
	inject: [DI.db],
};

const $noctownEventsRepository: Provider = {
	provide: DI.noctownEventsRepository,
	useFactory: (db: DataSource) => db.getRepository(NoctownEvent).extend(miRepository as MiRepository<NoctownEvent>),
	inject: [DI.db],
};

const $noctownEventRewardsRepository: Provider = {
	provide: DI.noctownEventRewardsRepository,
	useFactory: (db: DataSource) => db.getRepository(NoctownEventReward).extend(miRepository as MiRepository<NoctownEventReward>),
	inject: [DI.db],
};

const $noctownEventParticipationsRepository: Provider = {
	provide: DI.noctownEventParticipationsRepository,
	useFactory: (db: DataSource) => db.getRepository(NoctownEventParticipation).extend(miRepository as MiRepository<NoctownEventParticipation>),
	inject: [DI.db],
};

const $noctownUniqueItemsRepository: Provider = {
	provide: DI.noctownUniqueItemsRepository,
	useFactory: (db: DataSource) => db.getRepository(NoctownUniqueItem).extend(miRepository as MiRepository<NoctownUniqueItem>),
	inject: [DI.db],
};

const $noctownRankingBoardsRepository: Provider = {
	provide: DI.noctownRankingBoardsRepository,
	useFactory: (db: DataSource) => db.getRepository(NoctownRankingBoard).extend(miRepository as MiRepository<NoctownRankingBoard>),
	inject: [DI.db],
};

@Module({
	imports: [],
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
		$noteDraftsRepository,
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
		$drawingRoomSettingsRepository,
		$drawingUserSettingsRepository,
		$driveFilesRepository,
		$driveFoldersRepository,
		$metasRepository,
		$mutingsRepository,
		$renoteMutingsRepository,
		$blockingsRepository,
		$swSubscriptionsRepository,
		$systemAccountsRepository,
		$hashtagsRepository,
		$abuseUserReportsRepository,
		$abuseReportNotificationRecipientRepository,
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
		$systemWebhooksRepository,
		$adsRepository,
		$passwordResetRequestsRepository,
		$retentionAggregationsRepository,
		$rolesRepository,
		$roleAssignmentsRepository,
		$flashsRepository,
		$flashLikesRepository,
		$userMemosRepository,
		$chatMessagesRepository,
		$chatRoomsRepository,
		$chatRoomMembershipsRepository,
		$chatRoomInvitationsRepository,
		$chatApprovalsRepository,
		$chatSecretSettingsRepository,
		$bubbleGameRecordsRepository,
		$reversiGamesRepository,
		$noctownPlayersRepository,
		$noctownItemsRepository,
		$noctownPlayerItemsRepository,
		$noctownWalletsRepository,
		$noctownQuestsRepository,
		$noctownNpcsRepository,
		$noctownPlacedItemsRepository,
		$noctownDroppedItemsRepository,
		$noctownWorldsRepository,
		$noctownWorldChunksRepository,
		$noctownPlayerScoresRepository,
		$noctownPlayerStatisticsRepository,
		$noctownFarmPlotsRepository,
		$noctownCropsRepository,
		$noctownChickensRepository,
		$noctownCowsRepository,
		$noctownRecipesRepository,
		$noctownRecipeIngredientsRepository,
		$noctownTradesRepository,
		$noctownTradeItemsRepository,
		$noctownInteriorMapsRepository,
		$noctownShopInventoriesRepository,
		$noctownTreasureChestsRepository,
		$noctownHousesRepository,
		$noctownHouseWallItemsRepository,
		$noctownHouseFurnituresRepository,
		$noctownBulletinBoardsRepository,
		$noctownBulletinPostsRepository,
		$noctownBulletinLikesRepository,
		$noctownAgentsRepository,
		$noctownGachasRepository,
		$noctownGachaItemsRepository,
		$noctownGachaPullsRepository,
		$noctownEventsRepository,
		$noctownEventRewardsRepository,
		$noctownEventParticipationsRepository,
		$noctownUniqueItemsRepository,
		$noctownRankingBoardsRepository,
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
		$noteDraftsRepository,
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
		$drawingRoomSettingsRepository,
		$drawingUserSettingsRepository,
		$driveFilesRepository,
		$driveFoldersRepository,
		$metasRepository,
		$mutingsRepository,
		$renoteMutingsRepository,
		$blockingsRepository,
		$swSubscriptionsRepository,
		$systemAccountsRepository,
		$hashtagsRepository,
		$abuseUserReportsRepository,
		$abuseReportNotificationRecipientRepository,
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
		$systemWebhooksRepository,
		$adsRepository,
		$passwordResetRequestsRepository,
		$retentionAggregationsRepository,
		$rolesRepository,
		$roleAssignmentsRepository,
		$flashsRepository,
		$flashLikesRepository,
		$userMemosRepository,
		$chatMessagesRepository,
		$chatRoomsRepository,
		$chatRoomMembershipsRepository,
		$chatRoomInvitationsRepository,
		$chatApprovalsRepository,
		$chatSecretSettingsRepository,
		$bubbleGameRecordsRepository,
		$reversiGamesRepository,
		$noctownPlayersRepository,
		$noctownItemsRepository,
		$noctownPlayerItemsRepository,
		$noctownWalletsRepository,
		$noctownQuestsRepository,
		$noctownNpcsRepository,
		$noctownPlacedItemsRepository,
		$noctownDroppedItemsRepository,
		$noctownWorldsRepository,
		$noctownWorldChunksRepository,
		$noctownPlayerScoresRepository,
		$noctownPlayerStatisticsRepository,
		$noctownFarmPlotsRepository,
		$noctownCropsRepository,
		$noctownChickensRepository,
		$noctownCowsRepository,
		$noctownRecipesRepository,
		$noctownRecipeIngredientsRepository,
		$noctownTradesRepository,
		$noctownTradeItemsRepository,
		$noctownInteriorMapsRepository,
		$noctownShopInventoriesRepository,
		$noctownTreasureChestsRepository,
		$noctownHousesRepository,
		$noctownHouseWallItemsRepository,
		$noctownHouseFurnituresRepository,
		$noctownBulletinBoardsRepository,
		$noctownBulletinPostsRepository,
		$noctownBulletinLikesRepository,
		$noctownAgentsRepository,
		$noctownGachasRepository,
		$noctownGachaItemsRepository,
		$noctownGachaPullsRepository,
		$noctownEventsRepository,
		$noctownEventRewardsRepository,
		$noctownEventParticipationsRepository,
		$noctownUniqueItemsRepository,
		$noctownRankingBoardsRepository,
	],
})
export class RepositoryModule {
}
