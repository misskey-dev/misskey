/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	FindOneOptions,
	InsertQueryBuilder,
	ObjectLiteral,
	QueryRunner,
	Repository,
	SelectQueryBuilder,
} from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions.js';
import { RelationCountLoader } from 'typeorm/query-builder/relation-count/RelationCountLoader.js';
import { RelationIdLoader } from 'typeorm/query-builder/relation-id/RelationIdLoader.js';
import {
	RawSqlResultsToEntityTransformer,
} from 'typeorm/query-builder/transformer/RawSqlResultsToEntityTransformer.js';
import { MiAbuseReportNotificationRecipient } from '@/models/AbuseReportNotificationRecipient.js';
import { MiAbuseUserReport } from '@/models/AbuseUserReport.js';
import { MiAccessToken } from '@/models/AccessToken.js';
import { MiAd } from '@/models/Ad.js';
import { MiAnnouncement } from '@/models/Announcement.js';
import { MiAnnouncementRead } from '@/models/AnnouncementRead.js';
import { MiAntenna } from '@/models/Antenna.js';
import { MiApp } from '@/models/App.js';
import { MiAuthSession } from '@/models/AuthSession.js';
import { MiAvatarDecoration } from '@/models/AvatarDecoration.js';
import { MiBlocking } from '@/models/Blocking.js';
import { MiBubbleGameRecord } from '@/models/BubbleGameRecord.js';
import { MiChannel } from '@/models/Channel.js';
import { MiChannelFavorite } from '@/models/ChannelFavorite.js';
import { MiChannelFollowing } from '@/models/ChannelFollowing.js';
import { MiChatApproval } from '@/models/ChatApproval.js';
import { MiChatMessage } from '@/models/ChatMessage.js';
import { MiChatRoom } from '@/models/ChatRoom.js';
import { MiChatRoomInvitation } from '@/models/ChatRoomInvitation.js';
import { MiChatRoomMembership } from '@/models/ChatRoomMembership.js';
import { MiChatSecretSettings } from '@/models/ChatSecretSettings.js';
import { MiClip } from '@/models/Clip.js';
import { MiClipFavorite } from '@/models/ClipFavorite.js';
import { MiClipNote } from '@/models/ClipNote.js';
import { MiDrawingRoomSettings } from '@/models/DrawingRoomSettings.js';
import { MiDrawingUserSettings } from '@/models/DrawingUserSettings.js';
import { MiDriveFile } from '@/models/DriveFile.js';
import { MiDriveFolder } from '@/models/DriveFolder.js';
import { MiEmoji } from '@/models/Emoji.js';
import { MiFlash } from '@/models/Flash.js';
import { MiFlashLike } from '@/models/FlashLike.js';
import { MiFollowing } from '@/models/Following.js';
import { MiFollowRequest } from '@/models/FollowRequest.js';
import { MiGalleryLike } from '@/models/GalleryLike.js';
import { MiGalleryPost } from '@/models/GalleryPost.js';
import { MiHashtag } from '@/models/Hashtag.js';
import { MiInstance } from '@/models/Instance.js';
import { MiMeta } from '@/models/Meta.js';
import { MiModerationLog } from '@/models/ModerationLog.js';
import { MiMuting } from '@/models/Muting.js';
import { MiNote } from '@/models/Note.js';
import { MiNoteDraft } from '@/models/NoteDraft.js';
import { MiNoteFavorite } from '@/models/NoteFavorite.js';
import { MiNoteReaction } from '@/models/NoteReaction.js';
import { MiNoteThreadMuting } from '@/models/NoteThreadMuting.js';
import { MiPage } from '@/models/Page.js';
import { MiPageLike } from '@/models/PageLike.js';
import { MiPasswordResetRequest } from '@/models/PasswordResetRequest.js';
import { MiPoll } from '@/models/Poll.js';
import { MiPollVote } from '@/models/PollVote.js';
import { MiPromoNote } from '@/models/PromoNote.js';
import { MiPromoRead } from '@/models/PromoRead.js';
import { MiRegistrationTicket } from '@/models/RegistrationTicket.js';
import { MiRegistryItem } from '@/models/RegistryItem.js';
import { MiRelay } from '@/models/Relay.js';
import { MiRenoteMuting } from '@/models/RenoteMuting.js';
import { MiRetentionAggregation } from '@/models/RetentionAggregation.js';
import { MiReversiGame } from '@/models/ReversiGame.js';
import { MiRole } from '@/models/Role.js';
import { MiRoleAssignment } from '@/models/RoleAssignment.js';
import { MiSignin } from '@/models/Signin.js';
import { MiSwSubscription } from '@/models/SwSubscription.js';
import { MiSystemAccount } from '@/models/SystemAccount.js';
import { MiSystemWebhook } from '@/models/SystemWebhook.js';
import { MiUsedUsername } from '@/models/UsedUsername.js';
import { MiUser } from '@/models/User.js';
import { MiUserIp } from '@/models/UserIp.js';
import { MiUserKeypair } from '@/models/UserKeypair.js';
import { MiUserList } from '@/models/UserList.js';
import { MiUserListFavorite } from '@/models/UserListFavorite.js';
import { MiUserListMembership } from '@/models/UserListMembership.js';
import { MiUserMemo } from '@/models/UserMemo.js';
import { MiUserNotePining } from '@/models/UserNotePining.js';
import { MiUserPending } from '@/models/UserPending.js';
import { MiUserProfile } from '@/models/UserProfile.js';
import { MiUserPublickey } from '@/models/UserPublickey.js';
import { MiUserSecurityKey } from '@/models/UserSecurityKey.js';
import { MiWebhook } from '@/models/Webhook.js';
import { NoctownPlayer } from '@/models/noctown/NoctownPlayer.js';
import { NoctownItem } from '@/models/noctown/NoctownItem.js';
import { NoctownPlayerItem } from '@/models/noctown/NoctownPlayerItem.js';
import { NoctownWallet } from '@/models/noctown/NoctownWallet.js';
import { NoctownQuest } from '@/models/noctown/NoctownQuest.js';
import { NoctownNpc } from '@/models/noctown/NoctownNpc.js';
import { NoctownPlacedItem } from '@/models/noctown/NoctownPlacedItem.js';
import { NoctownDroppedItem } from '@/models/noctown/NoctownDroppedItem.js';
import { NoctownWorld } from '@/models/noctown/NoctownWorld.js';
import { NoctownWorldChunk } from '@/models/noctown/NoctownWorldChunk.js';
import { NoctownPlayerScore } from '@/models/noctown/NoctownPlayerScore.js';
import { NoctownPlayerStatistics } from '@/models/noctown/NoctownPlayerStatistics.js';
import { NoctownFarmPlot } from '@/models/noctown/NoctownFarmPlot.js';
import { NoctownCrop } from '@/models/noctown/NoctownCrop.js';
import { NoctownChicken } from '@/models/noctown/NoctownChicken.js';
import { NoctownCow } from '@/models/noctown/NoctownCow.js';
import { NoctownRecipe } from '@/models/noctown/NoctownRecipe.js';
import { NoctownRecipeIngredient } from '@/models/noctown/NoctownRecipeIngredient.js';
import { NoctownTrade } from '@/models/noctown/NoctownTrade.js';
import { NoctownTradeItem } from '@/models/noctown/NoctownTradeItem.js';
import { NoctownInteriorMap } from '@/models/noctown/NoctownInteriorMap.js';
import { NoctownShopInventory } from '@/models/noctown/NoctownShopInventory.js';
import { NoctownTreasureChest } from '@/models/noctown/NoctownTreasureChest.js';
import { NoctownHouse } from '@/models/noctown/NoctownHouse.js';
import { NoctownHouseWallItem } from '@/models/noctown/NoctownHouseWallItem.js';
import { NoctownHouseFurniture } from '@/models/noctown/NoctownHouseFurniture.js';
import { NoctownBulletinBoard } from '@/models/noctown/NoctownBulletinBoard.js';
import { NoctownBulletinPost } from '@/models/noctown/NoctownBulletinPost.js';
import { NoctownBulletinLike } from '@/models/noctown/NoctownBulletinLike.js';
import { NoctownAgent } from '@/models/noctown/NoctownAgent.js';
import { NoctownGacha } from '@/models/noctown/NoctownGacha.js';
import { NoctownGachaItem } from '@/models/noctown/NoctownGachaItem.js';
import { NoctownGachaPull } from '@/models/noctown/NoctownGachaPull.js';
import { NoctownEvent } from '@/models/noctown/NoctownEvent.js';
import { NoctownEventReward } from '@/models/noctown/NoctownEventReward.js';
import { NoctownEventParticipation } from '@/models/noctown/NoctownEventParticipation.js';
import { NoctownUniqueItem } from '@/models/noctown/NoctownUniqueItem.js';
import { NoctownRankingBoard } from '@/models/noctown/NoctownRankingBoard.js';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity.js';

