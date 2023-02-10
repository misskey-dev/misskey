import { DataSource, EntityTarget, ObjectLiteral } from 'typeorm';
import {
	Ctor,
	IServiceCollection,
	ServiceCollection,
	addSingletonCtor,
	addSingletonFactory,
	addSingletonInstance,
	buildServiceProvider,
	getRequiredService,
} from 'yohira';
import { NestLogger } from '@/NestLogger.js';
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
import { JanitorService } from '@/daemons/JanitorService.js';
import { QueueStatsService } from '@/daemons/QueueStatsService.js';
import { ServerStatsService } from '@/daemons/ServerStatsService.js';
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
import * as ep___admin_abuseUserReports from '@/server/api/endpoints/admin/abuse-user-reports.js';
import * as ep___admin_accounts_create from '@/server/api/endpoints/admin/accounts/create.js';
import * as ep___admin_accounts_delete from '@/server/api/endpoints/admin/accounts/delete.js';
import * as ep___admin_ad_create from '@/server/api/endpoints/admin/ad/create.js';
import * as ep___admin_ad_delete from '@/server/api/endpoints/admin/ad/delete.js';
import * as ep___admin_ad_list from '@/server/api/endpoints/admin/ad/list.js';
import * as ep___admin_ad_update from '@/server/api/endpoints/admin/ad/update.js';
import * as ep___admin_announcements_create from '@/server/api/endpoints/admin/announcements/create.js';
import * as ep___admin_announcements_delete from '@/server/api/endpoints/admin/announcements/delete.js';
import * as ep___admin_announcements_list from '@/server/api/endpoints/admin/announcements/list.js';
import * as ep___admin_announcements_update from '@/server/api/endpoints/admin/announcements/update.js';
import * as ep___admin_deleteAccount from '@/server/api/endpoints/admin/delete-account.js';
import * as ep___admin_deleteAllFilesOfAUser from '@/server/api/endpoints/admin/delete-all-files-of-a-user.js';
import * as ep___admin_drive_cleanRemoteFiles from '@/server/api/endpoints/admin/drive/clean-remote-files.js';
import * as ep___admin_drive_cleanup from '@/server/api/endpoints/admin/drive/cleanup.js';
import * as ep___admin_drive_files from '@/server/api/endpoints/admin/drive/files.js';
import * as ep___admin_drive_showFile from '@/server/api/endpoints/admin/drive/show-file.js';
import * as ep___admin_emoji_addAliasesBulk from '@/server/api/endpoints/admin/emoji/add-aliases-bulk.js';
import * as ep___admin_emoji_add from '@/server/api/endpoints/admin/emoji/add.js';
import * as ep___admin_emoji_copy from '@/server/api/endpoints/admin/emoji/copy.js';
import * as ep___admin_emoji_deleteBulk from '@/server/api/endpoints/admin/emoji/delete-bulk.js';
import * as ep___admin_emoji_delete from '@/server/api/endpoints/admin/emoji/delete.js';
import * as ep___admin_emoji_importZip from '@/server/api/endpoints/admin/emoji/import-zip.js';
import * as ep___admin_emoji_listRemote from '@/server/api/endpoints/admin/emoji/list-remote.js';
import * as ep___admin_emoji_list from '@/server/api/endpoints/admin/emoji/list.js';
import * as ep___admin_emoji_removeAliasesBulk from '@/server/api/endpoints/admin/emoji/remove-aliases-bulk.js';
import * as ep___admin_emoji_setAliasesBulk from '@/server/api/endpoints/admin/emoji/set-aliases-bulk.js';
import * as ep___admin_emoji_setCategoryBulk from '@/server/api/endpoints/admin/emoji/set-category-bulk.js';
import * as ep___admin_emoji_update from '@/server/api/endpoints/admin/emoji/update.js';
import * as ep___admin_federation_deleteAllFiles from '@/server/api/endpoints/admin/federation/delete-all-files.js';
import * as ep___admin_federation_refreshRemoteInstanceMetadata from '@/server/api/endpoints/admin/federation/refresh-remote-instance-metadata.js';
import * as ep___admin_federation_removeAllFollowing from '@/server/api/endpoints/admin/federation/remove-all-following.js';
import * as ep___admin_federation_updateInstance from '@/server/api/endpoints/admin/federation/update-instance.js';
import * as ep___admin_getIndexStats from '@/server/api/endpoints/admin/get-index-stats.js';
import * as ep___admin_getTableStats from '@/server/api/endpoints/admin/get-table-stats.js';
import * as ep___admin_getUserIps from '@/server/api/endpoints/admin/get-user-ips.js';
import * as ep___admin_meta from '@/server/api/endpoints/admin/meta.js';
import * as ep___admin_promo_create from '@/server/api/endpoints/admin/promo/create.js';
import * as ep___admin_queue_clear from '@/server/api/endpoints/admin/queue/clear.js';
import * as ep___admin_queue_deliverDelayed from '@/server/api/endpoints/admin/queue/deliver-delayed.js';
import * as ep___admin_queue_inboxDelayed from '@/server/api/endpoints/admin/queue/inbox-delayed.js';
import * as ep___admin_queue_stats from '@/server/api/endpoints/admin/queue/stats.js';
import * as ep___admin_relays_add from '@/server/api/endpoints/admin/relays/add.js';
import * as ep___admin_relays_list from '@/server/api/endpoints/admin/relays/list.js';
import * as ep___admin_relays_remove from '@/server/api/endpoints/admin/relays/remove.js';
import * as ep___admin_resetPassword from '@/server/api/endpoints/admin/reset-password.js';
import * as ep___admin_resolveAbuseUserReport from '@/server/api/endpoints/admin/resolve-abuse-user-report.js';
import * as ep___admin_roles_assign from '@/server/api/endpoints/admin/roles/assign.js';
import * as ep___admin_roles_create from '@/server/api/endpoints/admin/roles/create.js';
import * as ep___admin_roles_delete from '@/server/api/endpoints/admin/roles/delete.js';
import * as ep___admin_roles_list from '@/server/api/endpoints/admin/roles/list.js';
import * as ep___admin_roles_show from '@/server/api/endpoints/admin/roles/show.js';
import * as ep___admin_roles_unassign from '@/server/api/endpoints/admin/roles/unassign.js';
import * as ep___admin_roles_updateDefaultPolicies from '@/server/api/endpoints/admin/roles/update-default-policies.js';
import * as ep___admin_roles_update from '@/server/api/endpoints/admin/roles/update.js';
import * as ep___admin_sendEmail from '@/server/api/endpoints/admin/send-email.js';
import * as ep___admin_serverInfo from '@/server/api/endpoints/admin/server-info.js';
import * as ep___admin_showModerationLogs from '@/server/api/endpoints/admin/show-moderation-logs.js';
import * as ep___admin_showUser from '@/server/api/endpoints/admin/show-user.js';
import * as ep___admin_showUsers from '@/server/api/endpoints/admin/show-users.js';
import * as ep___admin_suspendUser from '@/server/api/endpoints/admin/suspend-user.js';
import * as ep___admin_unsuspendUser from '@/server/api/endpoints/admin/unsuspend-user.js';
import * as ep___admin_updateMeta from '@/server/api/endpoints/admin/update-meta.js';
import * as ep___admin_updateUserNote from '@/server/api/endpoints/admin/update-user-note.js';
import * as ep___announcements from '@/server/api/endpoints/announcements.js';
import * as ep___antennas_create from '@/server/api/endpoints/antennas/create.js';
import * as ep___antennas_delete from '@/server/api/endpoints/antennas/delete.js';
import * as ep___antennas_list from '@/server/api/endpoints/antennas/list.js';
import * as ep___antennas_notes from '@/server/api/endpoints/antennas/notes.js';
import * as ep___antennas_show from '@/server/api/endpoints/antennas/show.js';
import * as ep___antennas_update from '@/server/api/endpoints/antennas/update.js';
import * as ep___ap_get from '@/server/api/endpoints/ap/get.js';
import * as ep___ap_show from '@/server/api/endpoints/ap/show.js';
import * as ep___app_create from '@/server/api/endpoints/app/create.js';
import * as ep___app_show from '@/server/api/endpoints/app/show.js';
import * as ep___auth_accept from '@/server/api/endpoints/auth/accept.js';
import * as ep___auth_session_generate from '@/server/api/endpoints/auth/session/generate.js';
import * as ep___auth_session_show from '@/server/api/endpoints/auth/session/show.js';
import * as ep___auth_session_userkey from '@/server/api/endpoints/auth/session/userkey.js';
import * as ep___blocking_create from '@/server/api/endpoints/blocking/create.js';
import * as ep___blocking_delete from '@/server/api/endpoints/blocking/delete.js';
import * as ep___blocking_list from '@/server/api/endpoints/blocking/list.js';
import * as ep___channels_create from '@/server/api/endpoints/channels/create.js';
import * as ep___channels_featured from '@/server/api/endpoints/channels/featured.js';
import * as ep___channels_follow from '@/server/api/endpoints/channels/follow.js';
import * as ep___channels_followed from '@/server/api/endpoints/channels/followed.js';
import * as ep___channels_owned from '@/server/api/endpoints/channels/owned.js';
import * as ep___channels_show from '@/server/api/endpoints/channels/show.js';
import * as ep___channels_timeline from '@/server/api/endpoints/channels/timeline.js';
import * as ep___channels_unfollow from '@/server/api/endpoints/channels/unfollow.js';
import * as ep___channels_update from '@/server/api/endpoints/channels/update.js';
import * as ep___charts_activeUsers from '@/server/api/endpoints/charts/active-users.js';
import * as ep___charts_apRequest from '@/server/api/endpoints/charts/ap-request.js';
import * as ep___charts_drive from '@/server/api/endpoints/charts/drive.js';
import * as ep___charts_federation from '@/server/api/endpoints/charts/federation.js';
import * as ep___charts_instance from '@/server/api/endpoints/charts/instance.js';
import * as ep___charts_notes from '@/server/api/endpoints/charts/notes.js';
import * as ep___charts_user_drive from '@/server/api/endpoints/charts/user/drive.js';
import * as ep___charts_user_following from '@/server/api/endpoints/charts/user/following.js';
import * as ep___charts_user_notes from '@/server/api/endpoints/charts/user/notes.js';
import * as ep___charts_user_pv from '@/server/api/endpoints/charts/user/pv.js';
import * as ep___charts_user_reactions from '@/server/api/endpoints/charts/user/reactions.js';
import * as ep___charts_users from '@/server/api/endpoints/charts/users.js';
import * as ep___clips_addNote from '@/server/api/endpoints/clips/add-note.js';
import * as ep___clips_create from '@/server/api/endpoints/clips/create.js';
import * as ep___clips_delete from '@/server/api/endpoints/clips/delete.js';
import * as ep___clips_list from '@/server/api/endpoints/clips/list.js';
import * as ep___clips_notes from '@/server/api/endpoints/clips/notes.js';
import * as ep___clips_removeNote from '@/server/api/endpoints/clips/remove-note.js';
import * as ep___clips_show from '@/server/api/endpoints/clips/show.js';
import * as ep___clips_update from '@/server/api/endpoints/clips/update.js';
import * as ep___drive from '@/server/api/endpoints/drive.js';
import * as ep___drive_files from '@/server/api/endpoints/drive/files.js';
import * as ep___drive_files_attachedNotes from '@/server/api/endpoints/drive/files/attached-notes.js';
import * as ep___drive_files_checkExistence from '@/server/api/endpoints/drive/files/check-existence.js';
import * as ep___drive_files_create from '@/server/api/endpoints/drive/files/create.js';
import * as ep___drive_files_delete from '@/server/api/endpoints/drive/files/delete.js';
import * as ep___drive_files_findByHash from '@/server/api/endpoints/drive/files/find-by-hash.js';
import * as ep___drive_files_find from '@/server/api/endpoints/drive/files/find.js';
import * as ep___drive_files_show from '@/server/api/endpoints/drive/files/show.js';
import * as ep___drive_files_update from '@/server/api/endpoints/drive/files/update.js';
import * as ep___drive_files_uploadFromUrl from '@/server/api/endpoints/drive/files/upload-from-url.js';
import * as ep___drive_folders from '@/server/api/endpoints/drive/folders.js';
import * as ep___drive_folders_create from '@/server/api/endpoints/drive/folders/create.js';
import * as ep___drive_folders_delete from '@/server/api/endpoints/drive/folders/delete.js';
import * as ep___drive_folders_find from '@/server/api/endpoints/drive/folders/find.js';
import * as ep___drive_folders_show from '@/server/api/endpoints/drive/folders/show.js';
import * as ep___drive_folders_update from '@/server/api/endpoints/drive/folders/update.js';
import * as ep___drive_stream from '@/server/api/endpoints/drive/stream.js';
import * as ep___emailAddress_available from '@/server/api/endpoints/email-address/available.js';
import * as ep___emojis from '@/server/api/endpoints/emojis.js';
import * as ep___endpoint from '@/server/api/endpoints/endpoint.js';
import * as ep___endpoints from '@/server/api/endpoints/endpoints.js';
import * as ep___exportCustomEmojis from '@/server/api/endpoints/export-custom-emojis.js';
import * as ep___federation_followers from '@/server/api/endpoints/federation/followers.js';
import * as ep___federation_following from '@/server/api/endpoints/federation/following.js';
import * as ep___federation_instances from '@/server/api/endpoints/federation/instances.js';
import * as ep___federation_showInstance from '@/server/api/endpoints/federation/show-instance.js';
import * as ep___federation_stats from '@/server/api/endpoints/federation/stats.js';
import * as ep___federation_updateRemoteUser from '@/server/api/endpoints/federation/update-remote-user.js';
import * as ep___federation_users from '@/server/api/endpoints/federation/users.js';
import * as ep___fetchRss from '@/server/api/endpoints/fetch-rss.js';
import * as ep___flash_create from '@/server/api/endpoints/flash/create.js';
import * as ep___flash_delete from '@/server/api/endpoints/flash/delete.js';
import * as ep___flash_featured from '@/server/api/endpoints/flash/featured.js';
import * as ep___flash_like from '@/server/api/endpoints/flash/like.js';
import * as ep___flash_myLikes from '@/server/api/endpoints/flash/my-likes.js';
import * as ep___flash_my from '@/server/api/endpoints/flash/my.js';
import * as ep___flash_show from '@/server/api/endpoints/flash/show.js';
import * as ep___flash_unlike from '@/server/api/endpoints/flash/unlike.js';
import * as ep___flash_update from '@/server/api/endpoints/flash/update.js';
import * as ep___following_create from '@/server/api/endpoints/following/create.js';
import * as ep___following_delete from '@/server/api/endpoints/following/delete.js';
import * as ep___following_invalidate from '@/server/api/endpoints/following/invalidate.js';
import * as ep___following_requests_accept from '@/server/api/endpoints/following/requests/accept.js';
import * as ep___following_requests_cancel from '@/server/api/endpoints/following/requests/cancel.js';
import * as ep___following_requests_list from '@/server/api/endpoints/following/requests/list.js';
import * as ep___following_requests_reject from '@/server/api/endpoints/following/requests/reject.js';
import * as ep___gallery_featured from '@/server/api/endpoints/gallery/featured.js';
import * as ep___gallery_popular from '@/server/api/endpoints/gallery/popular.js';
import * as ep___gallery_posts from '@/server/api/endpoints/gallery/posts.js';
import * as ep___gallery_posts_create from '@/server/api/endpoints/gallery/posts/create.js';
import * as ep___gallery_posts_delete from '@/server/api/endpoints/gallery/posts/delete.js';
import * as ep___gallery_posts_like from '@/server/api/endpoints/gallery/posts/like.js';
import * as ep___gallery_posts_show from '@/server/api/endpoints/gallery/posts/show.js';
import * as ep___gallery_posts_unlike from '@/server/api/endpoints/gallery/posts/unlike.js';
import * as ep___gallery_posts_update from '@/server/api/endpoints/gallery/posts/update.js';
import * as ep___getOnlineUsersCount from '@/server/api/endpoints/get-online-users-count.js';
import * as ep___hashtags_list from '@/server/api/endpoints/hashtags/list.js';
import * as ep___hashtags_search from '@/server/api/endpoints/hashtags/search.js';
import * as ep___hashtags_show from '@/server/api/endpoints/hashtags/show.js';
import * as ep___hashtags_trend from '@/server/api/endpoints/hashtags/trend.js';
import * as ep___hashtags_users from '@/server/api/endpoints/hashtags/users.js';
import * as ep___i from '@/server/api/endpoints/i.js';
import * as ep___i_2fa_done from '@/server/api/endpoints/i/2fa/done.js';
import * as ep___i_2fa_keyDone from '@/server/api/endpoints/i/2fa/key-done.js';
import * as ep___i_2fa_passwordLess from '@/server/api/endpoints/i/2fa/password-less.js';
import * as ep___i_2fa_registerKey from '@/server/api/endpoints/i/2fa/register-key.js';
import * as ep___i_2fa_register from '@/server/api/endpoints/i/2fa/register.js';
import * as ep___i_2fa_removeKey from '@/server/api/endpoints/i/2fa/remove-key.js';
import * as ep___i_2fa_unregister from '@/server/api/endpoints/i/2fa/unregister.js';
import * as ep___i_apps from '@/server/api/endpoints/i/apps.js';
import * as ep___i_authorizedApps from '@/server/api/endpoints/i/authorized-apps.js';
import * as ep___i_changePassword from '@/server/api/endpoints/i/change-password.js';
import * as ep___i_claimAchievement from '@/server/api/endpoints/i/claim-achievement.js';
import * as ep___i_deleteAccount from '@/server/api/endpoints/i/delete-account.js';
import * as ep___i_exportBlocking from '@/server/api/endpoints/i/export-blocking.js';
import * as ep___i_exportFavorites from '@/server/api/endpoints/i/export-favorites.js';
import * as ep___i_exportFollowing from '@/server/api/endpoints/i/export-following.js';
import * as ep___i_exportMute from '@/server/api/endpoints/i/export-mute.js';
import * as ep___i_exportNotes from '@/server/api/endpoints/i/export-notes.js';
import * as ep___i_exportUserLists from '@/server/api/endpoints/i/export-user-lists.js';
import * as ep___i_favorites from '@/server/api/endpoints/i/favorites.js';
import * as ep___i_gallery_likes from '@/server/api/endpoints/i/gallery/likes.js';
import * as ep___i_gallery_posts from '@/server/api/endpoints/i/gallery/posts.js';
import * as ep___i_getWordMutedNotesCount from '@/server/api/endpoints/i/get-word-muted-notes-count.js';
import * as ep___i_importBlocking from '@/server/api/endpoints/i/import-blocking.js';
import * as ep___i_importFollowing from '@/server/api/endpoints/i/import-following.js';
import * as ep___i_importMuting from '@/server/api/endpoints/i/import-muting.js';
import * as ep___i_importUserLists from '@/server/api/endpoints/i/import-user-lists.js';
import * as ep___i_notifications from '@/server/api/endpoints/i/notifications.js';
import * as ep___i_pageLikes from '@/server/api/endpoints/i/page-likes.js';
import * as ep___i_pages from '@/server/api/endpoints/i/pages.js';
import * as ep___i_pin from '@/server/api/endpoints/i/pin.js';
import * as ep___i_readAllMessagingMessages from '@/server/api/endpoints/i/read-all-messaging-messages.js';
import * as ep___i_readAllUnreadNotes from '@/server/api/endpoints/i/read-all-unread-notes.js';
import * as ep___i_readAnnouncement from '@/server/api/endpoints/i/read-announcement.js';
import * as ep___i_regenerateToken from '@/server/api/endpoints/i/regenerate-token.js';
import * as ep___i_registry_getAll from '@/server/api/endpoints/i/registry/get-all.js';
import * as ep___i_registry_getDetail from '@/server/api/endpoints/i/registry/get-detail.js';
import * as ep___i_registry_get from '@/server/api/endpoints/i/registry/get.js';
import * as ep___i_registry_keysWithType from '@/server/api/endpoints/i/registry/keys-with-type.js';
import * as ep___i_registry_keys from '@/server/api/endpoints/i/registry/keys.js';
import * as ep___i_registry_remove from '@/server/api/endpoints/i/registry/remove.js';
import * as ep___i_registry_scopes from '@/server/api/endpoints/i/registry/scopes.js';
import * as ep___i_registry_set from '@/server/api/endpoints/i/registry/set.js';
import * as ep___i_revokeToken from '@/server/api/endpoints/i/revoke-token.js';
import * as ep___i_signinHistory from '@/server/api/endpoints/i/signin-history.js';
import * as ep___i_unpin from '@/server/api/endpoints/i/unpin.js';
import * as ep___i_updateEmail from '@/server/api/endpoints/i/update-email.js';
import * as ep___i_update from '@/server/api/endpoints/i/update.js';
import * as ep___i_userGroupInvites from '@/server/api/endpoints/i/user-group-invites.js';
import * as ep___i_webhooks_create from '@/server/api/endpoints/i/webhooks/create.js';
import * as ep___i_webhooks_delete from '@/server/api/endpoints/i/webhooks/delete.js';
import * as ep___i_webhooks_list from '@/server/api/endpoints/i/webhooks/list.js';
import * as ep___i_webhooks_show from '@/server/api/endpoints/i/webhooks/show.js';
import * as ep___i_webhooks_update from '@/server/api/endpoints/i/webhooks/update.js';
import * as ep___invite from '@/server/api/endpoints/invite.js';
import * as ep___messaging_history from '@/server/api/endpoints/messaging/history.js';
import * as ep___messaging_messages from '@/server/api/endpoints/messaging/messages.js';
import * as ep___messaging_messages_create from '@/server/api/endpoints/messaging/messages/create.js';
import * as ep___messaging_messages_delete from '@/server/api/endpoints/messaging/messages/delete.js';
import * as ep___messaging_messages_read from '@/server/api/endpoints/messaging/messages/read.js';
import * as ep___meta from '@/server/api/endpoints/meta.js';
import * as ep___miauth_genToken from '@/server/api/endpoints/miauth/gen-token.js';
import * as ep___mute_create from '@/server/api/endpoints/mute/create.js';
import * as ep___mute_delete from '@/server/api/endpoints/mute/delete.js';
import * as ep___mute_list from '@/server/api/endpoints/mute/list.js';
import * as ep___my_apps from '@/server/api/endpoints/my/apps.js';
import * as ep___notes from '@/server/api/endpoints/notes.js';
import * as ep___notes_children from '@/server/api/endpoints/notes/children.js';
import * as ep___notes_clips from '@/server/api/endpoints/notes/clips.js';
import * as ep___notes_conversation from '@/server/api/endpoints/notes/conversation.js';
import * as ep___notes_create from '@/server/api/endpoints/notes/create.js';
import * as ep___notes_delete from '@/server/api/endpoints/notes/delete.js';
import * as ep___notes_favorites_create from '@/server/api/endpoints/notes/favorites/create.js';
import * as ep___notes_favorites_delete from '@/server/api/endpoints/notes/favorites/delete.js';
import * as ep___notes_featured from '@/server/api/endpoints/notes/featured.js';
import * as ep___notes_globalTimeline from '@/server/api/endpoints/notes/global-timeline.js';
import * as ep___notes_hybridTimeline from '@/server/api/endpoints/notes/hybrid-timeline.js';
import * as ep___notes_localTimeline from '@/server/api/endpoints/notes/local-timeline.js';
import * as ep___notes_mentions from '@/server/api/endpoints/notes/mentions.js';
import * as ep___notes_polls_recommendation from '@/server/api/endpoints/notes/polls/recommendation.js';
import * as ep___notes_polls_vote from '@/server/api/endpoints/notes/polls/vote.js';
import * as ep___notes_reactions from '@/server/api/endpoints/notes/reactions.js';
import * as ep___notes_reactions_create from '@/server/api/endpoints/notes/reactions/create.js';
import * as ep___notes_reactions_delete from '@/server/api/endpoints/notes/reactions/delete.js';
import * as ep___notes_renotes from '@/server/api/endpoints/notes/renotes.js';
import * as ep___notes_replies from '@/server/api/endpoints/notes/replies.js';
import * as ep___notes_searchByTag from '@/server/api/endpoints/notes/search-by-tag.js';
import * as ep___notes_search from '@/server/api/endpoints/notes/search.js';
import * as ep___notes_show from '@/server/api/endpoints/notes/show.js';
import * as ep___notes_state from '@/server/api/endpoints/notes/state.js';
import * as ep___notes_threadMuting_create from '@/server/api/endpoints/notes/thread-muting/create.js';
import * as ep___notes_threadMuting_delete from '@/server/api/endpoints/notes/thread-muting/delete.js';
import * as ep___notes_timeline from '@/server/api/endpoints/notes/timeline.js';
import * as ep___notes_translate from '@/server/api/endpoints/notes/translate.js';
import * as ep___notes_unrenote from '@/server/api/endpoints/notes/unrenote.js';
import * as ep___notes_userListTimeline from '@/server/api/endpoints/notes/user-list-timeline.js';
import * as ep___notifications_create from '@/server/api/endpoints/notifications/create.js';
import * as ep___notifications_markAllAsRead from '@/server/api/endpoints/notifications/mark-all-as-read.js';
import * as ep___notifications_read from '@/server/api/endpoints/notifications/read.js';
import * as ep___pagePush from '@/server/api/endpoints/page-push.js';
import * as ep___pages_create from '@/server/api/endpoints/pages/create.js';
import * as ep___pages_delete from '@/server/api/endpoints/pages/delete.js';
import * as ep___pages_featured from '@/server/api/endpoints/pages/featured.js';
import * as ep___pages_like from '@/server/api/endpoints/pages/like.js';
import * as ep___pages_show from '@/server/api/endpoints/pages/show.js';
import * as ep___pages_unlike from '@/server/api/endpoints/pages/unlike.js';
import * as ep___pages_update from '@/server/api/endpoints/pages/update.js';
import * as ep___ping from '@/server/api/endpoints/ping.js';
import * as ep___pinnedUsers from '@/server/api/endpoints/pinned-users.js';
import * as ep___promo_read from '@/server/api/endpoints/promo/read.js';
import * as ep___requestResetPassword from '@/server/api/endpoints/request-reset-password.js';
import * as ep___resetDb from '@/server/api/endpoints/reset-db.js';
import * as ep___resetPassword from '@/server/api/endpoints/reset-password.js';
import * as ep___retention from '@/server/api/endpoints/retention.js';
import * as ep___serverInfo from '@/server/api/endpoints/server-info.js';
import * as ep___stats from '@/server/api/endpoints/stats.js';
import * as ep___sw_register from '@/server/api/endpoints/sw/register.js';
import * as ep___sw_show_registration from '@/server/api/endpoints/sw/show-registration.js';
import * as ep___sw_unregister from '@/server/api/endpoints/sw/unregister.js';
import * as ep___sw_update_registration from '@/server/api/endpoints/sw/update-registration.js';
import * as ep___test from '@/server/api/endpoints/test.js';
import * as ep___username_available from '@/server/api/endpoints/username/available.js';
import * as ep___users from '@/server/api/endpoints/users.js';
import * as ep___users_achievements from '@/server/api/endpoints/users/achievements.js';
import * as ep___users_clips from '@/server/api/endpoints/users/clips.js';
import * as ep___users_followers from '@/server/api/endpoints/users/followers.js';
import * as ep___users_following from '@/server/api/endpoints/users/following.js';
import * as ep___users_gallery_posts from '@/server/api/endpoints/users/gallery/posts.js';
import * as ep___users_getFrequentlyRepliedUsers from '@/server/api/endpoints/users/get-frequently-replied-users.js';
import * as ep___users_groups_create from '@/server/api/endpoints/users/groups/create.js';
import * as ep___users_groups_delete from '@/server/api/endpoints/users/groups/delete.js';
import * as ep___users_groups_invitations_accept from '@/server/api/endpoints/users/groups/invitations/accept.js';
import * as ep___users_groups_invitations_reject from '@/server/api/endpoints/users/groups/invitations/reject.js';
import * as ep___users_groups_invite from '@/server/api/endpoints/users/groups/invite.js';
import * as ep___users_groups_joined from '@/server/api/endpoints/users/groups/joined.js';
import * as ep___users_groups_leave from '@/server/api/endpoints/users/groups/leave.js';
import * as ep___users_groups_owned from '@/server/api/endpoints/users/groups/owned.js';
import * as ep___users_groups_pull from '@/server/api/endpoints/users/groups/pull.js';
import * as ep___users_groups_show from '@/server/api/endpoints/users/groups/show.js';
import * as ep___users_groups_transfer from '@/server/api/endpoints/users/groups/transfer.js';
import * as ep___users_groups_update from '@/server/api/endpoints/users/groups/update.js';
import * as ep___users_lists_create from '@/server/api/endpoints/users/lists/create.js';
import * as ep___users_lists_delete from '@/server/api/endpoints/users/lists/delete.js';
import * as ep___users_lists_list from '@/server/api/endpoints/users/lists/list.js';
import * as ep___users_lists_pull from '@/server/api/endpoints/users/lists/pull.js';
import * as ep___users_lists_push from '@/server/api/endpoints/users/lists/push.js';
import * as ep___users_lists_show from '@/server/api/endpoints/users/lists/show.js';
import * as ep___users_lists_update from '@/server/api/endpoints/users/lists/update.js';
import * as ep___users_notes from '@/server/api/endpoints/users/notes.js';
import * as ep___users_pages from '@/server/api/endpoints/users/pages.js';
import * as ep___users_reactions from '@/server/api/endpoints/users/reactions.js';
import * as ep___users_recommendation from '@/server/api/endpoints/users/recommendation.js';
import * as ep___users_relation from '@/server/api/endpoints/users/relation.js';
import * as ep___users_reportAbuse from '@/server/api/endpoints/users/report-abuse.js';
import * as ep___users_searchByUsernameAndHost from '@/server/api/endpoints/users/search-by-username-and-host.js';
import * as ep___users_search from '@/server/api/endpoints/users/search.js';
import * as ep___users_show from '@/server/api/endpoints/users/show.js';
import * as ep___users_stats from '@/server/api/endpoints/users/stats.js';
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

