import { DataSource, EntityTarget, ObjectLiteral } from 'typeorm';
import {
	Ctor,
	IServiceCollection,
	ServiceCollection,
	addSingletonCtor,
	addSingletonFactory,
	addSingletonInstance,
	getRequiredService,
	buildServiceProvider,
} from 'yohira';
import { Config, loadConfig } from '@/config.js';
import { AccountUpdateService } from '@/core/AccountUpdateService.js';
import { AchievementService } from '@/core/AchievementService.js';
import { AiService } from '@/core/AiService.js';
import { AntennaService } from '@/core/AntennaService.js';
import { AppLockService } from '@/core/AppLockService.js';
import { CaptchaService } from '@/core/CaptchaService.js';
import { CreateNotificationService } from '@/core/CreateNotificationService.js';
import { CreateSystemUserService } from '@/core/CreateSystemUserService.js';
import { CustomEmojiService } from '@/core/CustomEmojiService.js';
import { DeleteAccountService } from '@/core/DeleteAccountService.js';
import { DownloadService } from '@/core/DownloadService.js';
import { DriveService } from '@/core/DriveService.js';
import { EmailService } from '@/core/EmailService.js';
import { FederatedInstanceService } from '@/core/FederatedInstanceService.js';
import { FetchInstanceMetadataService } from '@/core/FetchInstanceMetadataService.js';
import { FileInfoService } from '@/core/FileInfoService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { HashtagService } from '@/core/HashtagService.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import { IdService } from '@/core/IdService.js';
import { ImageProcessingService } from '@/core/ImageProcessingService.js';
import { InstanceActorService } from '@/core/InstanceActorService.js';
import { InternalStorageService } from '@/core/InternalStorageService.js';
import { LoggerService } from '@/core/LoggerService.js';
import { MessagingService } from '@/core/MessagingService.js';
import { MetaService } from '@/core/MetaService.js';
import { MfmService } from '@/core/MfmService.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { NoteCreateService } from '@/core/NoteCreateService.js';
import { NoteDeleteService } from '@/core/NoteDeleteService.js';
import { NotePiningService } from '@/core/NotePiningService.js';
import { NoteReadService } from '@/core/NoteReadService.js';
import { NotificationService } from '@/core/NotificationService.js';
import { PollService } from '@/core/PollService.js';
import { ProxyAccountService } from '@/core/ProxyAccountService.js';
import { PushNotificationService } from '@/core/PushNotificationService.js';
import { QueryService } from '@/core/QueryService.js';
import { q } from '@/core/QueueModule.js';
import { QueueService } from '@/core/QueueService.js';
import { ReactionService } from '@/core/ReactionService.js';
import { RelayService } from '@/core/RelayService.js';
import { RemoteLoggerService } from '@/core/RemoteLoggerService.js';
import { RemoteUserResolveService } from '@/core/RemoteUserResolveService.js';
import { RoleService } from '@/core/RoleService.js';
import { S3Service } from '@/core/S3Service.js';
import { SignupService } from '@/core/SignupService.js';
import { TwoFactorAuthenticationService } from '@/core/TwoFactorAuthenticationService.js';
import { UserBlockingService } from '@/core/UserBlockingService.js';
import { UserCacheService } from '@/core/UserCacheService.js';
import { UserFollowingService } from '@/core/UserFollowingService.js';
import { UserKeypairStoreService } from '@/core/UserKeypairStoreService.js';
import { UserListService } from '@/core/UserListService.js';
import { UserMutingService } from '@/core/UserMutingService.js';
import { UserSuspendService } from '@/core/UserSuspendService.js';
import { UtilityService } from '@/core/UtilityService.js';
import { VideoProcessingService } from '@/core/VideoProcessingService.js';
import { WebfingerService } from '@/core/WebfingerService.js';
import { WebhookService } from '@/core/WebhookService.js';
import { ApAudienceService } from '@/core/activitypub/ApAudienceService.js';
import { ApDbResolverService } from '@/core/activitypub/ApDbResolverService.js';
import { ApDeliverManagerService } from '@/core/activitypub/ApDeliverManagerService.js';
import { ApInboxService } from '@/core/activitypub/ApInboxService.js';
import { ApLoggerService } from '@/core/activitypub/ApLoggerService.js';
import { ApMfmService } from '@/core/activitypub/ApMfmService.js';
import { ApRendererService } from '@/core/activitypub/ApRendererService.js';
import { ApRequestService } from '@/core/activitypub/ApRequestService.js';
import { ApResolverService } from '@/core/activitypub/ApResolverService.js';
import { LdSignatureService } from '@/core/activitypub/LdSignatureService.js';
import { ApImageService } from '@/core/activitypub/models/ApImageService.js';
import { ApMentionService } from '@/core/activitypub/models/ApMentionService.js';
import { ApNoteService } from '@/core/activitypub/models/ApNoteService.js';
import { ApPersonService } from '@/core/activitypub/models/ApPersonService.js';
import { ApQuestionService } from '@/core/activitypub/models/ApQuestionService.js';
import { ChartLoggerService } from '@/core/chart/ChartLoggerService.js';
import { ChartManagementService } from '@/core/chart/ChartManagementService.js';
import ActiveUsersChart from '@/core/chart/charts/active-users.js';
import ApRequestChart from '@/core/chart/charts/ap-request.js';
import DriveChart from '@/core/chart/charts/drive.js';
import FederationChart from '@/core/chart/charts/federation.js';
import InstanceChart from '@/core/chart/charts/instance.js';
import NotesChart from '@/core/chart/charts/notes.js';
import PerUserDriveChart from '@/core/chart/charts/per-user-drive.js';
import PerUserFollowingChart from '@/core/chart/charts/per-user-following.js';
import PerUserNotesChart from '@/core/chart/charts/per-user-notes.js';
import PerUserPvChart from '@/core/chart/charts/per-user-pv.js';
import PerUserReactionsChart from '@/core/chart/charts/per-user-reactions.js';
import UsersChart from '@/core/chart/charts/users.js';
import { AbuseUserReportEntityService } from '@/core/entities/AbuseUserReportEntityService.js';
import { AntennaEntityService } from '@/core/entities/AntennaEntityService.js';
import { AppEntityService } from '@/core/entities/AppEntityService.js';
import { AuthSessionEntityService } from '@/core/entities/AuthSessionEntityService.js';
import { BlockingEntityService } from '@/core/entities/BlockingEntityService.js';
import { ChannelEntityService } from '@/core/entities/ChannelEntityService.js';
import { ClipEntityService } from '@/core/entities/ClipEntityService.js';
import { DriveFileEntityService } from '@/core/entities/DriveFileEntityService.js';
import { DriveFolderEntityService } from '@/core/entities/DriveFolderEntityService.js';
import { EmojiEntityService } from '@/core/entities/EmojiEntityService.js';
import { FlashEntityService } from '@/core/entities/FlashEntityService.js';
import { FlashLikeEntityService } from '@/core/entities/FlashLikeEntityService.js';
import { FollowRequestEntityService } from '@/core/entities/FollowRequestEntityService.js';
import { FollowingEntityService } from '@/core/entities/FollowingEntityService.js';
import { GalleryLikeEntityService } from '@/core/entities/GalleryLikeEntityService.js';
import { GalleryPostEntityService } from '@/core/entities/GalleryPostEntityService.js';
import { HashtagEntityService } from '@/core/entities/HashtagEntityService.js';
import { InstanceEntityService } from '@/core/entities/InstanceEntityService.js';
import { MessagingMessageEntityService } from '@/core/entities/MessagingMessageEntityService.js';
import { ModerationLogEntityService } from '@/core/entities/ModerationLogEntityService.js';
import { MutingEntityService } from '@/core/entities/MutingEntityService.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { NoteFavoriteEntityService } from '@/core/entities/NoteFavoriteEntityService.js';
import { NoteReactionEntityService } from '@/core/entities/NoteReactionEntityService.js';
import { NotificationEntityService } from '@/core/entities/NotificationEntityService.js';
import { PageEntityService } from '@/core/entities/PageEntityService.js';
import { PageLikeEntityService } from '@/core/entities/PageLikeEntityService.js';
import { RoleEntityService } from '@/core/entities/RoleEntityService.js';
import { SigninEntityService } from '@/core/entities/SigninEntityService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { UserGroupEntityService } from '@/core/entities/UserGroupEntityService.js';
import { UserGroupInvitationEntityService } from '@/core/entities/UserGroupInvitationEntityService.js';
import { UserListEntityService } from '@/core/entities/UserListEntityService.js';
import { DI } from '@/di-symbols.js';
import {
	AbuseUserReport,
	AccessToken,
	Ad,
	Announcement,
	AnnouncementRead,
	Antenna,
	AntennaNote,
	App,
	AttestationChallenge,
	AuthSession,
	Blocking,
	Channel,
	ChannelFollowing,
	ChannelNotePining,
	Clip,
	ClipNote,
	DriveFile,
	DriveFolder,
	Emoji,
	Flash,
	FlashLike,
	FollowRequest,
	Following,
	GalleryLike,
	GalleryPost,
	Hashtag,
	Instance,
	MessagingMessage,
	Meta,
	ModerationLog,
	MutedNote,
	Muting,
	Note,
	NoteFavorite,
	NoteReaction,
	NoteThreadMuting,
	NoteUnread,
	Notification,
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
	RetentionAggregation,
	Role,
	RoleAssignment,
	Signin,
	SwSubscription,
	UsedUsername,
	User,
	UserGroup,
	UserGroupInvitation,
	UserGroupJoining,
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
} from '@/models/index.js';
import { createPostgresDataSource } from '@/postgres.js';
import { DbQueueProcessorsService } from '@/queue/DbQueueProcessorsService.js';
import { ObjectStorageQueueProcessorsService } from '@/queue/ObjectStorageQueueProcessorsService.js';
import { QueueLoggerService } from '@/queue/QueueLoggerService.js';
import { QueueProcessorService } from '@/queue/QueueProcessorService.js';
import { SystemQueueProcessorsService } from '@/queue/SystemQueueProcessorsService.js';
import { AggregateRetentionProcessorService } from '@/queue/processors/AggregateRetentionProcessorService.js';
import { CheckExpiredMutingsProcessorService } from '@/queue/processors/CheckExpiredMutingsProcessorService.js';
import { CleanChartsProcessorService } from '@/queue/processors/CleanChartsProcessorService.js';
import { CleanProcessorService } from '@/queue/processors/CleanProcessorService.js';
import { CleanRemoteFilesProcessorService } from '@/queue/processors/CleanRemoteFilesProcessorService.js';
import { DeleteAccountProcessorService } from '@/queue/processors/DeleteAccountProcessorService.js';
import { DeleteDriveFilesProcessorService } from '@/queue/processors/DeleteDriveFilesProcessorService.js';
import { DeleteFileProcessorService } from '@/queue/processors/DeleteFileProcessorService.js';
import { DeliverProcessorService } from '@/queue/processors/DeliverProcessorService.js';
import { EndedPollNotificationProcessorService } from '@/queue/processors/EndedPollNotificationProcessorService.js';
import { ExportBlockingProcessorService } from '@/queue/processors/ExportBlockingProcessorService.js';
import { ExportCustomEmojisProcessorService } from '@/queue/processors/ExportCustomEmojisProcessorService.js';
import { ExportFavoritesProcessorService } from '@/queue/processors/ExportFavoritesProcessorService.js';
import { ExportFollowingProcessorService } from '@/queue/processors/ExportFollowingProcessorService.js';
import { ExportMutingProcessorService } from '@/queue/processors/ExportMutingProcessorService.js';
import { ExportNotesProcessorService } from '@/queue/processors/ExportNotesProcessorService.js';
import { ExportUserListsProcessorService } from '@/queue/processors/ExportUserListsProcessorService.js';
import { ImportBlockingProcessorService } from '@/queue/processors/ImportBlockingProcessorService.js';
import { ImportCustomEmojisProcessorService } from '@/queue/processors/ImportCustomEmojisProcessorService.js';
import { ImportFollowingProcessorService } from '@/queue/processors/ImportFollowingProcessorService.js';
import { ImportMutingProcessorService } from '@/queue/processors/ImportMutingProcessorService.js';
import { ImportUserListsProcessorService } from '@/queue/processors/ImportUserListsProcessorService.js';
import { InboxProcessorService } from '@/queue/processors/InboxProcessorService.js';
import { ResyncChartsProcessorService } from '@/queue/processors/ResyncChartsProcessorService.js';
import { TickChartsProcessorService } from '@/queue/processors/TickChartsProcessorService.js';
import { WebhookDeliverProcessorService } from '@/queue/processors/WebhookDeliverProcessorService.js';
import { createRedisConnection } from '@/redis.js';
import { ActivityPubServerService } from '@/server/ActivityPubServerService.js';
import { FileServerService } from '@/server/FileServerService.js';
import { NodeinfoServerService } from '@/server/NodeinfoServerService.js';
import { ServerService } from '@/server/ServerService.js';
import { WellKnownServerService } from '@/server/WellKnownServerService.js';
import { ApiCallService } from '@/server/api/ApiCallService.js';
import { ApiLoggerService } from '@/server/api/ApiLoggerService.js';
import { ApiServerService } from '@/server/api/ApiServerService.js';
import { AuthenticateService } from '@/server/api/AuthenticateService.js';
import { GetterService } from '@/server/api/GetterService.js';
import { RateLimiterService } from '@/server/api/RateLimiterService.js';
import { SigninApiService } from '@/server/api/SigninApiService.js';
import { SigninService } from '@/server/api/SigninService.js';
import { SignupApiService } from '@/server/api/SignupApiService.js';
import { StreamingApiServerService } from '@/server/api/StreamingApiServerService.js';
import { ChannelsService } from '@/server/api/stream/ChannelsService.js';
import { AdminChannelService } from '@/server/api/stream/channels/admin.js';
import { AntennaChannelService } from '@/server/api/stream/channels/antenna.js';
import { ChannelChannelService } from '@/server/api/stream/channels/channel.js';
import { DriveChannelService } from '@/server/api/stream/channels/drive.js';
import { GlobalTimelineChannelService } from '@/server/api/stream/channels/global-timeline.js';
import { HashtagChannelService } from '@/server/api/stream/channels/hashtag.js';
import { HomeTimelineChannelService } from '@/server/api/stream/channels/home-timeline.js';
import { HybridTimelineChannelService } from '@/server/api/stream/channels/hybrid-timeline.js';
import { LocalTimelineChannelService } from '@/server/api/stream/channels/local-timeline.js';
import { MainChannelService } from '@/server/api/stream/channels/main.js';
import { MessagingIndexChannelService } from '@/server/api/stream/channels/messaging-index.js';
import { MessagingChannelService } from '@/server/api/stream/channels/messaging.js';
import { QueueStatsChannelService } from '@/server/api/stream/channels/queue-stats.js';
import { ServerStatsChannelService } from '@/server/api/stream/channels/server-stats.js';
import { UserListChannelService } from '@/server/api/stream/channels/user-list.js';
import { ClientServerService } from '@/server/web/ClientServerService.js';
import { FeedService } from '@/server/web/FeedService.js';
import { UrlPreviewService } from '@/server/web/UrlPreviewService.js';
import { JanitorService } from '@/daemons/JanitorService.js';
import { QueueStatsService } from '@/daemons/QueueStatsService.js';
import { ServerStatsService } from '@/daemons/ServerStatsService.js';
import { NestLogger } from '@/NestLogger.js';

