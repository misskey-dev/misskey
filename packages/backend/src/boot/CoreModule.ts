import { Ctor, IServiceCollection, addSingletonCtor } from 'yohira';
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

const CoreServices: readonly (readonly [symbol, Ctor<object>])[] = [
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

export function addCoreServices(services: IServiceCollection): void {
	for (const [serviceType, implCtor] of CoreServices) {
		addSingletonCtor(services, serviceType, implCtor);
	}
}
