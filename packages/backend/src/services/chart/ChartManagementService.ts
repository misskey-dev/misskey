import { Container, Service, Inject } from 'typedi';
import { beforeShutdown } from '@/misc/before-shutdown.js';

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

@Service()
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
		// TODO: 専用のサービスに切り出す
		setInterval(() => {
			for (const chart of charts) {
				chart.save();
			}
		}, 1000 * 60 * 20);
		
		beforeShutdown(() => Promise.all(charts.map(chart => chart.save())));
	}
}
