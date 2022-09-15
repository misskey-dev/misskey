import { Module } from '@nestjs/common';
import { DI } from '../di-symbols.js';
import { ChartsModule } from './chart/ChartsModule.js';
import { EntityModule } from './entities/EntityModule.js';
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

@Module({
	imports: [
		ChartsModule,
		EntityModule,
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
	],
	exports: [
		ChartsModule,
		EntityModule,
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
	],
})
export class CoreModule {}
