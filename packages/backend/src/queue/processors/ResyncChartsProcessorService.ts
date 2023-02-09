import { Inject, Injectable } from '@/di-decorators.js';
import { In, MoreThan } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import type Logger from '@/logger.js';
import FederationChart from '@/core/chart/charts/federation.js';
import NotesChart from '@/core/chart/charts/notes.js';
import UsersChart from '@/core/chart/charts/users.js';
import ActiveUsersChart from '@/core/chart/charts/active-users.js';
import InstanceChart from '@/core/chart/charts/instance.js';
import PerUserNotesChart from '@/core/chart/charts/per-user-notes.js';
import DriveChart from '@/core/chart/charts/drive.js';
import PerUserReactionsChart from '@/core/chart/charts/per-user-reactions.js';
import PerUserFollowingChart from '@/core/chart/charts/per-user-following.js';
import PerUserDriveChart from '@/core/chart/charts/per-user-drive.js';
import ApRequestChart from '@/core/chart/charts/ap-request.js';
import { bindThis } from '@/decorators.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type Bull from 'bull';

@Injectable()
export class ResyncChartsProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

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

		@Inject(DI.QueueLoggerService)
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('resync-charts');
	}

	@bindThis
	public async process(job: Bull.Job<Record<string, unknown>>, done: () => void): Promise<void> {
		this.logger.info('Resync charts...');

		// TODO: ユーザーごとのチャートも更新する
		// TODO: インスタンスごとのチャートも更新する
		await Promise.all([
			this.driveChart.resync(),
			this.notesChart.resync(),
			this.usersChart.resync(),
		]);

		this.logger.succ('All charts successfully resynced.');
		done();
	}
}
