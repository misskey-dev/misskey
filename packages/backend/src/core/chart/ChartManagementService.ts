import { IAsyncDisposable } from 'yohira';
import { Inject, Injectable } from '@/di-decorators.js';
import { bindThis } from '@/decorators.js';
import { DI } from '@/di-symbols.js';
import FederationChart from './charts/federation.js';
import NotesChart from './charts/notes.js';
import UsersChart from './charts/users.js';
import ActiveUsersChart from './charts/active-users.js';
import InstanceChart from './charts/instance.js';
import PerUserNotesChart from './charts/per-user-notes.js';
import PerUserPvChart from './charts/per-user-pv.js';
import DriveChart from './charts/drive.js';
import PerUserReactionsChart from './charts/per-user-reactions.js';
import PerUserFollowingChart from './charts/per-user-following.js';
import PerUserDriveChart from './charts/per-user-drive.js';
import ApRequestChart from './charts/ap-request.js';

@Injectable()
export class ChartManagementService implements IAsyncDisposable {
	private charts;
	private saveIntervalId: NodeJS.Timer;

	constructor(
		@Inject(DI.FederationChart)
		private federationChart: FederationChart,

		@Inject(DI.NotesChart)
		private notesChart: NotesChart,

		@Inject(DI.UsersChart)
		private usersChart: UsersChart,

		@Inject(DI.ActiveUsersChart)
		private activeUsersChart: ActiveUsersChart,

		@Inject(DI.InstanceChart)
		private instanceChart: InstanceChart,

		@Inject(DI.PerUserNotesChart)
		private perUserNotesChart: PerUserNotesChart,

		@Inject(DI.PerUserPvChart)
		private perUserPvChart: PerUserPvChart,

		@Inject(DI.DriveChart)
		private driveChart: DriveChart,

		@Inject(DI.PerUserReactionsChart)
		private perUserReactionsChart: PerUserReactionsChart,

		@Inject(DI.PerUserFollowingChart)
		private perUserFollowingChart: PerUserFollowingChart,

		@Inject(DI.PerUserDriveChart)
		private perUserDriveChart: PerUserDriveChart,

		@Inject(DI.ApRequestChart)
		private apRequestChart: ApRequestChart,
	) {
		this.charts = [
			this.federationChart,
			this.notesChart,
			this.usersChart,
			this.activeUsersChart,
			this.instanceChart,
			this.perUserNotesChart,
			this.perUserPvChart,
			this.driveChart,
			this.perUserReactionsChart,
			this.perUserFollowingChart,
			this.perUserDriveChart,
			this.apRequestChart,
		];
	}

	@bindThis
	public async start() {
		// 20分おきにメモリ情報をDBに書き込み
		this.saveIntervalId = setInterval(() => {
			for (const chart of this.charts) {
				chart.save();
			}
		}, 1000 * 60 * 20);
	}

	async disposeAsync(): Promise<void> {
		clearInterval(this.saveIntervalId);
		await Promise.all(
			this.charts.map(chart => chart.save()),
		);
	}
}