// REVIEW
async function addGlobalModule(services: IServiceCollection): Promise<void> {
	const config = loadConfig();
	addSingletonInstance(services, DI.config, config);

	const db = await createPostgresDataSource(config).initialize();
	addSingletonInstance(services, DI.db, db);

	const redisClient = createRedisConnection(config);
	addSingletonInstance(services, DI.redis, redisClient);

	const redisSubscriber = createRedisConnection(config);
	redisSubscriber.subscribe(config.host);
	addSingletonInstance(services, DI.redisSubscriber, redisSubscriber);
}

function addQueueModule(services: IServiceCollection): void {
	addSingletonFactory(services, Symbol.for('queue:system'), (services) => {
		const config = getRequiredService<Config>(services, DI.config);
		return q(config, 'system');
	});

	addSingletonFactory(
		services,
		Symbol.for('queue:endedPollNotification'),
		(services) => {
			const config = getRequiredService<Config>(services, DI.config);
			return q(config, 'endedPollNotification');
		},
	);

	addSingletonFactory(services, Symbol.for('queue:deliver'), (services) => {
		const config = getRequiredService<Config>(services, DI.config);
		return q(config, 'deliver', config.deliverJobPerSec ?? 128);
	});

	addSingletonFactory(services, Symbol.for('queue:inbox'), (services) => {
		const config = getRequiredService<Config>(services, DI.config);
		return q(config, 'inbox', config.inboxJobPerSec ?? 16);
	});

	addSingletonFactory(services, Symbol.for('queue:db'), (services) => {
		const config = getRequiredService<Config>(services, DI.config);
		return q(config, 'db');
	});

	addSingletonFactory(
		services,
		Symbol.for('queue:objectStorage'),
		(services) => {
			const config = getRequiredService<Config>(services, DI.config);
			return q(config, 'objectStorage');
		},
	);

	addSingletonFactory(
		services,
		Symbol.for('queue:webhookDeliver'),
		(services) => {
			const config = getRequiredService<Config>(services, DI.config);
			return q(config, 'webhookDeliver', 64);
		},
	);
}

