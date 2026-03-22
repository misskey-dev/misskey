/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// FR-029: Noctownチャットログの24時間自動削除
// 1時間ごとにスケジュール実行され、24時間以上前のチャットログを削除
// noctown_chat_log_recipient は CASCADE 削除される

import { Inject, Injectable } from '@nestjs/common';
import { LessThan } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { NoctownChatLogsRepository } from '@/models/_.js';
import type Logger from '@/logger.js';
import { bindThis } from '@/decorators.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type * as Bull from 'bullmq';

@Injectable()
export class CleanNoctownChatLogsProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.noctownChatLogsRepository)
		private noctownChatLogsRepository: NoctownChatLogsRepository,

		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('clean-noctown-chat-logs');
	}

	@bindThis
	public async process(job: Bull.Job<Record<string, unknown>>): Promise<{
		deletedCount: number;
	}> {
		this.logger.info('Cleaning old Noctown chat logs...');

		// 24時間以上前のチャットログを削除
		const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
		const result = await this.noctownChatLogsRepository.delete({
			createdAt: LessThan(twentyFourHoursAgo),
		});

		const deletedCount = result.affected || 0;

		this.logger.succ(`Cleaned ${deletedCount} old Noctown chat logs`);

		return {
			deletedCount,
		};
	}
}
