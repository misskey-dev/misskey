/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
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

const interval = 10000;

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
		const log = [] as any[];

		ev.on('requestQueueStatsLog', x => {
			ev.emit(`queueStatsLog:${x.id}`, log.slice(0, x.length ?? 50));
		});

		let activeDeliverJobs = 0;
		let activeInboxJobs = 0;

		const deliverQueueEvents = new Bull.QueueEvents(QUEUE.DELIVER, baseQueueOptions(this.config, QUEUE.DELIVER));
		const inboxQueueEvents = new Bull.QueueEvents(QUEUE.INBOX, baseQueueOptions(this.config, QUEUE.INBOX));

		deliverQueueEvents.on('active', () => {
			activeDeliverJobs++;
		});

		inboxQueueEvents.on('active', () => {
			activeInboxJobs++;
		});

		const tick = async () => {
			const deliverJobCounts = await this.queueService.deliverQueue.getJobCounts();
			const inboxJobCounts = await this.queueService.inboxQueue.getJobCounts();

			const stats = {
				deliver: {
					activeSincePrevTick: activeDeliverJobs,
					active: deliverJobCounts.active,
					waiting: deliverJobCounts.waiting,
					delayed: deliverJobCounts.delayed,
				},
				inbox: {
					activeSincePrevTick: activeInboxJobs,
					active: inboxJobCounts.active,
					waiting: inboxJobCounts.waiting,
					delayed: inboxJobCounts.delayed,
				},
			};

			ev.emit('queueStats', stats);

			log.unshift(stats);
			if (log.length > 200) log.pop();

			activeDeliverJobs = 0;
			activeInboxJobs = 0;
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
