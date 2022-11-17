import { Module } from '@nestjs/common';
import { DI } from '../di-symbols.js';
import { AccountUpdateService } from './AccountUpdateService.js';
import { AiService } from './AiService.js';
import { AntennaService } from './AntennaService.js';
import { AppLockService } from './AppLockService.js';
import { CaptchaService } from './CaptchaService.js';
import { CreateNotificationService } from './CreateNotificationService.js';
import { CreateSystemUserService } from './CreateSystemUserService.js';
import { CustomEmojiService } from './CustomEmojiService.js';
import { DeleteAccountService } from './DeleteAccountService.js';
import { DownloadService } from './DownloadService.js';
import { DriveService } from './DriveService.js';
import { EmailService } from './EmailService.js';
import { FederatedInstanceService } from './FederatedInstanceService.js';
import { FetchInstanceMetadataService } from './FetchInstanceMetadataService.js';
import { GlobalEventService } from './GlobalEventService.js';
import { HashtagService } from './HashtagService.js';
import { HttpRequestService } from './HttpRequestService.js';
import { IdService } from './IdService.js';
import { ImageProcessingService } from './ImageProcessingService.js';
import { InstanceActorService } from './InstanceActorService.js';
import { InternalStorageService } from './InternalStorageService.js';
import { MessagingService } from './MessagingService.js';
import { MetaService } from './MetaService.js';
import { MfmService } from './MfmService.js';
import { ModerationLogService } from './ModerationLogService.js';
import { NoteCreateService } from './NoteCreateService.js';
import { NoteDeleteService } from './NoteDeleteService.js';
import { NotePiningService } from './NotePiningService.js';
import { NoteReadService } from './NoteReadService.js';
import { NotificationService } from './NotificationService.js';
import { PollService } from './PollService.js';
import { PushNotificationService } from './PushNotificationService.js';
import { QueryService } from './QueryService.js';
import { ReactionService } from './ReactionService.js';
import { RelayService } from './RelayService.js';
import { S3Service } from './S3Service.js';
import { SignupService } from './SignupService.js';
import { TwoFactorAuthenticationService } from './TwoFactorAuthenticationService.js';
import { UserBlockingService } from './UserBlockingService.js';
import { UserCacheService } from './UserCacheService.js';
import { UserFollowingService } from './UserFollowingService.js';
import { UserKeypairStoreService } from './UserKeypairStoreService.js';
import { UserListService } from './UserListService.js';
import { UserMutingService } from './UserMutingService.js';
import { UserSuspendService } from './UserSuspendService.js';
import { VideoProcessingService } from './VideoProcessingService.js';
import { WebhookService } from './WebhookService.js';
import { ProxyAccountService } from './ProxyAccountService.js';
import { UtilityService } from './UtilityService.js';
import { FileInfoService } from './FileInfoService.js';
import { ChartLoggerService } from './chart/ChartLoggerService.js';
import FederationChart from './chart/charts/federation.js';
import NotesChart from './chart/charts/notes.js';
import UsersChart from './chart/charts/users.js';
import ActiveUsersChart from './chart/charts/active-users.js';
import InstanceChart from './chart/charts/instance.js';
import PerUserNotesChart from './chart/charts/per-user-notes.js';
import DriveChart from './chart/charts/drive.js';
import PerUserReactionsChart from './chart/charts/per-user-reactions.js';
import HashtagChart from './chart/charts/hashtag.js';
import PerUserFollowingChart from './chart/charts/per-user-following.js';
import PerUserDriveChart from './chart/charts/per-user-drive.js';
import ApRequestChart from './chart/charts/ap-request.js';
import { ChartManagementService } from './chart/ChartManagementService.js';
import { AbuseUserReportEntityService } from './entities/AbuseUserReportEntityService.js';
import { AntennaEntityService } from './entities/AntennaEntityService.js';
import { AppEntityService } from './entities/AppEntityService.js';
import { AuthSessionEntityService } from './entities/AuthSessionEntityService.js';
import { BlockingEntityService } from './entities/BlockingEntityService.js';
import { ChannelEntityService } from './entities/ChannelEntityService.js';
import { ClipEntityService } from './entities/ClipEntityService.js';
import { DriveFileEntityService } from './entities/DriveFileEntityService.js';
import { DriveFolderEntityService } from './entities/DriveFolderEntityService.js';
import { EmojiEntityService } from './entities/EmojiEntityService.js';
import { FollowingEntityService } from './entities/FollowingEntityService.js';
import { FollowRequestEntityService } from './entities/FollowRequestEntityService.js';
import { GalleryLikeEntityService } from './entities/GalleryLikeEntityService.js';
import { GalleryPostEntityService } from './entities/GalleryPostEntityService.js';
import { HashtagEntityService } from './entities/HashtagEntityService.js';
import { InstanceEntityService } from './entities/InstanceEntityService.js';
import { MessagingMessageEntityService } from './entities/MessagingMessageEntityService.js';
import { ModerationLogEntityService } from './entities/ModerationLogEntityService.js';
import { MutingEntityService } from './entities/MutingEntityService.js';
import { NoteEntityService } from './entities/NoteEntityService.js';
import { NoteFavoriteEntityService } from './entities/NoteFavoriteEntityService.js';
import { NoteReactionEntityService } from './entities/NoteReactionEntityService.js';
import { NotificationEntityService } from './entities/NotificationEntityService.js';
import { PageEntityService } from './entities/PageEntityService.js';
import { PageLikeEntityService } from './entities/PageLikeEntityService.js';
import { SigninEntityService } from './entities/SigninEntityService.js';
import { UserEntityService } from './entities/UserEntityService.js';
import { UserGroupEntityService } from './entities/UserGroupEntityService.js';
import { UserGroupInvitationEntityService } from './entities/UserGroupInvitationEntityService.js';
import { UserListEntityService } from './entities/UserListEntityService.js';
import { ApAudienceService } from './remote/activitypub/ApAudienceService.js';
import { ApDbResolverService } from './remote/activitypub/ApDbResolverService.js';
import { ApDeliverManagerService } from './remote/activitypub/ApDeliverManagerService.js';
import { ApInboxService } from './remote/activitypub/ApInboxService.js';
import { ApLoggerService } from './remote/activitypub/ApLoggerService.js';
import { ApMfmService } from './remote/activitypub/ApMfmService.js';
import { ApRendererService } from './remote/activitypub/ApRendererService.js';
import { ApRequestService } from './remote/activitypub/ApRequestService.js';
import { ApResolverService } from './remote/activitypub/ApResolverService.js';
import { LdSignatureService } from './remote/activitypub/LdSignatureService.js';
import { RemoteLoggerService } from './remote/RemoteLoggerService.js';
import { ResolveUserService } from './remote/ResolveUserService.js';
import { WebfingerService } from './remote/WebfingerService.js';
import { ApImageService } from './remote/activitypub/models/ApImageService.js';
import { ApMentionService } from './remote/activitypub/models/ApMentionService.js';
import { ApNoteService } from './remote/activitypub/models/ApNoteService.js';
import { ApPersonService } from './remote/activitypub/models/ApPersonService.js';
import { ApQuestionService } from './remote/activitypub/models/ApQuestionService.js';
import { QueueModule } from './queue/QueueModule.js';
import { QueueService } from './QueueService.js';
import { LoggerService } from './LoggerService.js';
import type { Provider } from '@nestjs/common';