export interface MiRepository<T extends ObjectLiteral> {
	createTableColumnNames(this: Repository<T> & MiRepository<T>): string[];

	insertOne(this: Repository<T> & MiRepository<T>, entity: QueryDeepPartialEntity<T>, findOptions?: Pick<FindOneOptions<T>, 'relations'>): Promise<T>;

	insertOneImpl(this: Repository<T> & MiRepository<T>, entity: QueryDeepPartialEntity<T>, findOptions?: Pick<FindOneOptions<T>, 'relations'>, queryRunner?: QueryRunner): Promise<T>;

	selectAliasColumnNames(this: Repository<T> & MiRepository<T>, queryBuilder: InsertQueryBuilder<T>, builder: SelectQueryBuilder<T>): void;
}

export const miRepository = {
	createTableColumnNames() {
		return this.metadata.columns.filter(column => column.isSelect && !column.isVirtual).map(column => column.databaseName);
	},
	async insertOne(entity, findOptions?) {
		const opt = this.manager.connection.options as PostgresConnectionOptions;
		if (opt.replication) {
			const queryRunner = this.manager.connection.createQueryRunner('master');
			try {
				return this.insertOneImpl(entity, findOptions, queryRunner);
			} finally {
				await queryRunner.release();
			}
		} else {
			return this.insertOneImpl(entity, findOptions);
		}
	},
	async insertOneImpl(entity, findOptions?, queryRunner?) {
		// ---- insert + returningの結果を共通テーブル式(CTE)に保持するクエリを生成 ----

		const queryBuilder = this.createQueryBuilder().insert().values(entity);
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const mainAlias = queryBuilder.expressionMap.mainAlias!;
		const name = mainAlias.name;
		mainAlias.name = 't';
		const columnNames = this.createTableColumnNames();
		queryBuilder.returning(columnNames.reduce((a, c) => `${a}, ${queryBuilder.escape(c)}`, '').slice(2));

		// ---- 共通テーブル式(CTE)から結果を取得 ----
		const builder = this.createQueryBuilder(undefined, queryRunner).addCommonTableExpression(queryBuilder, 'cte', { columnNames });
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		builder.expressionMap.mainAlias!.tablePath = 'cte';
		this.selectAliasColumnNames(queryBuilder, builder);
		if (findOptions) {
			builder.setFindOptions(findOptions);
		}
		const raw = await builder.execute();
		mainAlias.name = name;
		const relationId = await new RelationIdLoader(builder.connection, this.queryRunner, builder.expressionMap.relationIdAttributes).load(raw);
		const relationCount = await new RelationCountLoader(builder.connection, this.queryRunner, builder.expressionMap.relationCountAttributes).load(raw);
		const result = new RawSqlResultsToEntityTransformer(builder.expressionMap, builder.connection.driver, relationId, relationCount, this.queryRunner).transform(raw, mainAlias);
		return result[0];
	},
	selectAliasColumnNames(queryBuilder, builder) {
		let selectOrAddSelect = (selection: string, selectionAliasName?: string) => {
			selectOrAddSelect = (selection, selectionAliasName) => builder.addSelect(selection, selectionAliasName);
			return builder.select(selection, selectionAliasName);
		};
		for (const columnName of this.createTableColumnNames()) {
			selectOrAddSelect(`${builder.alias}.${columnName}`, `${builder.alias}_${columnName}`);
		}
	},
} satisfies MiRepository<ObjectLiteral>;