function addRepositoryModule(services: IServiceCollection): void {
	const repositoryModule: [symbol, EntityTarget<ObjectLiteral>][] = [
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
		[DI.userGroupsRepository, UserGroup],
		[DI.userGroupJoiningsRepository, UserGroupJoining],
		[DI.userGroupInvitationsRepository, UserGroupInvitation],
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
		[DI.blockingsRepository, Blocking],
		[DI.swSubscriptionsRepository, SwSubscription],
		[DI.hashtagsRepository, Hashtag],
		[DI.abuseUserReportsRepository, AbuseUserReport],
		[DI.registrationTicketsRepository, RegistrationTicket],
		[DI.authSessionsRepository, AuthSession],
		[DI.accessTokensRepository, AccessToken],
		[DI.signinsRepository, Signin],
		[DI.messagingMessagesRepository, MessagingMessage],
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
	for (const [serviceType, target] of repositoryModule) {
		addSingletonFactory(services, serviceType, (services) => {
			const db = getRequiredService<DataSource>(services, DI.db);
			return db.getRepository(target);
		});
	}
}

function addCoreModule(services: IServiceCollection): void {
	const coreModule: [symbol, Ctor<object>][] = [
		[DI.AccountUpdateService, AccountUpdateService],
		[DI.AiService, AiService],
		[DI.AntennaService, AntennaService],
		[DI.AppLockService, AppLockService],
		[DI.AchievementService, AchievementService],
		[DI.CaptchaService, CaptchaService],
		[DI.CreateNotificationService, CreateNotificationService],
		[DI.CreateSystemUserService, CreateSystemUserService],
		[DI.CustomEmojiService, CustomEmojiService],
		[DI.DeleteAccountService, DeleteAccountService],
		[DI.DownloadService, DownloadService],
		[DI.DriveService, DriveService],
		[DI.EmailService, EmailService],
		[DI.FederatedInstanceService, FederatedInstanceService],
		[DI.FetchInstanceMetadataService, FetchInstanceMetadataService],
		[DI.GlobalEventService, GlobalEventService],
		[DI.HashtagService, HashtagService],
		[DI.HttpRequestService, HttpRequestService],
		[DI.IdService, IdService],
		[DI.ImageProcessingService, ImageProcessingService],
		[DI.InstanceActorService, InstanceActorService],
		[DI.InternalStorageService, InternalStorageService],
		[DI.MessagingService, MessagingService],
		[DI.MetaService, MetaService],
		[DI.MfmService, MfmService],
		[DI.ModerationLogService, ModerationLogService],
		[DI.NoteCreateService, NoteCreateService],
		[DI.NoteDeleteService, NoteDeleteService],
		[DI.NotePiningService, NotePiningService],
		[DI.NoteReadService, NoteReadService],
		[DI.NotificationService, NotificationService],
		[DI.PollService, PollService],
		[DI.PushNotificationService, PushNotificationService],
		[DI.QueryService, QueryService],
		[DI.ReactionService, ReactionService],
		[DI.RelayService, RelayService],
		[DI.RoleService, RoleService],
		[DI.S3Service, S3Service],
		[DI.SignupService, SignupService],
		[DI.TwoFactorAuthenticationService, TwoFactorAuthenticationService],
		[DI.UserBlockingService, UserBlockingService],
		[DI.UserCacheService, UserCacheService],
		[DI.UserFollowingService, UserFollowingService],
		[DI.UserKeypairStoreService, UserKeypairStoreService],
		[DI.UserListService, UserListService],
		[DI.UserMutingService, UserMutingService],
		[DI.UserSuspendService, UserSuspendService],
		[DI.VideoProcessingService, VideoProcessingService],
		[DI.WebhookService, WebhookService],
		[DI.ProxyAccountService, ProxyAccountService],
		[DI.UtilityService, UtilityService],
		[DI.FileInfoService, FileInfoService],
		[DI.ChartLoggerService, ChartLoggerService],
		[DI.FederationChart, FederationChart],
		[DI.NotesChart, NotesChart],
		[DI.UsersChart, UsersChart],
		[DI.ActiveUsersChart, ActiveUsersChart],
		[DI.InstanceChart, InstanceChart],
		[DI.PerUserNotesChart, PerUserNotesChart],
		[DI.PerUserPvChart, PerUserPvChart],
		[DI.DriveChart, DriveChart],
		[DI.PerUserReactionsChart, PerUserReactionsChart],
		[DI.PerUserFollowingChart, PerUserFollowingChart],
		[DI.PerUserDriveChart, PerUserDriveChart],
		[DI.ApRequestChart, ApRequestChart],
		[DI.ChartManagementService, ChartManagementService],
		[DI.AbuseUserReportEntityService, AbuseUserReportEntityService],
		[DI.AntennaEntityService, AntennaEntityService],
		[DI.AppEntityService, AppEntityService],
		[DI.AuthSessionEntityService, AuthSessionEntityService],
		[DI.BlockingEntityService, BlockingEntityService],
		[DI.ChannelEntityService, ChannelEntityService],
		[DI.ClipEntityService, ClipEntityService],
		[DI.DriveFileEntityService, DriveFileEntityService],
		[DI.DriveFolderEntityService, DriveFolderEntityService],
		[DI.EmojiEntityService, EmojiEntityService],
		[DI.FollowingEntityService, FollowingEntityService],
		[DI.FollowRequestEntityService, FollowRequestEntityService],
		[DI.GalleryLikeEntityService, GalleryLikeEntityService],
		[DI.GalleryPostEntityService, GalleryPostEntityService],
		[DI.HashtagEntityService, HashtagEntityService],
		[DI.InstanceEntityService, InstanceEntityService],
		[DI.MessagingMessageEntityService, MessagingMessageEntityService],
		[DI.ModerationLogEntityService, ModerationLogEntityService],
		[DI.MutingEntityService, MutingEntityService],
		[DI.NoteEntityService, NoteEntityService],
		[DI.NoteFavoriteEntityService, NoteFavoriteEntityService],
		[DI.NoteReactionEntityService, NoteReactionEntityService],
		[DI.NotificationEntityService, NotificationEntityService],
		[DI.PageEntityService, PageEntityService],
		[DI.PageLikeEntityService, PageLikeEntityService],
		[DI.SigninEntityService, SigninEntityService],
		[DI.UserEntityService, UserEntityService],
		[DI.UserGroupEntityService, UserGroupEntityService],
		[DI.UserGroupInvitationEntityService, UserGroupInvitationEntityService],
		[DI.UserListEntityService, UserListEntityService],
		[DI.FlashEntityService, FlashEntityService],
		[DI.FlashLikeEntityService, FlashLikeEntityService],
		[DI.RoleEntityService, RoleEntityService],
		[DI.ApAudienceService, ApAudienceService],
		[DI.ApDbResolverService, ApDbResolverService],
		[DI.ApDeliverManagerService, ApDeliverManagerService],
		[DI.ApInboxService, ApInboxService],
		[DI.ApLoggerService, ApLoggerService],
		[DI.ApMfmService, ApMfmService],
		[DI.ApRendererService, ApRendererService],
		[DI.ApRequestService, ApRequestService],
		[DI.ApResolverService, ApResolverService],
		[DI.LdSignatureService, LdSignatureService],
		[DI.RemoteLoggerService, RemoteLoggerService],
		[DI.RemoteUserResolveService, RemoteUserResolveService],
		[DI.WebfingerService, WebfingerService],
		[DI.ApImageService, ApImageService],
		[DI.ApMentionService, ApMentionService],
		[DI.ApNoteService, ApNoteService],
		[DI.ApPersonService, ApPersonService],
		[DI.ApQuestionService, ApQuestionService],
		[DI.QueueService, QueueService],
		[DI.LoggerService, LoggerService],
	];
	for (const [serviceType, implCtor] of coreModule) {
		addSingletonCtor(services, serviceType, implCtor);
	}
}

function addServerModule(services: IServiceCollection): void {
	const serverModule: [symbol, Ctor<object>][] = [
		[DI.ClientServerService, ClientServerService],
		[DI.FeedService, FeedService],
		[DI.UrlPreviewService, UrlPreviewService],
		[DI.ActivityPubServerService, ActivityPubServerService],
		[DI.FileServerService, FileServerService],
		[DI.NodeinfoServerService, NodeinfoServerService],
		[DI.ServerService, ServerService],
		[DI.WellKnownServerService, WellKnownServerService],
		[DI.GetterService, GetterService],
		[DI.ChannelsService, ChannelsService],
		[DI.ApiCallService, ApiCallService],
		[DI.ApiLoggerService, ApiLoggerService],
		[DI.ApiServerService, ApiServerService],
		[DI.AuthenticateService, AuthenticateService],
		[DI.RateLimiterService, RateLimiterService],
		[DI.SigninApiService, SigninApiService],
		[DI.SigninService, SigninService],
		[DI.SignupApiService, SignupApiService],
		[DI.StreamingApiServerService, StreamingApiServerService],
		[DI.MainChannelService, MainChannelService],
		[DI.AdminChannelService, AdminChannelService],
		[DI.AntennaChannelService, AntennaChannelService],
		[DI.ChannelChannelService, ChannelChannelService],
		[DI.DriveChannelService, DriveChannelService],
		[DI.GlobalTimelineChannelService, GlobalTimelineChannelService],
		[DI.HashtagChannelService, HashtagChannelService],
		[DI.HomeTimelineChannelService, HomeTimelineChannelService],
		[DI.HybridTimelineChannelService, HybridTimelineChannelService],
		[DI.LocalTimelineChannelService, LocalTimelineChannelService],
		[DI.MessagingIndexChannelService, MessagingIndexChannelService],
		[DI.MessagingChannelService, MessagingChannelService],
		[DI.QueueStatsChannelService, QueueStatsChannelService],
		[DI.ServerStatsChannelService, ServerStatsChannelService],
		[DI.UserListChannelService, UserListChannelService],
	];
	for (const [serviceType, implCtor] of serverModule) {
		addSingletonCtor(services, serviceType, implCtor);
	}
}

function addQueueProcessorModule(services: IServiceCollection): void {
	const queueProcessorModule: [symbol, Ctor<object>][] = [
		[DI.QueueLoggerService, QueueLoggerService],
		[DI.TickChartsProcessorService, TickChartsProcessorService],
		[DI.ResyncChartsProcessorService, ResyncChartsProcessorService],
		[DI.CleanChartsProcessorService, CleanChartsProcessorService],
		[DI.CheckExpiredMutingsProcessorService, CheckExpiredMutingsProcessorService],
		[DI.CleanProcessorService, CleanProcessorService],
		[DI.DeleteDriveFilesProcessorService, DeleteDriveFilesProcessorService],
		[DI.ExportCustomEmojisProcessorService, ExportCustomEmojisProcessorService],
		[DI.ExportNotesProcessorService, ExportNotesProcessorService],
		[DI.ExportFavoritesProcessorService, ExportFavoritesProcessorService],
		[DI.ExportFollowingProcessorService, ExportFollowingProcessorService],
		[DI.ExportMutingProcessorService, ExportMutingProcessorService],
		[DI.ExportBlockingProcessorService, ExportBlockingProcessorService],
		[DI.ExportUserListsProcessorService, ExportUserListsProcessorService],
		[DI.ImportFollowingProcessorService, ImportFollowingProcessorService],
		[DI.ImportMutingProcessorService, ImportMutingProcessorService],
		[DI.ImportBlockingProcessorService, ImportBlockingProcessorService],
		[DI.ImportUserListsProcessorService, ImportUserListsProcessorService],
		[DI.ImportCustomEmojisProcessorService, ImportCustomEmojisProcessorService],
		[DI.DeleteAccountProcessorService, DeleteAccountProcessorService],
		[DI.DeleteFileProcessorService, DeleteFileProcessorService],
		[DI.CleanRemoteFilesProcessorService, CleanRemoteFilesProcessorService],
		[DI.SystemQueueProcessorsService, SystemQueueProcessorsService],
		[DI.ObjectStorageQueueProcessorsService, ObjectStorageQueueProcessorsService],
		[DI.DbQueueProcessorsService, DbQueueProcessorsService],
		[DI.WebhookDeliverProcessorService, WebhookDeliverProcessorService],
		[DI.EndedPollNotificationProcessorService, EndedPollNotificationProcessorService],
		[DI.DeliverProcessorService, DeliverProcessorService],
		[DI.InboxProcessorService, InboxProcessorService],
		[DI.AggregateRetentionProcessorService, AggregateRetentionProcessorService],
		[DI.QueueProcessorService, QueueProcessorService],
	];
	for (const [serviceType, implCtor] of queueProcessorModule) {
		addSingletonCtor(services, serviceType, implCtor);
	}
}

function addDaemonModule(services: IServiceCollection): void {
	const daemonModule: [symbol, Ctor<object>][] = [
		[DI.JanitorService, JanitorService],
		[DI.QueueStatsService, QueueStatsService],
		[DI.ServerStatsService, ServerStatsService],
	];
	for (const [serviceType, implCtor] of daemonModule) {
		addSingletonCtor(services, serviceType, implCtor);
	}
}

export async function main(): Promise<void> {
	const services = new ServiceCollection();

	addSingletonInstance(services, DI.Logger, new NestLogger());

	await addGlobalModule(services);
	addQueueModule(services);
	addRepositoryModule(services);
	addCoreModule(services);
	addServerModule(services);
	addQueueProcessorModule(services);
	addDaemonModule(services);

	const serviceProvider = buildServiceProvider(services);

	const serverService = getRequiredService<ServerService>(serviceProvider, DI.ServerService);
	serverService.launch();

	getRequiredService<ChartManagementService>(serviceProvider, DI.ChartManagementService).start();
	getRequiredService<JanitorService>(serviceProvider, DI.JanitorService).start();
	getRequiredService<QueueStatsService>(serviceProvider, DI.QueueStatsService).start();
	getRequiredService<ServerStatsService>(serviceProvider, DI.ServerStatsService).start();
}