//#region 文字列ベースでのinjection用(循環参照対応のため)
const $LoggerService: Provider = { provide: 'LoggerService', useExisting: LoggerService };
const $AccountUpdateService: Provider = { provide: 'AccountUpdateService', useExisting: AccountUpdateService };
const $AiService: Provider = { provide: 'AiService', useExisting: AiService };
const $AntennaService: Provider = { provide: 'AntennaService', useExisting: AntennaService };
const $AppLockService: Provider = { provide: 'AppLockService', useExisting: AppLockService };
const $CaptchaService: Provider = { provide: 'CaptchaService', useExisting: CaptchaService };
const $CreateNotificationService: Provider = { provide: 'CreateNotificationService', useExisting: CreateNotificationService };
const $CreateSystemUserService: Provider = { provide: 'CreateSystemUserService', useExisting: CreateSystemUserService };
const $CustomEmojiService: Provider = { provide: 'CustomEmojiService', useExisting: CustomEmojiService };
const $DeleteAccountService: Provider = { provide: 'DeleteAccountService', useExisting: DeleteAccountService };
const $DownloadService: Provider = { provide: 'DownloadService', useExisting: DownloadService };
const $DriveService: Provider = { provide: 'DriveService', useExisting: DriveService };
const $EmailService: Provider = { provide: 'EmailService', useExisting: EmailService };
const $FederatedInstanceService: Provider = { provide: 'FederatedInstanceService', useExisting: FederatedInstanceService };
const $FetchInstanceMetadataService: Provider = { provide: 'FetchInstanceMetadataService', useExisting: FetchInstanceMetadataService };
const $GlobalEventService: Provider = { provide: 'GlobalEventService', useExisting: GlobalEventService };
const $HashtagService: Provider = { provide: 'HashtagService', useExisting: HashtagService };
const $HttpRequestService: Provider = { provide: 'HttpRequestService', useExisting: HttpRequestService };
const $IdService: Provider = { provide: 'IdService', useExisting: IdService };
const $ImageProcessingService: Provider = { provide: 'ImageProcessingService', useExisting: ImageProcessingService };
const $InstanceActorService: Provider = { provide: 'InstanceActorService', useExisting: InstanceActorService };
const $InternalStorageService: Provider = { provide: 'InternalStorageService', useExisting: InternalStorageService };
const $MessagingService: Provider = { provide: 'MessagingService', useExisting: MessagingService };
const $MetaService: Provider = { provide: 'MetaService', useExisting: MetaService };
const $MfmService: Provider = { provide: 'MfmService', useExisting: MfmService };
const $ModerationLogService: Provider = { provide: 'ModerationLogService', useExisting: ModerationLogService };
const $NoteCreateService: Provider = { provide: 'NoteCreateService', useExisting: NoteCreateService };
const $NoteDeleteService: Provider = { provide: 'NoteDeleteService', useExisting: NoteDeleteService };
const $NotePiningService: Provider = { provide: 'NotePiningService', useExisting: NotePiningService };
const $NoteReadService: Provider = { provide: 'NoteReadService', useExisting: NoteReadService };
const $NotificationService: Provider = { provide: 'NotificationService', useExisting: NotificationService };
const $PollService: Provider = { provide: 'PollService', useExisting: PollService };
const $ProxyAccountService: Provider = { provide: 'ProxyAccountService', useExisting: ProxyAccountService };
const $PushNotificationService: Provider = { provide: 'PushNotificationService', useExisting: PushNotificationService };
const $QueryService: Provider = { provide: 'QueryService', useExisting: QueryService };
const $ReactionService: Provider = { provide: 'ReactionService', useExisting: ReactionService };
const $RelayService: Provider = { provide: 'RelayService', useExisting: RelayService };
const $S3Service: Provider = { provide: 'S3Service', useExisting: S3Service };
const $SignupService: Provider = { provide: 'SignupService', useExisting: SignupService };
const $TwoFactorAuthenticationService: Provider = { provide: 'TwoFactorAuthenticationService', useExisting: TwoFactorAuthenticationService };
const $UserBlockingService: Provider = { provide: 'UserBlockingService', useExisting: UserBlockingService };
const $UserCacheService: Provider = { provide: 'UserCacheService', useExisting: UserCacheService };
const $UserFollowingService: Provider = { provide: 'UserFollowingService', useExisting: UserFollowingService };
const $UserKeypairStoreService: Provider = { provide: 'UserKeypairStoreService', useExisting: UserKeypairStoreService };
const $UserListService: Provider = { provide: 'UserListService', useExisting: UserListService };
const $UserMutingService: Provider = { provide: 'UserMutingService', useExisting: UserMutingService };
const $UserSuspendService: Provider = { provide: 'UserSuspendService', useExisting: UserSuspendService };
const $VideoProcessingService: Provider = { provide: 'VideoProcessingService', useExisting: VideoProcessingService };
const $WebhookService: Provider = { provide: 'WebhookService', useExisting: WebhookService };
const $UtilityService: Provider = { provide: 'UtilityService', useExisting: UtilityService };
const $FileInfoService: Provider = { provide: 'FileInfoService', useExisting: FileInfoService };
const $ChartLoggerService: Provider = { provide: 'ChartLoggerService', useExisting: ChartLoggerService };
const $FederationChart: Provider = { provide: 'FederationChart', useExisting: FederationChart };
const $NotesChart: Provider = { provide: 'NotesChart', useExisting: NotesChart };
const $UsersChart: Provider = { provide: 'UsersChart', useExisting: UsersChart };
const $ActiveUsersChart: Provider = { provide: 'ActiveUsersChart', useExisting: ActiveUsersChart };
const $InstanceChart: Provider = { provide: 'InstanceChart', useExisting: InstanceChart };
const $PerUserNotesChart: Provider = { provide: 'PerUserNotesChart', useExisting: PerUserNotesChart };
const $DriveChart: Provider = { provide: 'DriveChart', useExisting: DriveChart };
const $PerUserReactionsChart: Provider = { provide: 'PerUserReactionsChart', useExisting: PerUserReactionsChart };
const $HashtagChart: Provider = { provide: 'HashtagChart', useExisting: HashtagChart };
const $PerUserFollowingChart: Provider = { provide: 'PerUserFollowingChart', useExisting: PerUserFollowingChart };
const $PerUserDriveChart: Provider = { provide: 'PerUserDriveChart', useExisting: PerUserDriveChart };
const $ApRequestChart: Provider = { provide: 'ApRequestChart', useExisting: ApRequestChart };
const $ChartManagementService: Provider = { provide: 'ChartManagementService', useExisting: ChartManagementService };

