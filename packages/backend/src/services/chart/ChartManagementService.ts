import { Injectable, Inject } from '@nestjs/common';
import { beforeShutdown } from '@/misc/before-shutdown.js';

import type FederationChart from './charts/federation.js';
import type NotesChart from './charts/notes.js';
import type UsersChart from './charts/users.js';
import type ActiveUsersChart from './charts/active-users.js';
import type InstanceChart from './charts/instance.js';
import type PerUserNotesChart from './charts/per-user-notes.js';
import type DriveChart from './charts/drive.js';
import type PerUserReactionsChart from './charts/per-user-reactions.js';
import type HashtagChart from './charts/hashtag.js';
import type PerUserFollowingChart from './charts/per-user-following.js';
import type PerUserDriveChart from './charts/per-user-drive.js';
import type ApRequestChart from './charts/ap-request.js';

@Injectable()
export class ChartManagementService {
	constructor(
		private federationChart: FederationChart,
		private notesChart: NotesChart,
		private usersChart: UsersChart,
		private activeUsersChart: ActiveUsersChart,
		private instanceChart: InstanceChart,
		private perUserNotesChart: PerUserNotesChart,
		private driveChart: DriveChart,
		private perUserReactionsChart: PerUserReactionsChart,
		private hashtagChart: HashtagChart,
		private perUserFollowingChart: PerUserFollowingChart,
		private perUserDriveChart: PerUserDriveChart,
		private apRequestChart: ApRequestChart,
	) {}

	public async run() {
		const charts = [
			this.federationChart,
			this.notesChart,
			this.usersChart,
			this.activeUsersChart,
			this.instanceChart,
			this.perUserNotesChart,
			this.driveChart,
			this.perUserReactionsChart,
			this.hashtagChart,
			this.perUserFollowingChart,
			this.perUserDriveChart,
			this.apRequestChart,
		];
		
		// 20分おきにメモリ情報をDBに書き込み
		setInterval(() => {
			for (const chart of charts) {
				chart.save();
			}
		}, 1000 * 60 * 20);
		
		beforeShutdown(() => Promise.all(charts.map(chart => chart.save())));
	}
}
