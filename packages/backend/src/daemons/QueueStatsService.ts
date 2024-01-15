/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import Xev from 'xev';
import * as Bull from 'bullmq';
import { QueueService } from '@/core/QueueService.js';
import { bindThis } from '@/decorators.js';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { QUEUE, baseQueueOptions } from '@/queue/const.js';
import type { OnApplicationShutdown } from '@nestjs/common';

const ev = new Xev();

const interval = 30000;

@Injectable()
export class QueueStatsService implements OnApplicationShutdown {
	private intervalId: NodeJS.Timeout;

	constructor(
		@Inject(DI.config)
		private config: Config,

		private queueService: QueueService,
	) {
	}

	/**
	 * Report queue stats regularly
	 */
	@bindThis
	public start(): void {
		ev.on('requestQueueStatsLog', x => {
			ev.emit(`queueStatsLog:${x.id}`, []);
		});

		const tick = async () => {
			const deliverJobCounts = await this.queueService.deliverQueue.getJobCounts();
			const inboxJobCounts = await this.queueService.inboxQueue.getJobCounts();

			const stats = {
				deliver: {
					activeSincePrevTick: 0, // it's removed for performance reason
					active: deliverJobCounts.active,
					waiting: deliverJobCounts.waiting,
					delayed: deliverJobCounts.delayed,
				},
				inbox: {
					activeSincePrevTick: 0, // it's removed for performance reason
					active: inboxJobCounts.active,
					waiting: inboxJobCounts.waiting,
					delayed: inboxJobCounts.delayed,
				},
			};

			ev.emit('queueStats', stats);
		};

		tick();

		this.intervalId = setInterval(tick, interval);
	}

	@bindThis
	public dispose(): void {
		clearInterval(this.intervalId);
	}

	@bindThis
	public onApplicationShutdown(signal?: string | undefined): void {
		this.dispose();
	}
}