function addEndpointsModule(services: IServiceCollection): void {
	const endpointsModule: [symbol, Ctor<object>][] = [
		[Symbol.for('ep:admin/meta'), ep___admin_meta.default],
		[Symbol.for('ep:admin/abuse-user-reports'), ep___admin_abuseUserReports.default],
		[Symbol.for('ep:admin/accounts/create'), ep___admin_accounts_create.default],
		[Symbol.for('ep:admin/accounts/delete'), ep___admin_accounts_delete.default],
		[Symbol.for('ep:admin/ad/create'), ep___admin_ad_create.default],
		[Symbol.for('ep:admin/ad/delete'), ep___admin_ad_delete.default],
		[Symbol.for('ep:admin/ad/list'), ep___admin_ad_list.default],
		[Symbol.for('ep:admin/ad/update'), ep___admin_ad_update.default],
		[Symbol.for('ep:admin/announcements/create'), ep___admin_announcements_create.default],
		[Symbol.for('ep:admin/announcements/delete'), ep___admin_announcements_delete.default],
		[Symbol.for('ep:admin/announcements/list'), ep___admin_announcements_list.default],
		[Symbol.for('ep:admin/announcements/update'), ep___admin_announcements_update.default],
		[Symbol.for('ep:admin/delete-all-files-of-a-user'), ep___admin_deleteAllFilesOfAUser.default],
		[Symbol.for('ep:admin/drive/clean-remote-files'), ep___admin_drive_cleanRemoteFiles.default],
		[Symbol.for('ep:admin/drive/cleanup'), ep___admin_drive_cleanup.default],
		[Symbol.for('ep:admin/drive/files'), ep___admin_drive_files.default],
		[Symbol.for('ep:admin/drive/show-file'), ep___admin_drive_showFile.default],
		[Symbol.for('ep:admin/emoji/add-aliases-bulk'), ep___admin_emoji_addAliasesBulk.default],
		[Symbol.for('ep:admin/emoji/add'), ep___admin_emoji_add.default],
		[Symbol.for('ep:admin/emoji/copy'), ep___admin_emoji_copy.default],
		[Symbol.for('ep:admin/emoji/delete-bulk'), ep___admin_emoji_deleteBulk.default],
		[Symbol.for('ep:admin/emoji/delete'), ep___admin_emoji_delete.default],
		[Symbol.for('ep:admin/emoji/import-zip'), ep___admin_emoji_importZip.default],
		[Symbol.for('ep:admin/emoji/list-remote'), ep___admin_emoji_listRemote.default],
		[Symbol.for('ep:admin/emoji/list'), ep___admin_emoji_list.default],
		[Symbol.for('ep:admin/emoji/remove-aliases-bulk'), ep___admin_emoji_removeAliasesBulk.default],
		[Symbol.for('ep:admin/emoji/set-aliases-bulk'), ep___admin_emoji_setAliasesBulk.default],
		[Symbol.for('ep:admin/emoji/set-category-bulk'), ep___admin_emoji_setCategoryBulk.default],
		[Symbol.for('ep:admin/emoji/update'), ep___admin_emoji_update.default],
		[Symbol.for('ep:admin/federation/delete-all-files'), ep___admin_federation_deleteAllFiles.default],
		[Symbol.for('ep:admin/federation/refresh-remote-instance-metadata'), ep___admin_federation_refreshRemoteInstanceMetadata.default],
		[Symbol.for('ep:admin/federation/remove-all-following'), ep___admin_federation_removeAllFollowing.default],
		[Symbol.for('ep:admin/federation/update-instance'), ep___admin_federation_updateInstance.default],
		[Symbol.for('ep:admin/get-index-stats'), ep___admin_getIndexStats.default],
		[Symbol.for('ep:admin/get-table-stats'), ep___admin_getTableStats.default],
		[Symbol.for('ep:admin/get-user-ips'), ep___admin_getUserIps.default],
		[Symbol.for('ep:invite'), ep___invite.default],
		[Symbol.for('ep:admin/promo/create'), ep___admin_promo_create.default],
		[Symbol.for('ep:admin/queue/clear'), ep___admin_queue_clear.default],
		[Symbol.for('ep:admin/queue/deliver-delayed'), ep___admin_queue_deliverDelayed.default],
		[Symbol.for('ep:admin/queue/inbox-delayed'), ep___admin_queue_inboxDelayed.default],
		[Symbol.for('ep:admin/queue/stats'), ep___admin_queue_stats.default],
		[Symbol.for('ep:admin/relays/add'), ep___admin_relays_add.default],
		[Symbol.for('ep:admin/relays/list'), ep___admin_relays_list.default],
		[Symbol.for('ep:admin/relays/remove'), ep___admin_relays_remove.default],
		[Symbol.for('ep:admin/reset-password'), ep___admin_resetPassword.default],
		[Symbol.for('ep:admin/resolve-abuse-user-report'), ep___admin_resolveAbuseUserReport.default],
		[Symbol.for('ep:admin/send-email'), ep___admin_sendEmail.default],
		[Symbol.for('ep:admin/server-info'), ep___admin_serverInfo.default],
		[Symbol.for('ep:admin/show-moderation-logs'), ep___admin_showModerationLogs.default],
		[Symbol.for('ep:admin/show-user'), ep___admin_showUser.default],
		[Symbol.for('ep:admin/show-users'), ep___admin_showUsers.default],
		[Symbol.for('ep:admin/suspend-user'), ep___admin_suspendUser.default],
		[Symbol.for('ep:admin/unsuspend-user'), ep___admin_unsuspendUser.default],
		[Symbol.for('ep:admin/update-meta'), ep___admin_updateMeta.default],
		[Symbol.for('ep:admin/delete-account'), ep___admin_deleteAccount.default],
		[Symbol.for('ep:admin/update-user-note'), ep___admin_updateUserNote.default],
		[Symbol.for('ep:admin/roles/create'), ep___admin_roles_create.default],
		[Symbol.for('ep:admin/roles/delete'), ep___admin_roles_delete.default],
		[Symbol.for('ep:admin/roles/list'), ep___admin_roles_list.default],
		[Symbol.for('ep:admin/roles/show'), ep___admin_roles_show.default],
		[Symbol.for('ep:admin/roles/update'), ep___admin_roles_update.default],
		[Symbol.for('ep:admin/roles/assign'), ep___admin_roles_assign.default],
		[Symbol.for('ep:admin/roles/unassign'), ep___admin_roles_unassign.default],
		[Symbol.for('ep:admin/roles/update-default-policies'), ep___admin_roles_updateDefaultPolicies.default],
		[Symbol.for('ep:announcements'), ep___announcements.default],
		[Symbol.for('ep:antennas/create'), ep___antennas_create.default],
		[Symbol.for('ep:antennas/delete'), ep___antennas_delete.default],
		[Symbol.for('ep:antennas/list'), ep___antennas_list.default],
		[Symbol.for('ep:antennas/notes'), ep___antennas_notes.default],
		[Symbol.for('ep:antennas/show'), ep___antennas_show.default],
		[Symbol.for('ep:antennas/update'), ep___antennas_update.default],
		[Symbol.for('ep:ap/get'), ep___ap_get.default],
		[Symbol.for('ep:ap/show'), ep___ap_show.default],
		[Symbol.for('ep:app/create'), ep___app_create.default],
		[Symbol.for('ep:app/show'), ep___app_show.default],
		[Symbol.for('ep:auth/accept'), ep___auth_accept.default],
		[Symbol.for('ep:auth/session/generate'), ep___auth_session_generate.default],
		[Symbol.for('ep:auth/session/show'), ep___auth_session_show.default],
		[Symbol.for('ep:auth/session/userkey'), ep___auth_session_userkey.default],
		[Symbol.for('ep:blocking/create'), ep___blocking_create.default],
		[Symbol.for('ep:blocking/delete'), ep___blocking_delete.default],
		[Symbol.for('ep:blocking/list'), ep___blocking_list.default],
		[Symbol.for('ep:channels/create'), ep___channels_create.default],
		[Symbol.for('ep:channels/featured'), ep___channels_featured.default],
		[Symbol.for('ep:channels/follow'), ep___channels_follow.default],
		[Symbol.for('ep:channels/followed'), ep___channels_followed.default],
		[Symbol.for('ep:channels/owned'), ep___channels_owned.default],
		[Symbol.for('ep:channels/show'), ep___channels_show.default],
		[Symbol.for('ep:channels/timeline'), ep___channels_timeline.default],
		[Symbol.for('ep:channels/unfollow'), ep___channels_unfollow.default],
		[Symbol.for('ep:channels/update'), ep___channels_update.default],
		[Symbol.for('ep:charts/active-users'), ep___charts_activeUsers.default],
		[Symbol.for('ep:charts/ap-request'), ep___charts_apRequest.default],
		[Symbol.for('ep:charts/drive'), ep___charts_drive.default],
		[Symbol.for('ep:charts/federation'), ep___charts_federation.default],
		[Symbol.for('ep:charts/instance'), ep___charts_instance.default],
		[Symbol.for('ep:charts/notes'), ep___charts_notes.default],
		[Symbol.for('ep:charts/user/drive'), ep___charts_user_drive.default],
		[Symbol.for('ep:charts/user/following'), ep___charts_user_following.default],
		[Symbol.for('ep:charts/user/notes'), ep___charts_user_notes.default],
		[Symbol.for('ep:charts/user/pv'), ep___charts_user_pv.default],
		[Symbol.for('ep:charts/user/reactions'), ep___charts_user_reactions.default],
		[Symbol.for('ep:charts/users'), ep___charts_users.default],
		[Symbol.for('ep:clips/add-note'), ep___clips_addNote.default],
		[Symbol.for('ep:clips/remove-note'), ep___clips_removeNote.default],
		[Symbol.for('ep:clips/create'), ep___clips_create.default],
		[Symbol.for('ep:clips/delete'), ep___clips_delete.default],
		[Symbol.for('ep:clips/list'), ep___clips_list.default],
		[Symbol.for('ep:clips/notes'), ep___clips_notes.default],
		[Symbol.for('ep:clips/show'), ep___clips_show.default],
		[Symbol.for('ep:clips/update'), ep___clips_update.default],
		[Symbol.for('ep:drive'), ep___drive.default],
		[Symbol.for('ep:drive/files'), ep___drive_files.default],
		[Symbol.for('ep:drive/files/attached-notes'), ep___drive_files_attachedNotes.default],
		[Symbol.for('ep:drive/files/check-existence'), ep___drive_files_checkExistence.default],
		[Symbol.for('ep:drive/files/create'), ep___drive_files_create.default],
		[Symbol.for('ep:drive/files/delete'), ep___drive_files_delete.default],
		[Symbol.for('ep:drive/files/find-by-hash'), ep___drive_files_findByHash.default],
		[Symbol.for('ep:drive/files/find'), ep___drive_files_find.default],
		[Symbol.for('ep:drive/files/show'), ep___drive_files_show.default],
		[Symbol.for('ep:drive/files/update'), ep___drive_files_update.default],
		[Symbol.for('ep:drive/files/upload-from-url'), ep___drive_files_uploadFromUrl.default],
		[Symbol.for('ep:drive/folders'), ep___drive_folders.default],
		[Symbol.for('ep:drive/folders/create'), ep___drive_folders_create.default],
		[Symbol.for('ep:drive/folders/delete'), ep___drive_folders_delete.default],
		[Symbol.for('ep:drive/folders/find'), ep___drive_folders_find.default],
		[Symbol.for('ep:drive/folders/show'), ep___drive_folders_show.default],
		[Symbol.for('ep:drive/folders/update'), ep___drive_folders_update.default],
		[Symbol.for('ep:drive/stream'), ep___drive_stream.default],
		[Symbol.for('ep:email-address/available'), ep___emailAddress_available.default],
		[Symbol.for('ep:endpoint'), ep___endpoint.default],
		[Symbol.for('ep:endpoints'), ep___endpoints.default],
		[Symbol.for('ep:export-custom-emojis'), ep___exportCustomEmojis.default],
		[Symbol.for('ep:federation/followers'), ep___federation_followers.default],
		[Symbol.for('ep:federation/following'), ep___federation_following.default],
		[Symbol.for('ep:federation/instances'), ep___federation_instances.default],
		[Symbol.for('ep:federation/show-instance'), ep___federation_showInstance.default],
		[Symbol.for('ep:federation/update-remote-user'), ep___federation_updateRemoteUser.default],
		[Symbol.for('ep:federation/users'), ep___federation_users.default],
		[Symbol.for('ep:federation/stats'), ep___federation_stats.default],
		[Symbol.for('ep:following/create'), ep___following_create.default],
		[Symbol.for('ep:following/delete'), ep___following_delete.default],
		[Symbol.for('ep:following/invalidate'), ep___following_invalidate.default],
		[Symbol.for('ep:following/requests/accept'), ep___following_requests_accept.default],
		[Symbol.for('ep:following/requests/cancel'), ep___following_requests_cancel.default],
		[Symbol.for('ep:following/requests/list'), ep___following_requests_list.default],
		[Symbol.for('ep:following/requests/reject'), ep___following_requests_reject.default],
		[Symbol.for('ep:gallery/featured'), ep___gallery_featured.default],
		[Symbol.for('ep:gallery/popular'), ep___gallery_popular.default],
		[Symbol.for('ep:gallery/posts'), ep___gallery_posts.default],
		[Symbol.for('ep:gallery/posts/create'), ep___gallery_posts_create.default],
		[Symbol.for('ep:gallery/posts/delete'), ep___gallery_posts_delete.default],
		[Symbol.for('ep:gallery/posts/like'), ep___gallery_posts_like.default],
		[Symbol.for('ep:gallery/posts/show'), ep___gallery_posts_show.default],
		[Symbol.for('ep:gallery/posts/unlike'), ep___gallery_posts_unlike.default],
		[Symbol.for('ep:gallery/posts/update'), ep___gallery_posts_update.default],
		[Symbol.for('ep:get-online-users-count'), ep___getOnlineUsersCount.default],
		[Symbol.for('ep:hashtags/list'), ep___hashtags_list.default],
		[Symbol.for('ep:hashtags/search'), ep___hashtags_search.default],
		[Symbol.for('ep:hashtags/show'), ep___hashtags_show.default],
		[Symbol.for('ep:hashtags/trend'), ep___hashtags_trend.default],
		[Symbol.for('ep:hashtags/users'), ep___hashtags_users.default],
		[Symbol.for('ep:i'), ep___i.default],
		[Symbol.for('ep:i/2fa/done'), ep___i_2fa_done.default],
		[Symbol.for('ep:i/2fa/key-done'), ep___i_2fa_keyDone.default],
		[Symbol.for('ep:i/2fa/password-less'), ep___i_2fa_passwordLess.default],
		[Symbol.for('ep:i/2fa/register-key'), ep___i_2fa_registerKey.default],
		[Symbol.for('ep:i/2fa/register'), ep___i_2fa_register.default],
		[Symbol.for('ep:i/2fa/remove-key'), ep___i_2fa_removeKey.default],
		[Symbol.for('ep:i/2fa/unregister'), ep___i_2fa_unregister.default],
		[Symbol.for('ep:i/apps'), ep___i_apps.default],
		[Symbol.for('ep:i/authorized-apps'), ep___i_authorizedApps.default],
		[Symbol.for('ep:i/claim-achievement'), ep___i_claimAchievement.default],
		[Symbol.for('ep:i/change-password'), ep___i_changePassword.default],
		[Symbol.for('ep:i/delete-account'), ep___i_deleteAccount.default],
		[Symbol.for('ep:i/export-blocking'), ep___i_exportBlocking.default],
		[Symbol.for('ep:i/export-following'), ep___i_exportFollowing.default],
		[Symbol.for('ep:i/export-mute'), ep___i_exportMute.default],
		[Symbol.for('ep:i/export-notes'), ep___i_exportNotes.default],
		[Symbol.for('ep:i/export-favorites'), ep___i_exportFavorites.default],
		[Symbol.for('ep:i/export-user-lists'), ep___i_exportUserLists.default],
		[Symbol.for('ep:i/favorites'), ep___i_favorites.default],
		[Symbol.for('ep:i/gallery/likes'), ep___i_gallery_likes.default],
		[Symbol.for('ep:i/gallery/posts'), ep___i_gallery_posts.default],
		[Symbol.for('ep:i/get-word-muted-notes-count'), ep___i_getWordMutedNotesCount.default],
		[Symbol.for('ep:i/import-blocking'), ep___i_importBlocking.default],
		[Symbol.for('ep:i/import-following'), ep___i_importFollowing.default],
		[Symbol.for('ep:i/import-muting'), ep___i_importMuting.default],
		[Symbol.for('ep:i/import-user-lists'), ep___i_importUserLists.default],
		[Symbol.for('ep:i/notifications'), ep___i_notifications.default],
		[Symbol.for('ep:i/page-likes'), ep___i_pageLikes.default],
		[Symbol.for('ep:i/pages'), ep___i_pages.default],
		[Symbol.for('ep:i/pin'), ep___i_pin.default],
		[Symbol.for('ep:i/read-all-messaging-messages'), ep___i_readAllMessagingMessages.default],
		[Symbol.for('ep:i/read-all-unread-notes'), ep___i_readAllUnreadNotes.default],
		[Symbol.for('ep:i/read-announcement'), ep___i_readAnnouncement.default],
		[Symbol.for('ep:i/regenerate-token'), ep___i_regenerateToken.default],
		[Symbol.for('ep:i/registry/get-all'), ep___i_registry_getAll.default],
		[Symbol.for('ep:i/registry/get-detail'), ep___i_registry_getDetail.default],
		[Symbol.for('ep:i/registry/get'), ep___i_registry_get.default],
		[Symbol.for('ep:i/registry/keys-with-type'), ep___i_registry_keysWithType.default],
		[Symbol.for('ep:i/registry/keys'), ep___i_registry_keys.default],
		[Symbol.for('ep:i/registry/remove'), ep___i_registry_remove.default],
		[Symbol.for('ep:i/registry/scopes'), ep___i_registry_scopes.default],
		[Symbol.for('ep:i/registry/set'), ep___i_registry_set.default],
		[Symbol.for('ep:i/revoke-token'), ep___i_revokeToken.default],
		[Symbol.for('ep:i/signin-history'), ep___i_signinHistory.default],
		[Symbol.for('ep:i/unpin'), ep___i_unpin.default],
		[Symbol.for('ep:i/update-email'), ep___i_updateEmail.default],
		[Symbol.for('ep:i/update'), ep___i_update.default],
		[Symbol.for('ep:i/user-group-invites'), ep___i_userGroupInvites.default],
		[Symbol.for('ep:i/webhooks/create'), ep___i_webhooks_create.default],
		[Symbol.for('ep:i/webhooks/list'), ep___i_webhooks_list.default],
		[Symbol.for('ep:i/webhooks/show'), ep___i_webhooks_show.default],
		[Symbol.for('ep:i/webhooks/update'), ep___i_webhooks_update.default],
		[Symbol.for('ep:i/webhooks/delete'), ep___i_webhooks_delete.default],
		[Symbol.for('ep:messaging/history'), ep___messaging_history.default],
		[Symbol.for('ep:messaging/messages'), ep___messaging_messages.default],
		[Symbol.for('ep:messaging/messages/create'), ep___messaging_messages_create.default],
		[Symbol.for('ep:messaging/messages/delete'), ep___messaging_messages_delete.default],
		[Symbol.for('ep:messaging/messages/read'), ep___messaging_messages_read.default],
		[Symbol.for('ep:meta'), ep___meta.default],
		[Symbol.for('ep:emojis'), ep___emojis.default],
		[Symbol.for('ep:miauth/gen-token'), ep___miauth_genToken.default],
		[Symbol.for('ep:mute/create'), ep___mute_create.default],
		[Symbol.for('ep:mute/delete'), ep___mute_delete.default],
		[Symbol.for('ep:mute/list'), ep___mute_list.default],
		[Symbol.for('ep:my/apps'), ep___my_apps.default],
		[Symbol.for('ep:notes'), ep___notes.default],
		[Symbol.for('ep:notes/children'), ep___notes_children.default],
		[Symbol.for('ep:notes/clips'), ep___notes_clips.default],
		[Symbol.for('ep:notes/conversation'), ep___notes_conversation.default],
		[Symbol.for('ep:notes/create'), ep___notes_create.default],
		[Symbol.for('ep:notes/delete'), ep___notes_delete.default],
		[Symbol.for('ep:notes/favorites/create'), ep___notes_favorites_create.default],
		[Symbol.for('ep:notes/favorites/delete'), ep___notes_favorites_delete.default],
		[Symbol.for('ep:notes/featured'), ep___notes_featured.default],
		[Symbol.for('ep:notes/global-timeline'), ep___notes_globalTimeline.default],
		[Symbol.for('ep:notes/hybrid-timeline'), ep___notes_hybridTimeline.default],
		[Symbol.for('ep:notes/local-timeline'), ep___notes_localTimeline.default],
		[Symbol.for('ep:notes/mentions'), ep___notes_mentions.default],
		[Symbol.for('ep:notes/polls/recommendation'), ep___notes_polls_recommendation.default],
		[Symbol.for('ep:notes/polls/vote'), ep___notes_polls_vote.default],
		[Symbol.for('ep:notes/reactions'), ep___notes_reactions.default],
		[Symbol.for('ep:notes/reactions/create'), ep___notes_reactions_create.default],
		[Symbol.for('ep:notes/reactions/delete'), ep___notes_reactions_delete.default],
		[Symbol.for('ep:notes/renotes'), ep___notes_renotes.default],
		[Symbol.for('ep:notes/replies'), ep___notes_replies.default],
		[Symbol.for('ep:notes/search-by-tag'), ep___notes_searchByTag.default],
		[Symbol.for('ep:notes/search'), ep___notes_search.default],
		[Symbol.for('ep:notes/show'), ep___notes_show.default],
		[Symbol.for('ep:notes/state'), ep___notes_state.default],
		[Symbol.for('ep:notes/thread-muting/create'), ep___notes_threadMuting_create.default],
		[Symbol.for('ep:notes/thread-muting/delete'), ep___notes_threadMuting_delete.default],
		[Symbol.for('ep:notes/timeline'), ep___notes_timeline.default],
		[Symbol.for('ep:notes/translate'), ep___notes_translate.default],
		[Symbol.for('ep:notes/unrenote'), ep___notes_unrenote.default],
		[Symbol.for('ep:notes/user-list-timeline'), ep___notes_userListTimeline.default],
		[Symbol.for('ep:notifications/create'), ep___notifications_create.default],
		[Symbol.for('ep:notifications/mark-all-as-read'), ep___notifications_markAllAsRead.default],
		[Symbol.for('ep:notifications/read'), ep___notifications_read.default],
		[Symbol.for('ep:page-push'), ep___pagePush.default],
		[Symbol.for('ep:pages/create'), ep___pages_create.default],
		[Symbol.for('ep:pages/delete'), ep___pages_delete.default],
		[Symbol.for('ep:pages/featured'), ep___pages_featured.default],
		[Symbol.for('ep:pages/like'), ep___pages_like.default],
		[Symbol.for('ep:pages/show'), ep___pages_show.default],
		[Symbol.for('ep:pages/unlike'), ep___pages_unlike.default],
		[Symbol.for('ep:pages/update'), ep___pages_update.default],
		[Symbol.for('ep:flash/create'), ep___flash_create.default],
		[Symbol.for('ep:flash/delete'), ep___flash_delete.default],
		[Symbol.for('ep:flash/featured'), ep___flash_featured.default],
		[Symbol.for('ep:flash/like'), ep___flash_like.default],
		[Symbol.for('ep:flash/show'), ep___flash_show.default],
		[Symbol.for('ep:flash/unlike'), ep___flash_unlike.default],
		[Symbol.for('ep:flash/update'), ep___flash_update.default],
		[Symbol.for('ep:flash/my'), ep___flash_my.default],
		[Symbol.for('ep:flash/my-likes'), ep___flash_myLikes.default],
		[Symbol.for('ep:ping'), ep___ping.default],
		[Symbol.for('ep:pinned-users'), ep___pinnedUsers.default],
		[Symbol.for('ep:promo/read'), ep___promo_read.default],
		[Symbol.for('ep:request-reset-password'), ep___requestResetPassword.default],
		[Symbol.for('ep:reset-db'), ep___resetDb.default],
		[Symbol.for('ep:reset-password'), ep___resetPassword.default],
		[Symbol.for('ep:server-info'), ep___serverInfo.default],
		[Symbol.for('ep:stats'), ep___stats.default],
		[Symbol.for('ep:sw/show-registration'), ep___sw_show_registration.default],
		[Symbol.for('ep:sw/update-registration'), ep___sw_update_registration.default],
		[Symbol.for('ep:sw/register'), ep___sw_register.default],
		[Symbol.for('ep:sw/unregister'), ep___sw_unregister.default],
		[Symbol.for('ep:test'), ep___test.default],
		[Symbol.for('ep:username/available'), ep___username_available.default],
		[Symbol.for('ep:users'), ep___users.default],
		[Symbol.for('ep:users/clips'), ep___users_clips.default],
		[Symbol.for('ep:users/followers'), ep___users_followers.default],
		[Symbol.for('ep:users/following'), ep___users_following.default],
		[Symbol.for('ep:users/gallery/posts'), ep___users_gallery_posts.default],
		[Symbol.for('ep:users/get-frequently-replied-users'), ep___users_getFrequentlyRepliedUsers.default],
		[Symbol.for('ep:users/groups/create'), ep___users_groups_create.default],
		[Symbol.for('ep:users/groups/delete'), ep___users_groups_delete.default],
		[Symbol.for('ep:users/groups/invitations/accept'), ep___users_groups_invitations_accept.default],
		[Symbol.for('ep:users/groups/invitations/reject'), ep___users_groups_invitations_reject.default],
		[Symbol.for('ep:users/groups/invite'), ep___users_groups_invite.default],
		[Symbol.for('ep:users/groups/joined'), ep___users_groups_joined.default],
		[Symbol.for('ep:users/groups/leave'), ep___users_groups_leave.default],
		[Symbol.for('ep:users/groups/owned'), ep___users_groups_owned.default],
		[Symbol.for('ep:users/groups/pull'), ep___users_groups_pull.default],
		[Symbol.for('ep:users/groups/show'), ep___users_groups_show.default],
		[Symbol.for('ep:users/groups/transfer'), ep___users_groups_transfer.default],
		[Symbol.for('ep:users/groups/update'), ep___users_groups_update.default],
		[Symbol.for('ep:users/lists/create'), ep___users_lists_create.default],
		[Symbol.for('ep:users/lists/delete'), ep___users_lists_delete.default],
		[Symbol.for('ep:users/lists/list'), ep___users_lists_list.default],
		[Symbol.for('ep:users/lists/pull'), ep___users_lists_pull.default],
		[Symbol.for('ep:users/lists/push'), ep___users_lists_push.default],
		[Symbol.for('ep:users/lists/show'), ep___users_lists_show.default],
		[Symbol.for('ep:users/lists/update'), ep___users_lists_update.default],
		[Symbol.for('ep:users/notes'), ep___users_notes.default],
		[Symbol.for('ep:users/pages'), ep___users_pages.default],
		[Symbol.for('ep:users/reactions'), ep___users_reactions.default],
		[Symbol.for('ep:users/recommendation'), ep___users_recommendation.default],
		[Symbol.for('ep:users/relation'), ep___users_relation.default],
		[Symbol.for('ep:users/report-abuse'), ep___users_reportAbuse.default],
		[Symbol.for('ep:users/search-by-username-and-host'), ep___users_searchByUsernameAndHost.default],
		[Symbol.for('ep:users/search'), ep___users_search.default],
		[Symbol.for('ep:users/show'), ep___users_show.default],
		[Symbol.for('ep:users/stats'), ep___users_stats.default],
		[Symbol.for('ep:users/achievements'), ep___users_achievements.default],
		[Symbol.for('ep:fetch-rss'), ep___fetchRss.default],
		[Symbol.for('ep:retention'), ep___retention.default],
	];
	for (const [serviceType, implCtor] of endpointsModule) {
		addSingletonCtor(services, serviceType, implCtor);
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
	addEndpointsModule(services);
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