export {
	MiAbuseUserReport,
	MiAbuseReportNotificationRecipient,
	MiAccessToken,
	MiAd,
	MiAnnouncement,
	MiAnnouncementRead,
	MiAntenna,
	MiApp,
	MiAvatarDecoration,
	MiAuthSession,
	MiBlocking,
	MiChannelFollowing,
	MiChannelFavorite,
	MiClip,
	MiClipNote,
	MiClipFavorite,
	MiDrawingRoomSettings,
	MiDrawingUserSettings,
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
	MiMuting,
	MiRenoteMuting,
	MiNote,
	MiNoteDraft,
	MiNoteFavorite,
	MiNoteReaction,
	MiNoteThreadMuting,
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
	MiSystemAccount,
	MiUsedUsername,
	MiUser,
	MiUserIp,
	MiUserKeypair,
	MiUserList,
	MiUserListFavorite,
	MiUserListMembership,
	MiUserNotePining,
	MiUserPending,
	MiUserProfile,
	MiUserPublickey,
	MiUserSecurityKey,
	MiWebhook,
	MiSystemWebhook,
	MiChannel,
	MiRetentionAggregation,
	MiRole,
	MiRoleAssignment,
	MiFlash,
	MiFlashLike,
	MiUserMemo,
	MiChatMessage,
	MiChatRoom,
	MiChatRoomMembership,
	MiChatRoomInvitation,
	MiChatApproval,
	MiChatSecretSettings,
	MiBubbleGameRecord,
	MiReversiGame,
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
};

