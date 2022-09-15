import { Module } from '@nestjs/common';
import FederationChart from './charts/federation.js';
import NotesChart from './charts/notes.js';
import UsersChart from './charts/users.js';
import ActiveUsersChart from './charts/active-users.js';
import InstanceChart from './charts/instance.js';
import PerUserNotesChart from './charts/per-user-notes.js';
import DriveChart from './charts/drive.js';
import PerUserReactionsChart from './charts/per-user-reactions.js';
import HashtagChart from './charts/hashtag.js';
import PerUserFollowingChart from './charts/per-user-following.js';
import PerUserDriveChart from './charts/per-user-drive.js';
import ApRequestChart from './charts/ap-request.js';
import { ChartManagementService } from './ChartManagementService.js';

@Module({
	imports: [
	],
	providers: [
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
	],
})
export class ChartsModule {}
