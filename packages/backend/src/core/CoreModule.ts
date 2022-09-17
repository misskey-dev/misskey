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
import type { Provider } from '@nestjs/common';

//#region 文字列ベースでのinjection用(循環参照対応のため)
const $AccountUpdateService: Provider = { provide: 'AccountUpdateService', useClass: AccountUpdateService };
const $AiService: Provider = { provide: 'AiService', useClass: AiService };
const $AntennaService: Provider = { provide: 'AntennaService', useClass: AntennaService };
const $AppLockService: Provider = { provide: 'AppLockService', useClass: AppLockService };
const $CaptchaService: Provider = { provide: 'CaptchaService', useClass: CaptchaService };
const $CreateNotificationService: Provider = { provide: 'CreateNotificationService', useClass: CreateNotificationService };
const $CreateSystemUserService: Provider = { provide: 'CreateSystemUserService', useClass: CreateSystemUserService };
const $CustomEmojiService: Provider = { provide: 'CustomEmojiService', useClass: CustomEmojiService };
const $DeleteAccountService: Provider = { provide: 'DeleteAccountService', useClass: DeleteAccountService };
const $DownloadService: Provider = { provide: 'DownloadService', useClass: DownloadService };
const $DriveService: Provider = { provide: 'DriveService', useClass: DriveService };
const $EmailService: Provider = { provide: 'EmailService', useClass: EmailService };
const $FederatedInstanceService: Provider = { provide: 'FederatedInstanceService', useClass: FederatedInstanceService };
const $FetchInstanceMetadataService: Provider = { provide: 'FetchInstanceMetadataService', useClass: FetchInstanceMetadataService };
const $GlobalEventService: Provider = { provide: 'GlobalEventService', useClass: GlobalEventService };
const $HashtagService: Provider = { provide: 'HashtagService', useClass: HashtagService };
const $HttpRequestService: Provider = { provide: 'HttpRequestService', useClass: HttpRequestService };
const $IdService: Provider = { provide: 'IdService', useClass: IdService };
const $ImageProcessingService: Provider = { provide: 'ImageProcessingService', useClass: ImageProcessingService };
const $InstanceActorService: Provider = { provide: 'InstanceActorService', useClass: InstanceActorService };
const $InternalStorageService: Provider = { provide: 'InternalStorageService', useClass: InternalStorageService };
const $MessagingService: Provider = { provide: 'MessagingService', useClass: MessagingService };
const $MetaService: Provider = { provide: 'MetaService', useClass: MetaService };
const $MfmService: Provider = { provide: 'MfmService', useClass: MfmService };
const $ModerationLogService: Provider = { provide: 'ModerationLogService', useClass: ModerationLogService };
const $NoteCreateService: Provider = { provide: 'NoteCreateService', useClass: NoteCreateService };
const $NoteDeleteService: Provider = { provide: 'NoteDeleteService', useClass: NoteDeleteService };
const $NotePiningService: Provider = { provide: 'NotePiningService', useClass: NotePiningService };
const $NoteReadService: Provider = { provide: 'NoteReadService', useClass: NoteReadService };
const $NotificationService: Provider = { provide: 'NotificationService', useClass: NotificationService };
const $PollService: Provider = { provide: 'PollService', useClass: PollService };
const $ProxyAccountService: Provider = { provide: 'ProxyAccountService', useClass: ProxyAccountService };
const $PushNotificationService: Provider = { provide: 'PushNotificationService', useClass: PushNotificationService };
const $QueryService: Provider = { provide: 'QueryService', useClass: QueryService };
const $ReactionService: Provider = { provide: 'ReactionService', useClass: ReactionService };
const $RelayService: Provider = { provide: 'RelayService', useClass: RelayService };
const $S3Service: Provider = { provide: 'S3Service', useClass: S3Service };
const $SignupService: Provider = { provide: 'SignupService', useClass: SignupService };
const $TwoFactorAuthenticationService: Provider = { provide: 'TwoFactorAuthenticationService', useClass: TwoFactorAuthenticationService };
const $UserBlockingService: Provider = { provide: 'UserBlockingService', useClass: UserBlockingService };
const $UserCacheService: Provider = { provide: 'UserCacheService', useClass: UserCacheService };
const $UserFollowingService: Provider = { provide: 'UserFollowingService', useClass: UserFollowingService };
const $UserKeypairStoreService: Provider = { provide: 'UserKeypairStoreService', useClass: UserKeypairStoreService };
const $UserListService: Provider = { provide: 'UserListService', useClass: UserListService };
const $UserMutingService: Provider = { provide: 'UserMutingService', useClass: UserMutingService };
const $UserSuspendService: Provider = { provide: 'UserSuspendService', useClass: UserSuspendService };
const $VideoProcessingService: Provider = { provide: 'VideoProcessingService', useClass: VideoProcessingService };
const $WebhookService: Provider = { provide: 'WebhookService', useClass: WebhookService };
const $UtilityService: Provider = { provide: 'UtilityService', useClass: UtilityService };
const $FileInfoService: Provider = { provide: 'FileInfoService', useClass: FileInfoService };
const $FederationChart: Provider = { provide: 'FederationChart', useClass: FederationChart };
const $NotesChart: Provider = { provide: 'NotesChart', useClass: NotesChart };
const $UsersChart: Provider = { provide: 'UsersChart', useClass: UsersChart };
const $ActiveUsersChart: Provider = { provide: 'ActiveUsersChart', useClass: ActiveUsersChart };
const $InstanceChart: Provider = { provide: 'InstanceChart', useClass: InstanceChart };
const $PerUserNotesChart: Provider = { provide: 'PerUserNotesChart', useClass: PerUserNotesChart };
const $DriveChart: Provider = { provide: 'DriveChart', useClass: DriveChart };
const $PerUserReactionsChart: Provider = { provide: 'PerUserReactionsChart', useClass: PerUserReactionsChart };
const $HashtagChart: Provider = { provide: 'HashtagChart', useClass: HashtagChart };
const $PerUserFollowingChart: Provider = { provide: 'PerUserFollowingChart', useClass: PerUserFollowingChart };
const $PerUserDriveChart: Provider = { provide: 'PerUserDriveChart', useClass: PerUserDriveChart };
const $ApRequestChart: Provider = { provide: 'ApRequestChart', useClass: ApRequestChart };
const $ChartManagementService: Provider = { provide: 'ChartManagementService', useClass: ChartManagementService };