const $AbuseUserReportEntityService: Provider = { provide: 'AbuseUserReportEntityService', useExisting: AbuseUserReportEntityService };
const $AntennaEntityService: Provider = { provide: 'AntennaEntityService', useExisting: AntennaEntityService };
const $AppEntityService: Provider = { provide: 'AppEntityService', useExisting: AppEntityService };
const $AuthSessionEntityService: Provider = { provide: 'AuthSessionEntityService', useExisting: AuthSessionEntityService };
const $BlockingEntityService: Provider = { provide: 'BlockingEntityService', useExisting: BlockingEntityService };
const $ChannelEntityService: Provider = { provide: 'ChannelEntityService', useExisting: ChannelEntityService };
const $ClipEntityService: Provider = { provide: 'ClipEntityService', useExisting: ClipEntityService };
const $DriveFileEntityService: Provider = { provide: 'DriveFileEntityService', useExisting: DriveFileEntityService };
const $DriveFolderEntityService: Provider = { provide: 'DriveFolderEntityService', useExisting: DriveFolderEntityService };
const $EmojiEntityService: Provider = { provide: 'EmojiEntityService', useExisting: EmojiEntityService };
const $FollowingEntityService: Provider = { provide: 'FollowingEntityService', useExisting: FollowingEntityService };
const $FollowRequestEntityService: Provider = { provide: 'FollowRequestEntityService', useExisting: FollowRequestEntityService };
const $GalleryLikeEntityService: Provider = { provide: 'GalleryLikeEntityService', useExisting: GalleryLikeEntityService };
const $GalleryPostEntityService: Provider = { provide: 'GalleryPostEntityService', useExisting: GalleryPostEntityService };
const $HashtagEntityService: Provider = { provide: 'HashtagEntityService', useExisting: HashtagEntityService };
const $InstanceEntityService: Provider = { provide: 'InstanceEntityService', useExisting: InstanceEntityService };
const $MessagingMessageEntityService: Provider = { provide: 'MessagingMessageEntityService', useExisting: MessagingMessageEntityService };
const $ModerationLogEntityService: Provider = { provide: 'ModerationLogEntityService', useExisting: ModerationLogEntityService };
const $MutingEntityService: Provider = { provide: 'MutingEntityService', useExisting: MutingEntityService };
const $NoteEntityService: Provider = { provide: 'NoteEntityService', useExisting: NoteEntityService };
const $NoteFavoriteEntityService: Provider = { provide: 'NoteFavoriteEntityService', useExisting: NoteFavoriteEntityService };
const $NoteReactionEntityService: Provider = { provide: 'NoteReactionEntityService', useExisting: NoteReactionEntityService };
const $NotificationEntityService: Provider = { provide: 'NotificationEntityService', useExisting: NotificationEntityService };
const $PageEntityService: Provider = { provide: 'PageEntityService', useExisting: PageEntityService };
const $PageLikeEntityService: Provider = { provide: 'PageLikeEntityService', useExisting: PageLikeEntityService };
const $SigninEntityService: Provider = { provide: 'SigninEntityService', useExisting: SigninEntityService };
const $UserEntityService: Provider = { provide: 'UserEntityService', useExisting: UserEntityService };
const $UserGroupEntityService: Provider = { provide: 'UserGroupEntityService', useExisting: UserGroupEntityService };
const $UserGroupInvitationEntityService: Provider = { provide: 'UserGroupInvitationEntityService', useExisting: UserGroupInvitationEntityService };
const $UserListEntityService: Provider = { provide: 'UserListEntityService', useExisting: UserListEntityService };

