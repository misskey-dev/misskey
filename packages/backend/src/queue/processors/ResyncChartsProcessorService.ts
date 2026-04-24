/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
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

		// DBへの同時接続を避けるためにPromise.allを使わずひとつずつ実行する
		// TODO: ユーザーごとのチャートも更新する
		// TODO: インスタンスごとのチャートも更新する
		await this.driveChart.resync();
		await this.notesChart.resync();
		await this.usersChart.resync();

		this.logger.succ('All charts successfully resynced.');
	}
}
