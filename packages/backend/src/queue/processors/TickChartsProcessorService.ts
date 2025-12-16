/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import ActiveUsersChart from '@/core/chart/charts/active-users.js';
import ApRequestChart from '@/core/chart/charts/ap-request.js';
import DriveChart from '@/core/chart/charts/drive.js';
import FederationChart from '@/core/chart/charts/federation.js';
import InstanceChart from '@/core/chart/charts/instance.js';
import NotesChart from '@/core/chart/charts/notes.js';
import PerUserDriveChart from '@/core/chart/charts/per-user-drive.js';
import PerUserFollowingChart from '@/core/chart/charts/per-user-following.js';
import PerUserNotesChart from '@/core/chart/charts/per-user-notes.js';
import PerUserPvChart from '@/core/chart/charts/per-user-pv.js';
import PerUserReactionsChart from '@/core/chart/charts/per-user-reactions.js';
import UsersChart from '@/core/chart/charts/users.js';
import { bindThis } from '@/decorators.js';
import type Logger from '@/logger.js';
import { QueueLoggerService } from '../QueueLoggerService.js';

@Injectable()
export class TickChartsProcessorService {
	private logger: Logger;

	constructor(
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
		this.logger = this.queueLoggerService.logger.createSubLogger('tick-charts');
	}

	@bindThis
	public async process(): Promise<void> {
		this.logger.info('Tick charts...');

		// DBへの同時接続を避けるためにPromise.allを使わずひとつずつ実行する
		await this.federationChart.tick(false);
		await this.notesChart.tick(false);
		await this.usersChart.tick(false);
		await this.activeUsersChart.tick(false);
		await this.instanceChart.tick(false);
		await this.perUserNotesChart.tick(false);
		await this.perUserPvChart.tick(false);
		await this.driveChart.tick(false);
		await this.perUserReactionsChart.tick(false);
		await this.perUserFollowingChart.tick(false);
		await this.perUserDriveChart.tick(false);
		await this.apRequestChart.tick(false);

		this.logger.succ('All charts successfully ticked.');
	}
}
