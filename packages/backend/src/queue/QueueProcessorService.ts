import { Inject, Injectable } from '@nestjs/common';
import type { Config } from '@/config.js';
import { DI } from '@/di-symbols.js';
import type Logger from '@/logger.js';
import { QueueService } from '@/core/QueueService.js';
import { bindThis } from '@/decorators.js';
import { getJobInfo } from './get-job-info.js';
import { SystemQueueProcessorsService } from './SystemQueueProcessorsService.js';
import { ObjectStorageQueueProcessorsService } from './ObjectStorageQueueProcessorsService.js';
import { DbQueueProcessorsService } from './DbQueueProcessorsService.js';
import { WebhookDeliverProcessorService } from './processors/WebhookDeliverProcessorService.js';
import { EndedPollNotificationProcessorService } from './processors/EndedPollNotificationProcessorService.js';
import { DeliverProcessorService } from './processors/DeliverProcessorService.js';
import { InboxProcessorService } from './processors/InboxProcessorService.js';
import { QueueLoggerService } from './QueueLoggerService.js';

@Injectable()
export class QueueProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

		private queueLoggerService: QueueLoggerService,
		private queueService: QueueService,
		private systemQueueProcessorsService: SystemQueueProcessorsService,
		private objectStorageQueueProcessorsService: ObjectStorageQueueProcessorsService,
		private dbQueueProcessorsService: DbQueueProcessorsService,
		private webhookDeliverProcessorService: WebhookDeliverProcessorService,
		private endedPollNotificationProcessorService: EndedPollNotificationProcessorService,
		private deliverProcessorService: DeliverProcessorService,
		private inboxProcessorService: InboxProcessorService,
	) {
		this.logger = this.queueLoggerService.logger;
	}

	@bindThis
	public start() {
		function renderError(e: Error): any {
			if (e) { // 何故かeがundefinedで来ることがある
				return {
					stack: e.stack,
					message: e.message,
					name: e.name,
				};
			} else {
				return {
					stack: '?',
					message: '?',
					name: '?',
				};
			}
		}
	
		const systemLogger = this.logger.createSubLogger('system');
		const deliverLogger = this.logger.createSubLogger('deliver');
		const webhookLogger = this.logger.createSubLogger('webhook');
		const inboxLogger = this.logger.createSubLogger('inbox');
		const dbLogger = this.logger.createSubLogger('db');
		const objectStorageLogger = this.logger.createSubLogger('objectStorage');
		
		this.queueService.systemQueue
			.on('waiting', (jobId) => systemLogger.debug(`waiting id=${jobId}`))
			.on('active', (job) => systemLogger.debug(`active id=${job.id}`))
			.on('completed', (job, result) => systemLogger.debug(`completed(${result}) id=${job.id}`))
			.on('failed', (job, err) => systemLogger.warn(`failed(${err}) id=${job.id}`, { job, e: renderError(err) }))
			.on('error', (job: any, err: Error) => systemLogger.error(`error ${err}`, { job, e: renderError(err) }))
			.on('stalled', (job) => systemLogger.warn(`stalled id=${job.id}`));
		
		this.queueService.deliverQueue
			.on('waiting', (jobId) => deliverLogger.debug(`waiting id=${jobId}`))
			.on('active', (job) => deliverLogger.debug(`active ${getJobInfo(job, true)} to=${job.data.to}`))
			.on('completed', (job, result) => deliverLogger.debug(`completed(${result}) ${getJobInfo(job, true)} to=${job.data.to}`))
			.on('failed', (job, err) => deliverLogger.warn(`failed(${err}) ${getJobInfo(job)} to=${job.data.to}`))
			.on('error', (job: any, err: Error) => deliverLogger.error(`error ${err}`, { job, e: renderError(err) }))
			.on('stalled', (job) => deliverLogger.warn(`stalled ${getJobInfo(job)} to=${job.data.to}`));
		
		this.queueService.inboxQueue
			.on('waiting', (jobId) => inboxLogger.debug(`waiting id=${jobId}`))
			.on('active', (job) => inboxLogger.debug(`active ${getJobInfo(job, true)}`))
			.on('completed', (job, result) => inboxLogger.debug(`completed(${result}) ${getJobInfo(job, true)}`))
			.on('failed', (job, err) => inboxLogger.warn(`failed(${err}) ${getJobInfo(job)} activity=${job.data.activity ? job.data.activity.id : 'none'}`, { job, e: renderError(err) }))
			.on('error', (job: any, err: Error) => inboxLogger.error(`error ${err}`, { job, e: renderError(err) }))
			.on('stalled', (job) => inboxLogger.warn(`stalled ${getJobInfo(job)} activity=${job.data.activity ? job.data.activity.id : 'none'}`));
		
		this.queueService.dbQueue
			.on('waiting', (jobId) => dbLogger.debug(`waiting id=${jobId}`))
			.on('active', (job) => dbLogger.debug(`active id=${job.id}`))
			.on('completed', (job, result) => dbLogger.debug(`completed(${result}) id=${job.id}`))
			.on('failed', (job, err) => dbLogger.warn(`failed(${err}) id=${job.id}`, { job, e: renderError(err) }))
			.on('error', (job: any, err: Error) => dbLogger.error(`error ${err}`, { job, e: renderError(err) }))
			.on('stalled', (job) => dbLogger.warn(`stalled id=${job.id}`));
		
		this.queueService.objectStorageQueue
			.on('waiting', (jobId) => objectStorageLogger.debug(`waiting id=${jobId}`))
			.on('active', (job) => objectStorageLogger.debug(`active id=${job.id}`))
			.on('completed', (job, result) => objectStorageLogger.debug(`completed(${result}) id=${job.id}`))
			.on('failed', (job, err) => objectStorageLogger.warn(`failed(${err}) id=${job.id}`, { job, e: renderError(err) }))
			.on('error', (job: any, err: Error) => objectStorageLogger.error(`error ${err}`, { job, e: renderError(err) }))
			.on('stalled', (job) => objectStorageLogger.warn(`stalled id=${job.id}`));
		
		this.queueService.webhookDeliverQueue
			.on('waiting', (jobId) => webhookLogger.debug(`waiting id=${jobId}`))
			.on('active', (job) => webhookLogger.debug(`active ${getJobInfo(job, true)} to=${job.data.to}`))
			.on('completed', (job, result) => webhookLogger.debug(`completed(${result}) ${getJobInfo(job, true)} to=${job.data.to}`))
			.on('failed', (job, err) => webhookLogger.warn(`failed(${err}) ${getJobInfo(job)} to=${job.data.to}`))
			.on('error', (job: any, err: Error) => webhookLogger.error(`error ${err}`, { job, e: renderError(err) }))
			.on('stalled', (job) => webhookLogger.warn(`stalled ${getJobInfo(job)} to=${job.data.to}`));
	
		this.queueService.deliverQueue.process(this.config.deliverJobConcurrency ?? 128, (job) => this.deliverProcessorService.process(job));
		this.queueService.inboxQueue.process(this.config.inboxJobConcurrency ?? 16, (job) => this.inboxProcessorService.process(job));
		this.queueService.endedPollNotificationQueue.process((job, done) => this.endedPollNotificationProcessorService.process(job, done));
		this.queueService.webhookDeliverQueue.process(64, (job) => this.webhookDeliverProcessorService.process(job));
		this.dbQueueProcessorsService.start(this.queueService.dbQueue);
		this.objectStorageQueueProcessorsService.start(this.queueService.objectStorageQueue);
	
		this.queueService.systemQueue.add('tickCharts', {
		}, {
			repeat: { cron: '55 * * * *' },
			removeOnComplete: true,
		});
	
		this.queueService.systemQueue.add('resyncCharts', {
		}, {
			repeat: { cron: '0 0 * * *' },
			removeOnComplete: true,
		});
	
		this.queueService.systemQueue.add('cleanCharts', {
		}, {
			repeat: { cron: '0 0 * * *' },
			removeOnComplete: true,
		});

		this.queueService.systemQueue.add('aggregateRetention', {
		}, {
			repeat: { cron: '0 0 * * *' },
			removeOnComplete: true,
		});
	
		this.queueService.systemQueue.add('clean', {
		}, {
			repeat: { cron: '0 0 * * *' },
			removeOnComplete: true,
		});
	
		this.queueService.systemQueue.add('checkExpiredMutings', {
		}, {
			repeat: { cron: '*/5 * * * *' },
			removeOnComplete: true,
		});
	
		this.systemQueueProcessorsService.start(this.queueService.systemQueue);
	}
}
