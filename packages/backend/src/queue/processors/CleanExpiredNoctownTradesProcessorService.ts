/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 期限切れNoctownトレードの自動クリーンアップ
// 1分ごとにスケジュール実行され、expiresAtを過ぎたpending/acceptedステータスのトレードをexpiredに更新
// トレードアイテム(noctown_trade_item)は残存（履歴として保持）

import { Inject, Injectable } from '@nestjs/common';
import { LessThan, In } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { NoctownTradesRepository } from '@/models/_.js';
import type Logger from '@/logger.js';
import { bindThis } from '@/decorators.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type * as Bull from 'bullmq';

@Injectable()
export class CleanExpiredNoctownTradesProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.noctownTradesRepository)
		private noctownTradesRepository: NoctownTradesRepository,

		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('clean-expired-noctown-trades');
	}

	@bindThis
	public async process(job: Bull.Job<Record<string, unknown>>): Promise<{
		expiredCount: number;
	}> {
		this.logger.info('Checking expired Noctown trades...');

		// pending または accepted ステータスで、expiresAtを過ぎたトレードをexpiredに更新
		const now = new Date();
		const result = await this.noctownTradesRepository.update(
			{
				status: In(['pending', 'accepted']),
				expiresAt: LessThan(now),
			},
			{
				status: 'expired',
				completedAt: now,
			},
		);

		const expiredCount = result.affected || 0;

		if (expiredCount > 0) {
			this.logger.succ(`Expired ${expiredCount} Noctown trades`);
		}

		return {
			expiredCount,
		};
	}
}
