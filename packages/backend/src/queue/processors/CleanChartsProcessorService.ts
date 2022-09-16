import { Inject, Injectable } from '@nestjs/common';
import { In, MoreThan } from 'typeorm';
import { DI } from '@/di-symbols.js';
import { Config } from '@/config.js';
import type Logger from '@/logger.js';
import FederationChart from '@/services/chart/charts/federation.js';
import NotesChart from '@/services/chart/charts/notes.js';
import UsersChart from '@/services/chart/charts/users.js';
import ActiveUsersChart from '@/services/chart/charts/active-users.js';
import InstanceChart from '@/services/chart/charts/instance.js';
import PerUserNotesChart from '@/services/chart/charts/per-user-notes.js';
import DriveChart from '@/services/chart/charts/drive.js';
import PerUserReactionsChart from '@/services/chart/charts/per-user-reactions.js';
import HashtagChart from '@/services/chart/charts/hashtag.js';
import PerUserFollowingChart from '@/services/chart/charts/per-user-following.js';
import PerUserDriveChart from '@/services/chart/charts/per-user-drive.js';
import ApRequestChart from '@/services/chart/charts/ap-request.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type Bull from 'bull';

@Injectable()
export class CleanChartsProcessorService {
	#logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

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

		private queueLoggerService: QueueLoggerService,
	) {
		this.#logger = this.queueLoggerService.logger.createSubLogger('clean-charts');
	}

	public async process(job: Bull.Job<Record<string, unknown>>, done: () => void): Promise<void> {
		this.#logger.info('Clean charts...');

		await Promise.all([
			this.federationChart.clean(),
			this.notesChart.clean(),
			this.usersChart.clean(),
			this.activeUsersChart.clean(),
			this.instanceChart.clean(),
			this.perUserNotesChart.clean(),
			this.driveChart.clean(),
			this.perUserReactionsChart.clean(),
			this.hashtagChart.clean(),
			this.perUserFollowingChart.clean(),
			this.perUserDriveChart.clean(),
			this.apRequestChart.clean(),
		]);

		this.#logger.succ('All charts successfully cleaned.');
		done();
	}
}
