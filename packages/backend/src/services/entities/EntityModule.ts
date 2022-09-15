import { Module } from '@nestjs/common';
import { AbuseUserReportEntityService } from './AbuseUserReportEntityService.js';
import { AntennaEntityService } from './AntennaEntityService.js';
import { AppEntityService } from './AppEntityService.js';
import { AuthSessionEntityService } from './AuthSessionEntityService.js';
import { BlockingEntityService } from './BlockingEntityService.js';
import { ChannelEntityService } from './ChannelEntityService.js';
import { ClipEntityService } from './ClipEntityService.js';
import { DriveFileEntityService } from './DriveFileEntityService.js';
import { DriveFolderEntityService } from './DriveFolderEntityService.js';
import { EmojiEntityService } from './EmojiEntityService.js';
import { FollowingEntityService } from './FollowingEntityService.js';
import { FollowRequestEntityService } from './FollowRequestEntityService.js';
import { GalleryLikeEntityService } from './GalleryLikeEntityService.js';
import { GalleryPostEntityService } from './GalleryPostEntityService.js';
import { HashtagEntityService } from './HashtagEntityService.js';
import { InstanceEntityService } from './InstanceEntityService.js';
import { MessagingMessageEntityService } from './MessagingMessageEntityService.js';
import { ModerationLogEntityService } from './ModerationLogEntityService.js';
import { MutingEntityService } from './MutingEntityService.js';
import { NoteEntityService } from './NoteEntityService.js';
import { NoteFavoriteEntityService } from './NoteFavoriteEntityService.js';
import { NoteReactionEntityService } from './NoteReactionEntityService.js';
import { NotificationEntityService } from './NotificationEntityService.js';
import { PageEntityService } from './PageEntityService.js';
import { PageLikeEntityService } from './PageLikeEntityService.js';
import { SigninEntityService } from './SigninEntityService.js';
import { UserEntityService } from './UserEntityService.js';
import { UserGroupEntityService } from './UserGroupEntityService.js';
import { UserGroupInvitationEntityService } from './UserGroupInvitationEntityService.js';
import { UserListEntityService } from './UserListEntityService.js';

@Module({
	imports: [
	],
	providers: [
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
	],
})
export class EntityModule {}
