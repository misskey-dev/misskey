import { Inject, Injectable } from '@nestjs/common';
import { In, MoreThan } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import type Logger from '@/logger.js';
import type FederationChart from '@/services/chart/charts/federation.js';
import type NotesChart from '@/services/chart/charts/notes.js';
import type UsersChart from '@/services/chart/charts/users.js';
import type ActiveUsersChart from '@/services/chart/charts/active-users.js';
import type InstanceChart from '@/services/chart/charts/instance.js';
import type PerUserNotesChart from '@/services/chart/charts/per-user-notes.js';
import type DriveChart from '@/services/chart/charts/drive.js';
import type PerUserReactionsChart from '@/services/chart/charts/per-user-reactions.js';
import type HashtagChart from '@/services/chart/charts/hashtag.js';
import type PerUserFollowingChart from '@/services/chart/charts/per-user-following.js';
import type PerUserDriveChart from '@/services/chart/charts/per-user-drive.js';
import type ApRequestChart from '@/services/chart/charts/ap-request.js';
import type { QueueLoggerService } from '../QueueLoggerService.js';
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
		this.queueLoggerService.logger.createSubLogger('clean-charts');
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
