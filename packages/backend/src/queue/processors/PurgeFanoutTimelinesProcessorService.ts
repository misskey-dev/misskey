/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import type Logger from '@/logger.js';
import { bindThis } from '@/decorators.js';
import { FanoutTimelineService } from '@/core/FanoutTimelineService.js';
import { MetaService } from '@/core/MetaService.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type * as Bull from 'bullmq';

@Injectable()
export class PurgeFanoutTimelinesProcessorService {
	private logger: Logger;

	constructor(
		private fanoutTimelineService: FanoutTimelineService,
		private metaService: MetaService,
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('purge-fanout-timelines');
	}

	@bindThis
	public async process(job: Bull.Job<{ targetState: boolean }>): Promise<void> {
		const { targetState } = job.data;
		this.logger.info(`Purging fanout timelines (targetState=${targetState})...`);

		const deleted = await this.fanoutTimelineService.purgeAll();
		await this.metaService.update({ fanoutTimelineActive: targetState });

		this.logger.succ(`Purged ${deleted} fanout timeline keys. fanoutTimelineActive=${targetState}`);
	}
}
