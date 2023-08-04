/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import type Logger from '@/logger.js';
import NotesChart from '@/core/chart/charts/notes.js';
import UsersChart from '@/core/chart/charts/users.js';
import DriveChart from '@/core/chart/charts/drive.js';
import { bindThis } from '@/decorators.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type * as Bull from 'bullmq';

@Injectable()
export class ResyncChartsProcessorService {
	private logger: Logger;

	constructor(
		private notesChart: NotesChart,
		private usersChart: UsersChart,
		private driveChart: DriveChart,
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('resync-charts');
	}

	@bindThis
	public async process(): Promise<void> {
		this.logger.info('Resync charts...');

		// TODO: ユーザーごとのチャートも更新する
		// TODO: インスタンスごとのチャートも更新する
		await Promise.all([
			this.driveChart.resync(),
			this.notesChart.resync(),
			this.usersChart.resync(),
		]);

		this.logger.succ('All charts successfully resynced.');
	}
}
