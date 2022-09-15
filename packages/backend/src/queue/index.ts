
import { DI } from '@/di-symbols.js';
import { getJobInfo } from './get-job-info.js';
import { QueueService } from './queue.service.js';
import { SystemQueueProcessorsService } from './SystemQueueProcessorsService.js';
import { ObjectStorageQueueProcessorsService } from './ObjectStorageQueueProcessorsService.js';
import { DbQueueProcessorsService } from './DbQueueProcessorsService.js';
import { WebhookDeliverProcessorService } from './processors/WebhookDeliverProcessorService.js';
import { EndedPollNotificationProcessorService } from './processors/EndedPollNotificationProcessorService.js';
import { DeliverProcessorService } from './processors/DeliverProcessorService.js';
import { InboxProcessorService } from './processors/InboxProcessorService.js';
import { QueueLoggerService } from './QueueLoggerService.js';
import type { INestApplicationContext } from '@nestjs/common';

export default function(app: INestApplicationContext) {
	const config = app.get(DI.config);
	const queueLoggerService = app.get(QueueLoggerService);
	const queueLogger = queueLoggerService.logger;
	const queueService = app.get(QueueService);
	const systemQueue = queueService.systemQueue;
	const deliverQueue = queueService.deliverQueue;
	const inboxQueue = queueService.inboxQueue;
	const dbQueue = queueService.dbQueue;
	const objectStorageQueue = queueService.objectStorageQueue;
	const webhookDeliverQueue = queueService.webhookDeliverQueue;
	const endedPollNotificationQueue = queueService.endedPollNotificationQueue;
	const systemQueueProcessorsService = app.get(SystemQueueProcessorsService);
	const objectStorageQueueProcessorsService = app.get(ObjectStorageQueueProcessorsService);
	const dbQueueProcessorsService = app.get(DbQueueProcessorsService);
	const webhookDeliverProcessorService = app.get(WebhookDeliverProcessorService);
	const endedPollNotificationProcessorService = app.get(EndedPollNotificationProcessorService);
	const deliverProcessorService = app.get(DeliverProcessorService);
	const inboxProcessorService = app.get(InboxProcessorService);

	function renderError(e: Error): any {
		return {
			stack: e.stack,
			message: e.message,
			name: e.name,
		};
	}

	const systemLogger = queueLogger.createSubLogger('system');
	const deliverLogger = queueLogger.createSubLogger('deliver');
	const webhookLogger = queueLogger.createSubLogger('webhook');
	const inboxLogger = queueLogger.createSubLogger('inbox');
	const dbLogger = queueLogger.createSubLogger('db');
	const objectStorageLogger = queueLogger.createSubLogger('objectStorage');
	
	systemQueue
		.on('waiting', (jobId) => systemLogger.debug(`waiting id=${jobId}`))
		.on('active', (job) => systemLogger.debug(`active id=${job.id}`))
		.on('completed', (job, result) => systemLogger.debug(`completed(${result}) id=${job.id}`))
		.on('failed', (job, err) => systemLogger.warn(`failed(${err}) id=${job.id}`, { job, e: renderError(err) }))
		.on('error', (job: any, err: Error) => systemLogger.error(`error ${err}`, { job, e: renderError(err) }))
		.on('stalled', (job) => systemLogger.warn(`stalled id=${job.id}`));
	
	deliverQueue
		.on('waiting', (jobId) => deliverLogger.debug(`waiting id=${jobId}`))
		.on('active', (job) => deliverLogger.debug(`active ${getJobInfo(job, true)} to=${job.data.to}`))
		.on('completed', (job, result) => deliverLogger.debug(`completed(${result}) ${getJobInfo(job, true)} to=${job.data.to}`))
		.on('failed', (job, err) => deliverLogger.warn(`failed(${err}) ${getJobInfo(job)} to=${job.data.to}`))
		.on('error', (job: any, err: Error) => deliverLogger.error(`error ${err}`, { job, e: renderError(err) }))
		.on('stalled', (job) => deliverLogger.warn(`stalled ${getJobInfo(job)} to=${job.data.to}`));
	
	inboxQueue
		.on('waiting', (jobId) => inboxLogger.debug(`waiting id=${jobId}`))
		.on('active', (job) => inboxLogger.debug(`active ${getJobInfo(job, true)}`))
		.on('completed', (job, result) => inboxLogger.debug(`completed(${result}) ${getJobInfo(job, true)}`))
		.on('failed', (job, err) => inboxLogger.warn(`failed(${err}) ${getJobInfo(job)} activity=${job.data.activity ? job.data.activity.id : 'none'}`, { job, e: renderError(err) }))
		.on('error', (job: any, err: Error) => inboxLogger.error(`error ${err}`, { job, e: renderError(err) }))
		.on('stalled', (job) => inboxLogger.warn(`stalled ${getJobInfo(job)} activity=${job.data.activity ? job.data.activity.id : 'none'}`));
	
	dbQueue
		.on('waiting', (jobId) => dbLogger.debug(`waiting id=${jobId}`))
		.on('active', (job) => dbLogger.debug(`active id=${job.id}`))
		.on('completed', (job, result) => dbLogger.debug(`completed(${result}) id=${job.id}`))
		.on('failed', (job, err) => dbLogger.warn(`failed(${err}) id=${job.id}`, { job, e: renderError(err) }))
		.on('error', (job: any, err: Error) => dbLogger.error(`error ${err}`, { job, e: renderError(err) }))
		.on('stalled', (job) => dbLogger.warn(`stalled id=${job.id}`));
	
	objectStorageQueue
		.on('waiting', (jobId) => objectStorageLogger.debug(`waiting id=${jobId}`))
		.on('active', (job) => objectStorageLogger.debug(`active id=${job.id}`))
		.on('completed', (job, result) => objectStorageLogger.debug(`completed(${result}) id=${job.id}`))
		.on('failed', (job, err) => objectStorageLogger.warn(`failed(${err}) id=${job.id}`, { job, e: renderError(err) }))
		.on('error', (job: any, err: Error) => objectStorageLogger.error(`error ${err}`, { job, e: renderError(err) }))
		.on('stalled', (job) => objectStorageLogger.warn(`stalled id=${job.id}`));
	
	webhookDeliverQueue
		.on('waiting', (jobId) => webhookLogger.debug(`waiting id=${jobId}`))
		.on('active', (job) => webhookLogger.debug(`active ${getJobInfo(job, true)} to=${job.data.to}`))
		.on('completed', (job, result) => webhookLogger.debug(`completed(${result}) ${getJobInfo(job, true)} to=${job.data.to}`))
		.on('failed', (job, err) => webhookLogger.warn(`failed(${err}) ${getJobInfo(job)} to=${job.data.to}`))
		.on('error', (job: any, err: Error) => webhookLogger.error(`error ${err}`, { job, e: renderError(err) }))
		.on('stalled', (job) => webhookLogger.warn(`stalled ${getJobInfo(job)} to=${job.data.to}`));

	deliverQueue.process(config.deliverJobConcurrency || 128, deliverProcessorService.process);
	inboxQueue.process(config.inboxJobConcurrency || 16, inboxProcessorService.process);
	endedPollNotificationQueue.process(endedPollNotificationProcessorService.process);
	webhookDeliverQueue.process(64, webhookDeliverProcessorService.process);
	dbQueueProcessorsService.start(dbQueue);
	objectStorageQueueProcessorsService.start(objectStorageQueue);

	systemQueue.add('tickCharts', {
	}, {
		repeat: { cron: '55 * * * *' },
		removeOnComplete: true,
	});

	systemQueue.add('resyncCharts', {
	}, {
		repeat: { cron: '0 0 * * *' },
		removeOnComplete: true,
	});

	systemQueue.add('cleanCharts', {
	}, {
		repeat: { cron: '0 0 * * *' },
		removeOnComplete: true,
	});

	systemQueue.add('clean', {
	}, {
		repeat: { cron: '0 0 * * *' },
		removeOnComplete: true,
	});

	systemQueue.add('checkExpiredMutings', {
	}, {
		repeat: { cron: '*/5 * * * *' },
		removeOnComplete: true,
	});

	systemQueueProcessorsService.start(systemQueue);
}