const $AbuseUserReportEntityService: Provider = { provide: 'AbuseUserReportEntityService', useClass: AbuseUserReportEntityService };
const $AntennaEntityService: Provider = { provide: 'AntennaEntityService', useClass: AntennaEntityService };
const $AppEntityService: Provider = { provide: 'AppEntityService', useClass: AppEntityService };
const $AuthSessionEntityService: Provider = { provide: 'AuthSessionEntityService', useClass: AuthSessionEntityService };
const $BlockingEntityService: Provider = { provide: 'BlockingEntityService', useClass: BlockingEntityService };
const $ChannelEntityService: Provider = { provide: 'ChannelEntityService', useClass: ChannelEntityService };
const $ClipEntityService: Provider = { provide: 'ClipEntityService', useClass: ClipEntityService };
const $DriveFileEntityService: Provider = { provide: 'DriveFileEntityService', useClass: DriveFileEntityService };
const $DriveFolderEntityService: Provider = { provide: 'DriveFolderEntityService', useClass: DriveFolderEntityService };
const $EmojiEntityService: Provider = { provide: 'EmojiEntityService', useClass: EmojiEntityService };
const $FollowingEntityService: Provider = { provide: 'FollowingEntityService', useClass: FollowingEntityService };
const $FollowRequestEntityService: Provider = { provide: 'FollowRequestEntityService', useClass: FollowRequestEntityService };
const $GalleryLikeEntityService: Provider = { provide: 'GalleryLikeEntityService', useClass: GalleryLikeEntityService };
const $GalleryPostEntityService: Provider = { provide: 'GalleryPostEntityService', useClass: GalleryPostEntityService };
const $HashtagEntityService: Provider = { provide: 'HashtagEntityService', useClass: HashtagEntityService };
const $InstanceEntityService: Provider = { provide: 'InstanceEntityService', useClass: InstanceEntityService };
const $MessagingMessageEntityService: Provider = { provide: 'MessagingMessageEntityService', useClass: MessagingMessageEntityService };
const $ModerationLogEntityService: Provider = { provide: 'ModerationLogEntityService', useClass: ModerationLogEntityService };
const $MutingEntityService: Provider = { provide: 'MutingEntityService', useClass: MutingEntityService };
const $NoteEntityService: Provider = { provide: 'NoteEntityService', useClass: NoteEntityService };
const $NoteFavoriteEntityService: Provider = { provide: 'NoteFavoriteEntityService', useClass: NoteFavoriteEntityService };
const $NoteReactionEntityService: Provider = { provide: 'NoteReactionEntityService', useClass: NoteReactionEntityService };
const $NotificationEntityService: Provider = { provide: 'NotificationEntityService', useClass: NotificationEntityService };
const $PageEntityService: Provider = { provide: 'PageEntityService', useClass: PageEntityService };
const $PageLikeEntityService: Provider = { provide: 'PageLikeEntityService', useClass: PageLikeEntityService };
const $SigninEntityService: Provider = { provide: 'SigninEntityService', useClass: SigninEntityService };
const $UserEntityService: Provider = { provide: 'UserEntityService', useClass: UserEntityService };
const $UserGroupEntityService: Provider = { provide: 'UserGroupEntityService', useClass: UserGroupEntityService };
const $UserGroupInvitationEntityService: Provider = { provide: 'UserGroupInvitationEntityService', useClass: UserGroupInvitationEntityService };
const $UserListEntityService: Provider = { provide: 'UserListEntityService', useClass: UserListEntityService };