const $ApAudienceService: Provider = { provide: 'ApAudienceService', useExisting: ApAudienceService };
const $ApDbResolverService: Provider = { provide: 'ApDbResolverService', useExisting: ApDbResolverService };
const $ApDeliverManagerService: Provider = { provide: 'ApDeliverManagerService', useExisting: ApDeliverManagerService };
const $ApInboxService: Provider = { provide: 'ApInboxService', useExisting: ApInboxService };
const $ApLoggerService: Provider = { provide: 'ApLoggerService', useExisting: ApLoggerService };
const $ApMfmService: Provider = { provide: 'ApMfmService', useExisting: ApMfmService };
const $ApRendererService: Provider = { provide: 'ApRendererService', useExisting: ApRendererService };
const $ApRequestService: Provider = { provide: 'ApRequestService', useExisting: ApRequestService };
const $ApResolverService: Provider = { provide: 'ApResolverService', useExisting: ApResolverService };
const $LdSignatureService: Provider = { provide: 'LdSignatureService', useExisting: LdSignatureService };
const $RemoteLoggerService: Provider = { provide: 'RemoteLoggerService', useExisting: RemoteLoggerService };
const $ResolveUserService: Provider = { provide: 'ResolveUserService', useExisting: ResolveUserService };
const $WebfingerService: Provider = { provide: 'WebfingerService', useExisting: WebfingerService };
const $ApImageService: Provider = { provide: 'ApImageService', useExisting: ApImageService };
const $ApMentionService: Provider = { provide: 'ApMentionService', useExisting: ApMentionService };
const $ApNoteService: Provider = { provide: 'ApNoteService', useExisting: ApNoteService };
const $ApPersonService: Provider = { provide: 'ApPersonService', useExisting: ApPersonService };
const $ApQuestionService: Provider = { provide: 'ApQuestionService', useExisting: ApQuestionService };
//#endregion

