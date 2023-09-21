import { Injectable } from '@nestjs/common';
import Xev from 'xev';
import { QueueService } from '@/core/QueueService.js';
import { bindThis } from '@/decorators.js';
import type { OnApplicationShutdown } from '@nestjs/common';

const ev = new Xev();

const interval = 10000;

@Injectable()
export class QueueStatsService implements OnApplicationShutdown {
	private intervalId: NodeJS.Timer;

	constructor(
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

		this.queueService.deliverQueue.on('global:active', () => {
			activeDeliverJobs++;
		});

		this.queueService.inboxQueue.on('global:active', () => {
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
	public onApplicationShutdown(signal?: string | undefined) {
		clearInterval(this.intervalId);
	}
}