const $ApAudienceService: Provider = { provide: 'ApAudienceService', useClass: ApAudienceService };
const $ApDbResolverService: Provider = { provide: 'ApDbResolverService', useClass: ApDbResolverService };
const $ApDeliverManagerService: Provider = { provide: 'ApDeliverManagerService', useClass: ApDeliverManagerService };
const $ApInboxService: Provider = { provide: 'ApInboxService', useClass: ApInboxService };
const $ApLoggerService: Provider = { provide: 'ApLoggerService', useClass: ApLoggerService };
const $ApMfmService: Provider = { provide: 'ApMfmService', useClass: ApMfmService };
const $ApRendererService: Provider = { provide: 'ApRendererService', useClass: ApRendererService };
const $ApRequestService: Provider = { provide: 'ApRequestService', useClass: ApRequestService };
const $ApResolverService: Provider = { provide: 'ApResolverService', useClass: ApResolverService };
const $LdSignatureService: Provider = { provide: 'LdSignatureService', useClass: LdSignatureService };
const $RemoteLoggerService: Provider = { provide: 'RemoteLoggerService', useClass: RemoteLoggerService };
const $ResolveUserService: Provider = { provide: 'ResolveUserService', useClass: ResolveUserService };
const $WebfingerService: Provider = { provide: 'WebfingerService', useClass: WebfingerService };
const $ApImageService: Provider = { provide: 'ApImageService', useClass: ApImageService };
const $ApMentionService: Provider = { provide: 'ApMentionService', useClass: ApMentionService };
const $ApNoteService: Provider = { provide: 'ApNoteService', useClass: ApNoteService };
const $ApPersonService: Provider = { provide: 'ApPersonService', useClass: ApPersonService };
const $ApQuestionService: Provider = { provide: 'ApQuestionService', useClass: ApQuestionService };
//#endregion

@Module({
	imports: [
		QueueModule,
	],
	providers: [
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
	exports: [
		QueueModule,
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
