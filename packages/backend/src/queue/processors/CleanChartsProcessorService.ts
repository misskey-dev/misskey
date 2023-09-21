import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import type Logger from '@/logger.js';
import FederationChart from '@/core/chart/charts/federation.js';
import NotesChart from '@/core/chart/charts/notes.js';
import UsersChart from '@/core/chart/charts/users.js';
import ActiveUsersChart from '@/core/chart/charts/active-users.js';
import InstanceChart from '@/core/chart/charts/instance.js';
import PerUserNotesChart from '@/core/chart/charts/per-user-notes.js';
import PerUserPvChart from '@/core/chart/charts/per-user-pv.js';
import DriveChart from '@/core/chart/charts/drive.js';
import PerUserReactionsChart from '@/core/chart/charts/per-user-reactions.js';
import PerUserFollowingChart from '@/core/chart/charts/per-user-following.js';
import PerUserDriveChart from '@/core/chart/charts/per-user-drive.js';
import ApRequestChart from '@/core/chart/charts/ap-request.js';
import { bindThis } from '@/decorators.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type Bull from 'bull';

@Injectable()
export class CleanChartsProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

		private federationChart: FederationChart,
		private notesChart: NotesChart,
		private usersChart: UsersChart,
		private activeUsersChart: ActiveUsersChart,
		private instanceChart: InstanceChart,
		private perUserNotesChart: PerUserNotesChart,
		private perUserPvChart: PerUserPvChart,
		private driveChart: DriveChart,
		private perUserReactionsChart: PerUserReactionsChart,
		private perUserFollowingChart: PerUserFollowingChart,
		private perUserDriveChart: PerUserDriveChart,
		private apRequestChart: ApRequestChart,

		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('clean-charts');
	}

	@bindThis
	public async process(job: Bull.Job<Record<string, unknown>>, done: () => void): Promise<void> {
		this.logger.info('Clean charts...');

		await Promise.all([
			this.federationChart.clean(),
			this.notesChart.clean(),
			this.usersChart.clean(),
			this.activeUsersChart.clean(),
			this.instanceChart.clean(),
			this.perUserNotesChart.clean(),
			this.perUserPvChart.clean(),
			this.driveChart.clean(),
			this.perUserReactionsChart.clean(),
			this.perUserFollowingChart.clean(),
			this.perUserDriveChart.clean(),
			this.apRequestChart.clean(),
		]);

		this.logger.succ('All charts successfully cleaned.');
		done();
	}
}
