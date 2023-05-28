import { Inject, Injectable } from '@nestjs/common';
import Xev from 'xev';
import * as Bull from 'bullmq';
import { QueueService } from '@/core/QueueService.js';
import { bindThis } from '@/decorators.js';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import type { OnApplicationShutdown } from '@nestjs/common';

const ev = new Xev();

const interval = 10000;

@Injectable()
export class QueueStatsService implements OnApplicationShutdown {
	private intervalId: NodeJS.Timer;

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

		const deliverQueueEvents = new Bull.QueueEvents('deliver', {
			connection: {
				port: this.config.redisForJobQueue.port,
				host: this.config.redisForJobQueue.host,
				family: this.config.redisForJobQueue.family == null ? 0 : this.config.redisForJobQueue.family,
				password: this.config.redisForJobQueue.pass,
				db: this.config.redisForJobQueue.db ?? 0,
			},
			prefix: this.config.redisForJobQueue.prefix ? `${this.config.redisForJobQueue.prefix}:queue` : 'queue',
		});
		const inboxQueueEvents = new Bull.QueueEvents('inbox', {
			connection: {
				port: this.config.redisForJobQueue.port,
				host: this.config.redisForJobQueue.host,
				family: this.config.redisForJobQueue.family == null ? 0 : this.config.redisForJobQueue.family,
				password: this.config.redisForJobQueue.pass,
				db: this.config.redisForJobQueue.db ?? 0,
			},
			prefix: this.config.redisForJobQueue.prefix ? `${this.config.redisForJobQueue.prefix}:queue` : 'queue',
		});

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
	public onApplicationShutdown(signal?: string | undefined) {
		clearInterval(this.intervalId);
	}
}
