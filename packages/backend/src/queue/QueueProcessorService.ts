/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import * as Bull from 'bullmq';
import type { Config } from '@/config.js';
import { DI } from '@/di-symbols.js';
import type Logger from '@/logger.js';
import { bindThis } from '@/decorators.js';
import { WebhookDeliverProcessorService } from './processors/WebhookDeliverProcessorService.js';
import { EndedPollNotificationProcessorService } from './processors/EndedPollNotificationProcessorService.js';
import { DeliverProcessorService } from './processors/DeliverProcessorService.js';
import { InboxProcessorService } from './processors/InboxProcessorService.js';
import { DeleteDriveFilesProcessorService } from './processors/DeleteDriveFilesProcessorService.js';
import { ExportCustomEmojisProcessorService } from './processors/ExportCustomEmojisProcessorService.js';
import { ExportNotesProcessorService } from './processors/ExportNotesProcessorService.js';
import { ExportFollowingProcessorService } from './processors/ExportFollowingProcessorService.js';
import { ExportMutingProcessorService } from './processors/ExportMutingProcessorService.js';
import { ExportBlockingProcessorService } from './processors/ExportBlockingProcessorService.js';
import { ExportUserListsProcessorService } from './processors/ExportUserListsProcessorService.js';
import { ExportAntennasProcessorService } from './processors/ExportAntennasProcessorService.js';
import { ImportFollowingProcessorService } from './processors/ImportFollowingProcessorService.js';
import { ImportMutingProcessorService } from './processors/ImportMutingProcessorService.js';
import { ImportBlockingProcessorService } from './processors/ImportBlockingProcessorService.js';
import { ImportUserListsProcessorService } from './processors/ImportUserListsProcessorService.js';
import { ImportCustomEmojisProcessorService } from './processors/ImportCustomEmojisProcessorService.js';
import { ImportAntennasProcessorService } from './processors/ImportAntennasProcessorService.js';
import { DeleteAccountProcessorService } from './processors/DeleteAccountProcessorService.js';
import { ExportFavoritesProcessorService } from './processors/ExportFavoritesProcessorService.js';
import { CleanRemoteFilesProcessorService } from './processors/CleanRemoteFilesProcessorService.js';
import { DeleteFileProcessorService } from './processors/DeleteFileProcessorService.js';
import { RelationshipProcessorService } from './processors/RelationshipProcessorService.js';
import { TickChartsProcessorService } from './processors/TickChartsProcessorService.js';
import { ResyncChartsProcessorService } from './processors/ResyncChartsProcessorService.js';
import { CleanChartsProcessorService } from './processors/CleanChartsProcessorService.js';
import { CheckExpiredMutingsProcessorService } from './processors/CheckExpiredMutingsProcessorService.js';
import { CleanProcessorService } from './processors/CleanProcessorService.js';
import { AggregateRetentionProcessorService } from './processors/AggregateRetentionProcessorService.js';
import { QueueLoggerService } from './QueueLoggerService.js';
import { QUEUE, baseQueueOptions } from './const.js';

// ref. https://github.com/misskey-dev/misskey/pull/7635#issue-971097019
function httpRelatedBackoff(attemptsMade: number) {
	const baseDelay = 60 * 1000;	// 1min
	const maxBackoff = 8 * 60 * 60 * 1000;	// 8hours
	let backoff = (Math.pow(2, attemptsMade) - 1) * baseDelay;
	backoff = Math.min(backoff, maxBackoff);
	backoff += Math.round(backoff * Math.random() * 0.2);
	return backoff;
}

function getJobInfo(job: Bull.Job | undefined, increment = false): string {
	if (job == null) return '-';

	const age = Date.now() - job.timestamp;

	const formated = age > 60000 ? `${Math.floor(age / 1000 / 60)}m`
		: age > 10000 ? `${Math.floor(age / 1000)}s`
		: `${age}ms`;

	// onActiveとかonCompletedのattemptsMadeがなぜか0始まりなのでインクリメントする
	const currentAttempts = job.attemptsMade + (increment ? 1 : 0);
	const maxAttempts = job.opts ? job.opts.attempts : 0;

	return `id=${job.id} attempts=${currentAttempts}/${maxAttempts} age=${formated}`;
}

@Injectable()
export class QueueProcessorService implements OnApplicationShutdown {
	private logger: Logger;
	private systemQueueWorker: Bull.Worker;
	private dbQueueWorker: Bull.Worker;
	private deliverQueueWorker: Bull.Worker;
	private inboxQueueWorker: Bull.Worker;
	private webhookDeliverQueueWorker: Bull.Worker;
	private relationshipQueueWorker: Bull.Worker;
	private objectStorageQueueWorker: Bull.Worker;
	private endedPollNotificationQueueWorker: Bull.Worker;

