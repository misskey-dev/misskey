/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { LessThan } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { ChatMessagesRepository } from '@/models/_.js';
import type Logger from '@/logger.js';
import { bindThis } from '@/decorators.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type * as Bull from 'bullmq';

@Injectable()
export class CleanExpiredChatMessagesProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.chatMessagesRepository)
		private chatMessagesRepository: ChatMessagesRepository,

		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('clean-expired-chat-messages');
	}

	@bindThis
	public async process(job: Bull.Job<Record<string, unknown>>): Promise<{
		deletedCount: number;
	}> {
		this.logger.info('Cleaning expired chat messages...');

		const now = new Date();
		const result = await this.chatMessagesRepository.delete({
			expiresAt: LessThan(now),
		});

		const deletedCount = result.affected || 0;

		this.logger.succ(`Cleaned ${deletedCount} expired chat messages`);

		return {
			deletedCount,
		};
	}
}