export type AbuseUserReportsRepository = Repository<MiAbuseUserReport> & MiRepository<MiAbuseUserReport>;
export type AbuseReportNotificationRecipientRepository =
	Repository<MiAbuseReportNotificationRecipient>
	& MiRepository<MiAbuseReportNotificationRecipient>;
export type AccessTokensRepository = Repository<MiAccessToken> & MiRepository<MiAccessToken>;
export type AdsRepository = Repository<MiAd> & MiRepository<MiAd>;
export type AnnouncementsRepository = Repository<MiAnnouncement> & MiRepository<MiAnnouncement>;
export type AnnouncementReadsRepository = Repository<MiAnnouncementRead> & MiRepository<MiAnnouncementRead>;
export type AntennasRepository = Repository<MiAntenna> & MiRepository<MiAntenna>;
export type AppsRepository = Repository<MiApp> & MiRepository<MiApp>;
export type AvatarDecorationsRepository = Repository<MiAvatarDecoration> & MiRepository<MiAvatarDecoration>;
export type AuthSessionsRepository = Repository<MiAuthSession> & MiRepository<MiAuthSession>;
export type BlockingsRepository = Repository<MiBlocking> & MiRepository<MiBlocking>;
export type ChannelFollowingsRepository = Repository<MiChannelFollowing> & MiRepository<MiChannelFollowing>;
export type ChannelFavoritesRepository = Repository<MiChannelFavorite> & MiRepository<MiChannelFavorite>;
export type ClipsRepository = Repository<MiClip> & MiRepository<MiClip>;
export type ClipNotesRepository = Repository<MiClipNote> & MiRepository<MiClipNote>;
export type ClipFavoritesRepository = Repository<MiClipFavorite> & MiRepository<MiClipFavorite>;
export type DrawingRoomSettingsRepository = Repository<MiDrawingRoomSettings> & MiRepository<MiDrawingRoomSettings>;
export type DrawingUserSettingsRepository = Repository<MiDrawingUserSettings> & MiRepository<MiDrawingUserSettings>;
export type DriveFilesRepository = Repository<MiDriveFile> & MiRepository<MiDriveFile>;
export type DriveFoldersRepository = Repository<MiDriveFolder> & MiRepository<MiDriveFolder>;
export type EmojisRepository = Repository<MiEmoji> & MiRepository<MiEmoji>;
export type FollowingsRepository = Repository<MiFollowing> & MiRepository<MiFollowing>;
export type FollowRequestsRepository = Repository<MiFollowRequest> & MiRepository<MiFollowRequest>;
export type GalleryLikesRepository = Repository<MiGalleryLike> & MiRepository<MiGalleryLike>;
export type GalleryPostsRepository = Repository<MiGalleryPost> & MiRepository<MiGalleryPost>;
export type HashtagsRepository = Repository<MiHashtag> & MiRepository<MiHashtag>;
export type InstancesRepository = Repository<MiInstance> & MiRepository<MiInstance>;
export type MetasRepository = Repository<MiMeta> & MiRepository<MiMeta>;
export type ModerationLogsRepository = Repository<MiModerationLog> & MiRepository<MiModerationLog>;
export type MutingsRepository = Repository<MiMuting> & MiRepository<MiMuting>;
export type RenoteMutingsRepository = Repository<MiRenoteMuting> & MiRepository<MiRenoteMuting>;
export type NotesRepository = Repository<MiNote> & MiRepository<MiNote>;
export type NoteDraftsRepository = Repository<MiNoteDraft> & MiRepository<MiNoteDraft>;
export type NoteFavoritesRepository = Repository<MiNoteFavorite> & MiRepository<MiNoteFavorite>;
export type NoteReactionsRepository = Repository<MiNoteReaction> & MiRepository<MiNoteReaction>;
export type NoteThreadMutingsRepository = Repository<MiNoteThreadMuting> & MiRepository<MiNoteThreadMuting>;
export type PagesRepository = Repository<MiPage> & MiRepository<MiPage>;
export type PageLikesRepository = Repository<MiPageLike> & MiRepository<MiPageLike>;
export type PasswordResetRequestsRepository = Repository<MiPasswordResetRequest> & MiRepository<MiPasswordResetRequest>;
export type PollsRepository = Repository<MiPoll> & MiRepository<MiPoll>;
export type PollVotesRepository = Repository<MiPollVote> & MiRepository<MiPollVote>;
export type PromoNotesRepository = Repository<MiPromoNote> & MiRepository<MiPromoNote>;
export type PromoReadsRepository = Repository<MiPromoRead> & MiRepository<MiPromoRead>;
export type RegistrationTicketsRepository = Repository<MiRegistrationTicket> & MiRepository<MiRegistrationTicket>;
export type RegistryItemsRepository = Repository<MiRegistryItem> & MiRepository<MiRegistryItem>;
export type RelaysRepository = Repository<MiRelay> & MiRepository<MiRelay>;
export type SigninsRepository = Repository<MiSignin> & MiRepository<MiSignin>;
export type SwSubscriptionsRepository = Repository<MiSwSubscription> & MiRepository<MiSwSubscription>;
export type SystemAccountsRepository = Repository<MiSystemAccount> & MiRepository<MiSystemAccount>;
export type UsedUsernamesRepository = Repository<MiUsedUsername> & MiRepository<MiUsedUsername>;
export type UsersRepository = Repository<MiUser> & MiRepository<MiUser>;
export type UserIpsRepository = Repository<MiUserIp> & MiRepository<MiUserIp>;
export type UserKeypairsRepository = Repository<MiUserKeypair> & MiRepository<MiUserKeypair>;
export type UserListsRepository = Repository<MiUserList> & MiRepository<MiUserList>;
export type UserListFavoritesRepository = Repository<MiUserListFavorite> & MiRepository<MiUserListFavorite>;
export type UserListMembershipsRepository = Repository<MiUserListMembership> & MiRepository<MiUserListMembership>;
export type UserNotePiningsRepository = Repository<MiUserNotePining> & MiRepository<MiUserNotePining>;
export type UserPendingsRepository = Repository<MiUserPending> & MiRepository<MiUserPending>;
export type UserProfilesRepository = Repository<MiUserProfile> & MiRepository<MiUserProfile>;
export type UserPublickeysRepository = Repository<MiUserPublickey> & MiRepository<MiUserPublickey>;
export type UserSecurityKeysRepository = Repository<MiUserSecurityKey> & MiRepository<MiUserSecurityKey>;
export type WebhooksRepository = Repository<MiWebhook> & MiRepository<MiWebhook>;
export type SystemWebhooksRepository = Repository<MiSystemWebhook> & MiRepository<MiWebhook>;
export type ChannelsRepository = Repository<MiChannel> & MiRepository<MiChannel>;
export type RetentionAggregationsRepository = Repository<MiRetentionAggregation> & MiRepository<MiRetentionAggregation>;
export type RolesRepository = Repository<MiRole> & MiRepository<MiRole>;
export type RoleAssignmentsRepository = Repository<MiRoleAssignment> & MiRepository<MiRoleAssignment>;
export type FlashsRepository = Repository<MiFlash> & MiRepository<MiFlash>;
export type FlashLikesRepository = Repository<MiFlashLike> & MiRepository<MiFlashLike>;
export type UserMemoRepository = Repository<MiUserMemo> & MiRepository<MiUserMemo>;
export type ChatMessagesRepository = Repository<MiChatMessage> & MiRepository<MiChatMessage>;
export type ChatRoomsRepository = Repository<MiChatRoom> & MiRepository<MiChatRoom>;
export type ChatRoomMembershipsRepository = Repository<MiChatRoomMembership> & MiRepository<MiChatRoomMembership>;
export type ChatRoomInvitationsRepository = Repository<MiChatRoomInvitation> & MiRepository<MiChatRoomInvitation>;
export type ChatApprovalsRepository = Repository<MiChatApproval> & MiRepository<MiChatApproval>;
export type ChatSecretSettingsRepository = Repository<MiChatSecretSettings> & MiRepository<MiChatSecretSettings>;
export type BubbleGameRecordsRepository = Repository<MiBubbleGameRecord> & MiRepository<MiBubbleGameRecord>;
export type ReversiGamesRepository = Repository<MiReversiGame> & MiRepository<MiReversiGame>;
export type NoctownPlayersRepository = Repository<NoctownPlayer> & MiRepository<NoctownPlayer>;
export type NoctownItemsRepository = Repository<NoctownItem> & MiRepository<NoctownItem>;
export type NoctownPlayerItemsRepository = Repository<NoctownPlayerItem> & MiRepository<NoctownPlayerItem>;
export type NoctownWalletsRepository = Repository<NoctownWallet> & MiRepository<NoctownWallet>;
export type NoctownQuestsRepository = Repository<NoctownQuest> & MiRepository<NoctownQuest>;
export type NoctownNpcsRepository = Repository<NoctownNpc> & MiRepository<NoctownNpc>;
export type NoctownPlacedItemsRepository = Repository<NoctownPlacedItem> & MiRepository<NoctownPlacedItem>;
export type NoctownDroppedItemsRepository = Repository<NoctownDroppedItem> & MiRepository<NoctownDroppedItem>;
export type NoctownWorldsRepository = Repository<NoctownWorld> & MiRepository<NoctownWorld>;
export type NoctownWorldChunksRepository = Repository<NoctownWorldChunk> & MiRepository<NoctownWorldChunk>;
export type NoctownPlayerScoresRepository = Repository<NoctownPlayerScore> & MiRepository<NoctownPlayerScore>;
export type NoctownPlayerStatisticsRepository = Repository<NoctownPlayerStatistics> & MiRepository<NoctownPlayerStatistics>;
export type NoctownFarmPlotsRepository = Repository<NoctownFarmPlot> & MiRepository<NoctownFarmPlot>;
export type NoctownCropsRepository = Repository<NoctownCrop> & MiRepository<NoctownCrop>;
export type NoctownChickensRepository = Repository<NoctownChicken> & MiRepository<NoctownChicken>;
export type NoctownCowsRepository = Repository<NoctownCow> & MiRepository<NoctownCow>;
export type NoctownRecipesRepository = Repository<NoctownRecipe> & MiRepository<NoctownRecipe>;
export type NoctownRecipeIngredientsRepository = Repository<NoctownRecipeIngredient> & MiRepository<NoctownRecipeIngredient>;
export type NoctownTradesRepository = Repository<NoctownTrade> & MiRepository<NoctownTrade>;
export type NoctownTradeItemsRepository = Repository<NoctownTradeItem> & MiRepository<NoctownTradeItem>;
export type NoctownInteriorMapsRepository = Repository<NoctownInteriorMap> & MiRepository<NoctownInteriorMap>;
export type NoctownShopInventoriesRepository = Repository<NoctownShopInventory> & MiRepository<NoctownShopInventory>;
export type NoctownTreasureChestsRepository = Repository<NoctownTreasureChest> & MiRepository<NoctownTreasureChest>;
export type NoctownHousesRepository = Repository<NoctownHouse> & MiRepository<NoctownHouse>;
export type NoctownHouseWallItemsRepository = Repository<NoctownHouseWallItem> & MiRepository<NoctownHouseWallItem>;
export type NoctownHouseFurnituresRepository = Repository<NoctownHouseFurniture> & MiRepository<NoctownHouseFurniture>;
export type NoctownBulletinBoardsRepository = Repository<NoctownBulletinBoard> & MiRepository<NoctownBulletinBoard>;
export type NoctownBulletinPostsRepository = Repository<NoctownBulletinPost> & MiRepository<NoctownBulletinPost>;
export type NoctownBulletinLikesRepository = Repository<NoctownBulletinLike> & MiRepository<NoctownBulletinLike>;
export type NoctownAgentsRepository = Repository<NoctownAgent> & MiRepository<NoctownAgent>;
export type NoctownGachasRepository = Repository<NoctownGacha> & MiRepository<NoctownGacha>;
export type NoctownGachaItemsRepository = Repository<NoctownGachaItem> & MiRepository<NoctownGachaItem>;
export type NoctownGachaPullsRepository = Repository<NoctownGachaPull> & MiRepository<NoctownGachaPull>;
export type NoctownEventsRepository = Repository<NoctownEvent> & MiRepository<NoctownEvent>;
export type NoctownEventRewardsRepository = Repository<NoctownEventReward> & MiRepository<NoctownEventReward>;
export type NoctownEventParticipationsRepository = Repository<NoctownEventParticipation> & MiRepository<NoctownEventParticipation>;
export type NoctownUniqueItemsRepository = Repository<NoctownUniqueItem> & MiRepository<NoctownUniqueItem>;
export type NoctownRankingBoardsRepository = Repository<NoctownRankingBoard> & MiRepository<NoctownRankingBoard>;