	constructor(
		@Inject(DI.config)
		private config: Config,

		private queueLoggerService: QueueLoggerService,
		private webhookDeliverProcessorService: WebhookDeliverProcessorService,
		private endedPollNotificationProcessorService: EndedPollNotificationProcessorService,
		private deliverProcessorService: DeliverProcessorService,
		private inboxProcessorService: InboxProcessorService,
		private deleteDriveFilesProcessorService: DeleteDriveFilesProcessorService,
		private exportCustomEmojisProcessorService: ExportCustomEmojisProcessorService,
		private exportNotesProcessorService: ExportNotesProcessorService,
		private exportFavoritesProcessorService: ExportFavoritesProcessorService,
		private exportFollowingProcessorService: ExportFollowingProcessorService,
		private exportMutingProcessorService: ExportMutingProcessorService,
		private exportBlockingProcessorService: ExportBlockingProcessorService,
		private exportUserListsProcessorService: ExportUserListsProcessorService,
		private exportAntennasProcessorService: ExportAntennasProcessorService,
		private importFollowingProcessorService: ImportFollowingProcessorService,
		private importMutingProcessorService: ImportMutingProcessorService,
		private importBlockingProcessorService: ImportBlockingProcessorService,
		private importUserListsProcessorService: ImportUserListsProcessorService,
		private importCustomEmojisProcessorService: ImportCustomEmojisProcessorService,
		private importAntennasProcessorService: ImportAntennasProcessorService,
		private deleteAccountProcessorService: DeleteAccountProcessorService,
		private deleteFileProcessorService: DeleteFileProcessorService,
		private cleanRemoteFilesProcessorService: CleanRemoteFilesProcessorService,
		private relationshipProcessorService: RelationshipProcessorService,
		private tickChartsProcessorService: TickChartsProcessorService,
		private resyncChartsProcessorService: ResyncChartsProcessorService,
		private cleanChartsProcessorService: CleanChartsProcessorService,
		private aggregateRetentionProcessorService: AggregateRetentionProcessorService,
		private checkExpiredMutingsProcessorService: CheckExpiredMutingsProcessorService,
		private cleanProcessorService: CleanProcessorService,
	) {
		this.logger = this.queueLoggerService.logger;

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

		//#region system
		this.systemQueueWorker = new Bull.Worker(QUEUE.SYSTEM, (job) => {
			switch (job.name) {
				case 'tickCharts': return this.tickChartsProcessorService.process();
				case 'resyncCharts': return this.resyncChartsProcessorService.process();
				case 'cleanCharts': return this.cleanChartsProcessorService.process();
				case 'aggregateRetention': return this.aggregateRetentionProcessorService.process();
				case 'checkExpiredMutings': return this.checkExpiredMutingsProcessorService.process();
				case 'clean': return this.cleanProcessorService.process();
				default: throw new Error(`unrecognized job type ${job.name} for system`);
			}
		}, {
			...baseQueueOptions(this.config, QUEUE.SYSTEM),
			autorun: false,
		});

		const systemLogger = this.logger.createSubLogger('system');

		this.systemQueueWorker
			.on('active', (job) => systemLogger.debug(`active id=${job.id}`))
			.on('completed', (job, result) => systemLogger.debug(`completed(${result}) id=${job.id}`))
			.on('failed', (job, err) => systemLogger.warn(`failed(${err.stack}) id=${job ? job.id : '-'}`, { job, e: renderError(err) }))
			.on('error', (err: Error) => systemLogger.error(`error ${err.stack}`, { e: renderError(err) }))
			.on('stalled', (jobId) => systemLogger.warn(`stalled id=${jobId}`));
		//#endregion

		//#region db
		this.dbQueueWorker = new Bull.Worker(QUEUE.DB, (job) => {
			switch (job.name) {
				case 'deleteDriveFiles': return this.deleteDriveFilesProcessorService.process(job);
				case 'exportCustomEmojis': return this.exportCustomEmojisProcessorService.process(job);
				case 'exportNotes': return this.exportNotesProcessorService.process(job);
				case 'exportFavorites': return this.exportFavoritesProcessorService.process(job);
				case 'exportFollowing': return this.exportFollowingProcessorService.process(job);
				case 'exportMuting': return this.exportMutingProcessorService.process(job);
				case 'exportBlocking': return this.exportBlockingProcessorService.process(job);
				case 'exportUserLists': return this.exportUserListsProcessorService.process(job);
				case 'exportAntennas': return this.exportAntennasProcessorService.process(job);
				case 'importFollowing': return this.importFollowingProcessorService.process(job);
				case 'importFollowingToDb': return this.importFollowingProcessorService.processDb(job);
				case 'importMuting': return this.importMutingProcessorService.process(job);
				case 'importBlocking': return this.importBlockingProcessorService.process(job);
				case 'importBlockingToDb': return this.importBlockingProcessorService.processDb(job);
				case 'importUserLists': return this.importUserListsProcessorService.process(job);
				case 'importCustomEmojis': return this.importCustomEmojisProcessorService.process(job);
				case 'importAntennas': return this.importAntennasProcessorService.process(job);
				case 'deleteAccount': return this.deleteAccountProcessorService.process(job);
				default: throw new Error(`unrecognized job type ${job.name} for db`);
			}
		}, {
			...baseQueueOptions(this.config, QUEUE.DB),
			autorun: false,
		});

		const dbLogger = this.logger.createSubLogger('db');

		this.dbQueueWorker
			.on('active', (job) => dbLogger.debug(`active id=${job.id}`))
			.on('completed', (job, result) => dbLogger.debug(`completed(${result}) id=${job.id}`))
			.on('failed', (job, err) => dbLogger.warn(`failed(${err.stack}) id=${job ? job.id : '-'}`, { job, e: renderError(err) }))
			.on('error', (err: Error) => dbLogger.error(`error ${err.stack}`, { e: renderError(err) }))
			.on('stalled', (jobId) => dbLogger.warn(`stalled id=${jobId}`));
		//#endregion

		//#region deliver
		this.deliverQueueWorker = new Bull.Worker(QUEUE.DELIVER, (job) => this.deliverProcessorService.process(job), {
			...baseQueueOptions(this.config, QUEUE.DELIVER),
			autorun: false,
			concurrency: this.config.deliverJobConcurrency ?? 128,
			limiter: {
				max: this.config.deliverJobPerSec ?? 128,
				duration: 1000,
			},
			settings: {
				backoffStrategy: httpRelatedBackoff,
			},
		});

		const deliverLogger = this.logger.createSubLogger('deliver');

		this.deliverQueueWorker
			.on('active', (job) => deliverLogger.debug(`active ${getJobInfo(job, true)} to=${job.data.to}`))
			.on('completed', (job, result) => deliverLogger.debug(`completed(${result}) ${getJobInfo(job, true)} to=${job.data.to}`))
			.on('failed', (job, err) => deliverLogger.warn(`failed(${err.stack}) ${getJobInfo(job)} to=${job ? job.data.to : '-'}`))
			.on('error', (err: Error) => deliverLogger.error(`error ${err.stack}`, { e: renderError(err) }))
			.on('stalled', (jobId) => deliverLogger.warn(`stalled id=${jobId}`));
		//#endregion

		//#region inbox
		this.inboxQueueWorker = new Bull.Worker(QUEUE.INBOX, (job) => this.inboxProcessorService.process(job), {
			...baseQueueOptions(this.config, QUEUE.INBOX),
			autorun: false,
			concurrency: this.config.inboxJobConcurrency ?? 16,
			limiter: {
				max: this.config.inboxJobPerSec ?? 32,
				duration: 1000,
			},
			settings: {
				backoffStrategy: httpRelatedBackoff,
			},
		});

		const inboxLogger = this.logger.createSubLogger('inbox');

		this.inboxQueueWorker
			.on('active', (job) => inboxLogger.debug(`active ${getJobInfo(job, true)}`))
			.on('completed', (job, result) => inboxLogger.debug(`completed(${result}) ${getJobInfo(job, true)}`))
			.on('failed', (job, err) => inboxLogger.warn(`failed(${err.stack}) ${getJobInfo(job)} activity=${job ? (job.data.activity ? job.data.activity.id : 'none') : '-'}`, { job, e: renderError(err) }))
			.on('error', (err: Error) => inboxLogger.error(`error ${err.stack}`, { e: renderError(err) }))
			.on('stalled', (jobId) => inboxLogger.warn(`stalled id=${jobId}`));
		//#endregion

		//#region webhook deliver
		this.webhookDeliverQueueWorker = new Bull.Worker(QUEUE.WEBHOOK_DELIVER, (job) => this.webhookDeliverProcessorService.process(job), {
			...baseQueueOptions(this.config, QUEUE.WEBHOOK_DELIVER),
			autorun: false,
			concurrency: 64,
			limiter: {
				max: 64,
				duration: 1000,
			},
			settings: {
				backoffStrategy: httpRelatedBackoff,
			},
		});

		const webhookLogger = this.logger.createSubLogger('webhook');

		this.webhookDeliverQueueWorker
			.on('active', (job) => webhookLogger.debug(`active ${getJobInfo(job, true)} to=${job.data.to}`))
			.on('completed', (job, result) => webhookLogger.debug(`completed(${result}) ${getJobInfo(job, true)} to=${job.data.to}`))
			.on('failed', (job, err) => webhookLogger.warn(`failed(${err.stack}) ${getJobInfo(job)} to=${job ? job.data.to : '-'}`))
			.on('error', (err: Error) => webhookLogger.error(`error ${err.stack}`, { e: renderError(err) }))
			.on('stalled', (jobId) => webhookLogger.warn(`stalled id=${jobId}`));
		//#endregion

		//#region relationship
		this.relationshipQueueWorker = new Bull.Worker(QUEUE.RELATIONSHIP, (job) => {
			switch (job.name) {
				case 'follow': return this.relationshipProcessorService.processFollow(job);
				case 'unfollow': return this.relationshipProcessorService.processUnfollow(job);
				case 'block': return this.relationshipProcessorService.processBlock(job);
				case 'unblock': return this.relationshipProcessorService.processUnblock(job);
				default: throw new Error(`unrecognized job type ${job.name} for relationship`);
			}
		}, {
			...baseQueueOptions(this.config, QUEUE.RELATIONSHIP),
			autorun: false,
			concurrency: this.config.relashionshipJobConcurrency ?? 16,
			limiter: {
				max: this.config.relashionshipJobPerSec ?? 64,
				duration: 1000,
			},
		});

		const relationshipLogger = this.logger.createSubLogger('relationship');

		this.relationshipQueueWorker
			.on('active', (job) => relationshipLogger.debug(`active id=${job.id}`))
			.on('completed', (job, result) => relationshipLogger.debug(`completed(${result}) id=${job.id}`))
			.on('failed', (job, err) => relationshipLogger.warn(`failed(${err.stack}) id=${job ? job.id : '-'}`, { job, e: renderError(err) }))
			.on('error', (err: Error) => relationshipLogger.error(`error ${err.stack}`, { e: renderError(err) }))
			.on('stalled', (jobId) => relationshipLogger.warn(`stalled id=${jobId}`));
		//#endregion

		//#region object storage
		this.objectStorageQueueWorker = new Bull.Worker(QUEUE.OBJECT_STORAGE, (job) => {
			switch (job.name) {
				case 'deleteFile': return this.deleteFileProcessorService.process(job);
				case 'cleanRemoteFiles': return this.cleanRemoteFilesProcessorService.process(job);
				default: throw new Error(`unrecognized job type ${job.name} for objectStorage`);
			}
		}, {
			...baseQueueOptions(this.config, QUEUE.OBJECT_STORAGE),
			autorun: false,
			concurrency: 16,
		});

		const objectStorageLogger = this.logger.createSubLogger('objectStorage');

		this.objectStorageQueueWorker
			.on('active', (job) => objectStorageLogger.debug(`active id=${job.id}`))
			.on('completed', (job, result) => objectStorageLogger.debug(`completed(${result}) id=${job.id}`))
			.on('failed', (job, err) => objectStorageLogger.warn(`failed(${err.stack}) id=${job ? job.id : '-'}`, { job, e: renderError(err) }))
			.on('error', (err: Error) => objectStorageLogger.error(`error ${err.stack}`, { e: renderError(err) }))
			.on('stalled', (jobId) => objectStorageLogger.warn(`stalled id=${jobId}`));
		//#endregion

		//#region ended poll notification
		this.endedPollNotificationQueueWorker = new Bull.Worker(QUEUE.ENDED_POLL_NOTIFICATION, (job) => this.endedPollNotificationProcessorService.process(job), {
			...baseQueueOptions(this.config, QUEUE.ENDED_POLL_NOTIFICATION),
			autorun: false,
		});
		//#endregion
	}

	@bindThis
	public async start(): Promise<void> {
		await Promise.all([
			this.systemQueueWorker.run(),
			this.dbQueueWorker.run(),
			this.deliverQueueWorker.run(),
			this.inboxQueueWorker.run(),
			this.webhookDeliverQueueWorker.run(),
			this.relationshipQueueWorker.run(),
			this.objectStorageQueueWorker.run(),
			this.endedPollNotificationQueueWorker.run(),
		]);
	}

	@bindThis
	public async stop(): Promise<void> {
		await Promise.all([
			this.systemQueueWorker.close(),
			this.dbQueueWorker.close(),
			this.deliverQueueWorker.close(),
			this.inboxQueueWorker.close(),
			this.webhookDeliverQueueWorker.close(),
			this.relationshipQueueWorker.close(),
			this.objectStorageQueueWorker.close(),
			this.endedPollNotificationQueueWorker.close(),
		]);
	}

	@bindThis
	public async onApplicationShutdown(signal?: string | undefined): Promise<void> {
		await this.stop();
	}
}