@Module({
	imports: [
		QueueModule,
	],
	providers: [
		LoggerService,
		AccountUpdateService,
		AiService,
		AntennaService,
		AppLockService,
		CaptchaService,
		CreateNotificationService,
		CreateSystemUserService,
		CustomEmojiService,
		DeleteAccountService,
		DownloadService,
		DriveService,
		EmailService,
		FederatedInstanceService,
		FetchInstanceMetadataService,
		GlobalEventService,
		HashtagService,
		HttpRequestService,
		IdService,
		ImageProcessingService,
		InstanceActorService,
		InternalStorageService,
		MessagingService,
		MetaService,
		MfmService,
		ModerationLogService,
		NoteCreateService,
		NoteDeleteService,
		NotePiningService,
		NoteReadService,
		NotificationService,
		PollService,
		ProxyAccountService,
		PushNotificationService,
		QueryService,
		ReactionService,
		RelayService,
		S3Service,
		SignupService,
		TwoFactorAuthenticationService,
		UserBlockingService,
		UserCacheService,
		UserFollowingService,
		UserKeypairStoreService,
		UserListService,
		UserMutingService,
		UserSuspendService,
		VideoProcessingService,
		WebhookService,
		UtilityService,
		FileInfoService,
		ChartLoggerService,
		FederationChart,
		NotesChart,
		UsersChart,
		ActiveUsersChart,
		InstanceChart,
		PerUserNotesChart,
		DriveChart,
		PerUserReactionsChart,
		HashtagChart,
		PerUserFollowingChart,
		PerUserDriveChart,
		ApRequestChart,
		ChartManagementService,
		AbuseUserReportEntityService,
		AntennaEntityService,
		AppEntityService,
		AuthSessionEntityService,
		BlockingEntityService,
		ChannelEntityService,
		ClipEntityService,
		DriveFileEntityService,
		DriveFolderEntityService,
		EmojiEntityService,
		FollowingEntityService,
		FollowRequestEntityService,
		GalleryLikeEntityService,
		GalleryPostEntityService,
		HashtagEntityService,
		InstanceEntityService,
		MessagingMessageEntityService,
		ModerationLogEntityService,
		MutingEntityService,
		NoteEntityService,
		NoteFavoriteEntityService,
		NoteReactionEntityService,
		NotificationEntityService,
		PageEntityService,
		PageLikeEntityService,
		SigninEntityService,
		UserEntityService,
		UserGroupEntityService,
		UserGroupInvitationEntityService,
		UserListEntityService,
		ApAudienceService,
		ApDbResolverService,
		ApDeliverManagerService,
		ApInboxService,
		ApLoggerService,
		ApMfmService,
		ApRendererService,
		ApRequestService,
		ApResolverService,
		LdSignatureService,
		RemoteLoggerService,
		ResolveUserService,
		WebfingerService,
		ApImageService,
		ApMentionService,
		ApNoteService,
		ApPersonService,
		ApQuestionService,
		QueueService,

		//#region 文字列ベースでのinjection用(循環参照対応のため)
		$LoggerService,
		$AccountUpdateService,
		$AiService,
		$AntennaService,
		$AppLockService,
		$CaptchaService,
		$CreateNotificationService,
		$CreateSystemUserService,
		$CustomEmojiService,
		$DeleteAccountService,
		$DownloadService,
		$DriveService,
		$EmailService,
		$FederatedInstanceService,
		$FetchInstanceMetadataService,
		$GlobalEventService,
		$HashtagService,
		$HttpRequestService,
		$IdService,
		$ImageProcessingService,
		$InstanceActorService,
		$InternalStorageService,
		$MessagingService,
		$MetaService,
		$MfmService,
		$ModerationLogService,
		$NoteCreateService,
		$NoteDeleteService,
		$NotePiningService,
		$NoteReadService,
		$NotificationService,
		$PollService,
		$ProxyAccountService,
		$PushNotificationService,
		$QueryService,
		$ReactionService,
		$RelayService,
		$S3Service,
		$SignupService,
		$TwoFactorAuthenticationService,
		$UserBlockingService,
		$UserCacheService,
		$UserFollowingService,
		$UserKeypairStoreService,
		$UserListService,
		$UserMutingService,
		$UserSuspendService,
		$VideoProcessingService,
		$WebhookService,
		$UtilityService,
		$FileInfoService,
		$ChartLoggerService,
		$FederationChart,
		$NotesChart,
		$UsersChart,
		$ActiveUsersChart,
		$InstanceChart,
		$PerUserNotesChart,
		$DriveChart,
		$PerUserReactionsChart,
		$HashtagChart,
		$PerUserFollowingChart,
		$PerUserDriveChart,
		$ApRequestChart,
		$ChartManagementService,
		$AbuseUserReportEntityService,
		$AntennaEntityService,
		$AppEntityService,
		$AuthSessionEntityService,
		$BlockingEntityService,
		$ChannelEntityService,
		$ClipEntityService,
		$DriveFileEntityService,
		$DriveFolderEntityService,
		$EmojiEntityService,
		$FollowingEntityService,
		$FollowRequestEntityService,
		$GalleryLikeEntityService,
		$GalleryPostEntityService,
		$HashtagEntityService,
		$InstanceEntityService,
		$MessagingMessageEntityService,
		$ModerationLogEntityService,
		$MutingEntityService,
		$NoteEntityService,
		$NoteFavoriteEntityService,
		$NoteReactionEntityService,
		$NotificationEntityService,
		$PageEntityService,
		$PageLikeEntityService,
		$SigninEntityService,
		$UserEntityService,
		$UserGroupEntityService,
		$UserGroupInvitationEntityService,
		$UserListEntityService,
		$ApAudienceService,
		$ApDbResolverService,
		$ApDeliverManagerService,
		$ApInboxService,
		$ApLoggerService,
		$ApMfmService,
		$ApRendererService,
		$ApRequestService,
		$ApResolverService,
		$LdSignatureService,
		$RemoteLoggerService,
		$ResolveUserService,
		$WebfingerService,
		$ApImageService,
		$ApMentionService,
		$ApNoteService,
		$ApPersonService,
		$ApQuestionService,
		//#endregion
	],
	exports: [
		QueueModule,
		LoggerService,
		AccountUpdateService,
		AiService,
		AntennaService,
		AppLockService,
		CaptchaService,
		CreateNotificationService,
		CreateSystemUserService,
		CustomEmojiService,
		DeleteAccountService,
		DownloadService,
		DriveService,
		EmailService,
		FederatedInstanceService,
		FetchInstanceMetadataService,
		GlobalEventService,
		HashtagService,
		HttpRequestService,
		IdService,
		ImageProcessingService,
		InstanceActorService,
		InternalStorageService,
		MessagingService,
		MetaService,
		MfmService,
		ModerationLogService,
		NoteCreateService,
		NoteDeleteService,
		NotePiningService,
		NoteReadService,
		NotificationService,
		PollService,
		ProxyAccountService,
		PushNotificationService,
		QueryService,
		ReactionService,
		RelayService,
		S3Service,
		SignupService,
		TwoFactorAuthenticationService,
		UserBlockingService,
		UserCacheService,
		UserFollowingService,
		UserKeypairStoreService,
		UserListService,
		UserMutingService,
		UserSuspendService,
		VideoProcessingService,
		WebhookService,
		UtilityService,
		FileInfoService,
		FederationChart,
		NotesChart,
		UsersChart,
		ActiveUsersChart,
		InstanceChart,
		PerUserNotesChart,
		DriveChart,
		PerUserReactionsChart,
		HashtagChart,
		PerUserFollowingChart,
		PerUserDriveChart,
		ApRequestChart,
		ChartManagementService,
		AbuseUserReportEntityService,
		AntennaEntityService,
		AppEntityService,
		AuthSessionEntityService,
		BlockingEntityService,
		ChannelEntityService,
		ClipEntityService,
		DriveFileEntityService,
		DriveFolderEntityService,
		EmojiEntityService,
		FollowingEntityService,
		FollowRequestEntityService,
		GalleryLikeEntityService,
		GalleryPostEntityService,
		HashtagEntityService,
		InstanceEntityService,
		MessagingMessageEntityService,
		ModerationLogEntityService,
		MutingEntityService,
		NoteEntityService,
		NoteFavoriteEntityService,
		NoteReactionEntityService,
		NotificationEntityService,
		PageEntityService,
		PageLikeEntityService,
		SigninEntityService,
		UserEntityService,
		UserGroupEntityService,
		UserGroupInvitationEntityService,
		UserListEntityService,
		ApAudienceService,
		ApDbResolverService,
		ApDeliverManagerService,
		ApInboxService,
		ApLoggerService,
		ApMfmService,
		ApRendererService,
		ApRequestService,
		ApResolverService,
		LdSignatureService,
		RemoteLoggerService,
		ResolveUserService,
		WebfingerService,
		ApImageService,
		ApMentionService,
		ApNoteService,
		ApPersonService,
		ApQuestionService,
		QueueService,

		//#region 文字列ベースでのinjection用(循環参照対応のため)
		$LoggerService,
		$AccountUpdateService,
		$AiService,
		$AntennaService,
		$AppLockService,
		$CaptchaService,
		$CreateNotificationService,
		$CreateSystemUserService,
		$CustomEmojiService,
		$DeleteAccountService,
		$DownloadService,
		$DriveService,
		$EmailService,
		$FederatedInstanceService,
		$FetchInstanceMetadataService,
		$GlobalEventService,
		$HashtagService,
		$HttpRequestService,
		$IdService,
		$ImageProcessingService,
		$InstanceActorService,
		$InternalStorageService,
		$MessagingService,
		$MetaService,
		$MfmService,
		$ModerationLogService,
		$NoteCreateService,
		$NoteDeleteService,
		$NotePiningService,
		$NoteReadService,
		$NotificationService,
		$PollService,
		$ProxyAccountService,
		$PushNotificationService,
		$QueryService,
		$ReactionService,
		$RelayService,
		$S3Service,
		$SignupService,
		$TwoFactorAuthenticationService,
		$UserBlockingService,
		$UserCacheService,
		$UserFollowingService,
		$UserKeypairStoreService,
		$UserListService,
		$UserMutingService,
		$UserSuspendService,
		$VideoProcessingService,
		$WebhookService,
		$UtilityService,
		$FileInfoService,
		$FederationChart,
		$NotesChart,
		$UsersChart,
		$ActiveUsersChart,
		$InstanceChart,
		$PerUserNotesChart,
		$DriveChart,
		$PerUserReactionsChart,
		$HashtagChart,
		$PerUserFollowingChart,
		$PerUserDriveChart,
		$ApRequestChart,
		$ChartManagementService,
		$AbuseUserReportEntityService,
		$AntennaEntityService,
		$AppEntityService,
		$AuthSessionEntityService,
		$BlockingEntityService,
		$ChannelEntityService,
		$ClipEntityService,
		$DriveFileEntityService,
		$DriveFolderEntityService,
		$EmojiEntityService,
		$FollowingEntityService,
		$FollowRequestEntityService,
		$GalleryLikeEntityService,
		$GalleryPostEntityService,
		$HashtagEntityService,
		$InstanceEntityService,
		$MessagingMessageEntityService,
		$ModerationLogEntityService,
		$MutingEntityService,
		$NoteEntityService,
		$NoteFavoriteEntityService,
		$NoteReactionEntityService,
		$NotificationEntityService,
		$PageEntityService,
		$PageLikeEntityService,
		$SigninEntityService,
		$UserEntityService,
		$UserGroupEntityService,
		$UserGroupInvitationEntityService,
		$UserListEntityService,
		$ApAudienceService,
		$ApDbResolverService,
		$ApDeliverManagerService,
		$ApInboxService,
		$ApLoggerService,
		$ApMfmService,
		$ApRendererService,
		$ApRequestService,
		$ApResolverService,
		$LdSignatureService,
		$RemoteLoggerService,
		$ResolveUserService,
		$WebfingerService,
		$ApImageService,
		$ApMentionService,
		$ApNoteService,
		$ApPersonService,
		$ApQuestionService,
		//#endregion
	],
})
export class CoreModule {}
