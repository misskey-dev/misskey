/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { MetricsTime, type JobType } from 'bullmq';
import type { IActivity } from '@/core/activitypub/type.js';
import type { MiDriveFile } from '@/models/DriveFile.js';
import type { MiWebhook, WebhookEventTypes } from '@/models/Webhook.js';
import type { MiSystemWebhook, SystemWebhookEventType } from '@/models/SystemWebhook.js';
import type { Config } from '@/config.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import type { Antenna } from '@/server/api/endpoints/i/import-antennas.js';
import { ApRequestCreator } from '@/core/activitypub/ApRequestService.js';
import { type SystemWebhookPayload } from '@/core/SystemWebhookService.js';
import type { Packed } from '@/misc/json-schema.js';
import { type UserWebhookPayload } from './UserWebhookService.js';
import type {
	DbJobData,
	DeliverJobData,
	RelationshipJobData,
	SystemWebhookDeliverJobData,
	ThinUser,
	UserWebhookDeliverJobData,
} from '../queue/types.js';
import type {
	DbQueue,
	DeliverQueue,
	EndedPollNotificationQueue,
	PostScheduledNoteQueue,
	InboxQueue,
	ObjectStorageQueue,
	RelationshipQueue,
	SystemQueue,
	SystemWebhookDeliverQueue,
	UserWebhookDeliverQueue,
} from './QueueModule.js';
import type httpSignature from '@peertube/http-signature';
import type * as Bull from 'bullmq';

export const QUEUE_TYPES = [
	'system',
	'endedPollNotification',
	'postScheduledNote',
	'deliver',
	'inbox',
	'db',
	'relationship',
	'objectStorage',
	'userWebhookDeliver',
	'systemWebhookDeliver',
] as const;

const REPEATABLE_SYSTEM_JOB_DEF = [{
	name: 'tickCharts',
	pattern: '55 * * * *',
}, {
	name: 'resyncCharts',
	pattern: '0 0 * * *',
}, {
	name: 'cleanCharts',
	pattern: '0 0 * * *',
}, {
	name: 'aggregateRetention',
	pattern: '0 0 * * *',
}, {
	name: 'clean',
	pattern: '0 0 * * *',
}, {
	name: 'checkExpiredMutings',
	pattern: '*/5 * * * *',
}, {
	name: 'bakeBufferedReactions',
	pattern: '0 0 * * *',
}, {
	name: 'checkModeratorsActivity',
	// 毎時30分に起動
	pattern: '30 * * * *',
}, {
	name: 'cleanRemoteNotes',
	// 毎日午前4時に起動(最も人の少ない時間帯)
	pattern: '0 4 * * *',
}];

function parseRedisInfo(infoText: string): Record<string, string> {
	const fields = infoText
		.split('\n')
		.filter(line => line.length > 0 && !line.startsWith('#'))
		.map(line => line.trim().split(':'));

	const result: Record<string, string> = {};
	for (const [key, value] of fields) {
		result[key] = value;
	}
	return result;
}

@Injectable()
export class QueueService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject('queue:system') public systemQueue: SystemQueue,
		@Inject('queue:endedPollNotification') public endedPollNotificationQueue: EndedPollNotificationQueue,
		@Inject('queue:postScheduledNote') public postScheduledNoteQueue: PostScheduledNoteQueue,
		@Inject('queue:deliver') public deliverQueue: DeliverQueue,
		@Inject('queue:inbox') public inboxQueue: InboxQueue,
		@Inject('queue:db') public dbQueue: DbQueue,
		@Inject('queue:relationship') public relationshipQueue: RelationshipQueue,
		@Inject('queue:objectStorage') public objectStorageQueue: ObjectStorageQueue,
		@Inject('queue:userWebhookDeliver') public userWebhookDeliverQueue: UserWebhookDeliverQueue,
		@Inject('queue:systemWebhookDeliver') public systemWebhookDeliverQueue: SystemWebhookDeliverQueue,
	) {
		for (const def of REPEATABLE_SYSTEM_JOB_DEF) {
			this.systemQueue.upsertJobScheduler(def.name, {
				pattern: def.pattern,
				immediately: false,
			}, {
				name: def.name,
				opts: {
					// 期限ではなくcountで設定したいが、ジョブごとではなくキュー全体でカウントされるため、高頻度で実行されるジョブによって低頻度で実行されるジョブのログが消えることになる
					removeOnComplete: {
						age: 3600 * 24 * 7, // keep up to 7 days
					},
					removeOnFail: {
						age: 3600 * 24 * 7, // keep up to 7 days
					},
				},
			});
		}

		// 古いバージョンで作成され現在使われなくなったrepeatableジョブをクリーンアップ
		this.systemQueue.getJobSchedulers().then(schedulers => {
			for (const scheduler of schedulers) {
				if (!REPEATABLE_SYSTEM_JOB_DEF.some(def => def.name === scheduler.key)) {
					this.systemQueue.removeJobScheduler(scheduler.key);
				}
			}
		});
	}

	@bindThis
	public deliver(user: ThinUser, content: IActivity | null, to: string | null, isSharedInbox: boolean) {
		if (content == null) return null;
		if (to == null) return null;

		const contentBody = JSON.stringify(content);
		const digest = ApRequestCreator.createDigest(contentBody);

		const data: DeliverJobData = {
			user: {
				id: user.id,
			},
			content: contentBody,
			digest,
			to,
			isSharedInbox,
		};

		const label = to.replace('https://', '').replace('/inbox', '');

		return this.deliverQueue.add(label, data, {
			attempts: this.config.deliverJobMaxAttempts ?? 12,
			backoff: {
				type: 'custom',
			},
			removeOnComplete: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 30,
			},
			removeOnFail: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 100,
			},
		});
	}

	/**
	 * ApDeliverManager-DeliverManager.execute()からinboxesを突っ込んでaddBulkしたい
	 * @param user `{ id: string; }` この関数ではThinUserに変換しないので前もって変換してください
	 * @param content IActivity | null
	 * @param inboxes `Map<string, boolean>` / key: to (inbox url), value: isSharedInbox (whether it is sharedInbox)
	 * @returns void
	 */
	@bindThis
	public async deliverMany(user: ThinUser, content: IActivity | null, inboxes: Map<string, boolean>) {
		if (content == null) return null;
		const contentBody = JSON.stringify(content);
		const digest = ApRequestCreator.createDigest(contentBody);

		const opts = {
			attempts: this.config.deliverJobMaxAttempts ?? 12,
			backoff: {
				type: 'custom',
			},
			removeOnComplete: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 30,
			},
			removeOnFail: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 100,
			},
		};

		await this.deliverQueue.addBulk(Array.from(inboxes.entries(), d => ({
			name: d[0].replace('https://', '').replace('/inbox', ''),
			data: {
				user,
				content: contentBody,
				digest,
				to: d[0],
				isSharedInbox: d[1],
			} as DeliverJobData,
			opts,
		})));

		return;
	}

	@bindThis
	public inbox(activity: IActivity, signature: httpSignature.IParsedSignature) {
		const data = {
			activity: activity,
			signature,
		};

		const label = (activity.id ?? '').replace('https://', '').replace('/activity', '');

		return this.inboxQueue.add(label, data, {
			attempts: this.config.inboxJobMaxAttempts ?? 8,
			backoff: {
				type: 'custom',
			},
			removeOnComplete: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 30,
			},
			removeOnFail: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 100,
			},
		});
	}

	@bindThis
	public createDeleteDriveFilesJob(user: ThinUser) {
		return this.dbQueue.add('deleteDriveFiles', {
			user: { id: user.id },
		}, {
			removeOnComplete: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 30,
			},
			removeOnFail: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 100,
			},
		});
	}

	@bindThis
	public createExportCustomEmojisJob(user: ThinUser) {
		return this.dbQueue.add('exportCustomEmojis', {
			user: { id: user.id },
		}, {
			removeOnComplete: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 30,
			},
			removeOnFail: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 100,
			},
		});
	}

	@bindThis
	public createExportNotesJob(user: ThinUser) {
		return this.dbQueue.add('exportNotes', {
			user: { id: user.id },
		}, {
			removeOnComplete: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 30,
			},
			removeOnFail: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 100,
			},
		});
	}

	@bindThis
	public createExportClipsJob(user: ThinUser) {
		return this.dbQueue.add('exportClips', {
			user: { id: user.id },
		}, {
			removeOnComplete: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 30,
			},
			removeOnFail: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 100,
			},
		});
	}

	@bindThis
	public createExportFavoritesJob(user: ThinUser) {
		return this.dbQueue.add('exportFavorites', {
			user: { id: user.id },
		}, {
			removeOnComplete: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 30,
			},
			removeOnFail: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 100,
			},
		});
	}

	@bindThis
	public createExportFollowingJob(user: ThinUser, excludeMuting = false, excludeInactive = false) {
		return this.dbQueue.add('exportFollowing', {
			user: { id: user.id },
			excludeMuting,
			excludeInactive,
		}, {
			removeOnComplete: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 30,
			},
			removeOnFail: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 100,
			},
		});
	}

	@bindThis
	public createExportMuteJob(user: ThinUser) {
		return this.dbQueue.add('exportMuting', {
			user: { id: user.id },
		}, {
			removeOnComplete: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 30,
			},
			removeOnFail: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 100,
			},
		});
	}

	@bindThis
	public createExportBlockingJob(user: ThinUser) {
		return this.dbQueue.add('exportBlocking', {
			user: { id: user.id },
		}, {
			removeOnComplete: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 30,
			},
			removeOnFail: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 100,
			},
		});
	}

	@bindThis
	public createExportUserListsJob(user: ThinUser) {
		return this.dbQueue.add('exportUserLists', {
			user: { id: user.id },
		}, {
			removeOnComplete: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 30,
			},
			removeOnFail: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 100,
			},
		});
	}

	@bindThis
	public createExportAntennasJob(user: ThinUser) {
		return this.dbQueue.add('exportAntennas', {
			user: { id: user.id },
		}, {
			removeOnComplete: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 30,
			},
			removeOnFail: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 100,
			},
		});
	}

	@bindThis
	public createImportFollowingJob(user: ThinUser, fileId: MiDriveFile['id'], withReplies?: boolean) {
		return this.dbQueue.add('importFollowing', {
			user: { id: user.id },
			fileId: fileId,
			withReplies,
		}, {
			removeOnComplete: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 30,
			},
			removeOnFail: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 100,
			},
		});
	}

	@bindThis
	public createImportFollowingToDbJob(user: ThinUser, targets: string[], withReplies?: boolean) {
		const jobs = targets.map(rel => this.generateToDbJobData('importFollowingToDb', { user, target: rel, withReplies }));
		return this.dbQueue.addBulk(jobs);
	}

	@bindThis
	public createImportMutingJob(user: ThinUser, fileId: MiDriveFile['id']) {
		return this.dbQueue.add('importMuting', {
			user: { id: user.id },
			fileId: fileId,
		}, {
			removeOnComplete: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 30,
			},
			removeOnFail: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 100,
			},
		});
	}

	@bindThis
	public createImportBlockingJob(user: ThinUser, fileId: MiDriveFile['id']) {
		return this.dbQueue.add('importBlocking', {
			user: { id: user.id },
			fileId: fileId,
		}, {
			removeOnComplete: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 30,
			},
			removeOnFail: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 100,
			},
		});
	}

	@bindThis
	public createImportBlockingToDbJob(user: ThinUser, targets: string[]) {
		const jobs = targets.map(rel => this.generateToDbJobData('importBlockingToDb', { user, target: rel }));
		return this.dbQueue.addBulk(jobs);
	}

	@bindThis
	private generateToDbJobData<T extends 'importFollowingToDb' | 'importBlockingToDb', D extends DbJobData<T>>(name: T, data: D): {
		name: string,
		data: D,
		opts: Bull.JobsOptions,
	} {
		return {
			name,
			data,
			opts: {
				removeOnComplete: {
					age: 3600 * 24 * 7, // keep up to 7 days
					count: 30,
				},
				removeOnFail: {
					age: 3600 * 24 * 7, // keep up to 7 days
					count: 100,
				},
			},
		};
	}

	@bindThis
	public createImportUserListsJob(user: ThinUser, fileId: MiDriveFile['id']) {
		return this.dbQueue.add('importUserLists', {
			user: { id: user.id },
			fileId: fileId,
		}, {
			removeOnComplete: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 30,
			},
			removeOnFail: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 100,
			},
		});
	}

	@bindThis
	public createImportCustomEmojisJob(user: ThinUser, fileId: MiDriveFile['id']) {
		return this.dbQueue.add('importCustomEmojis', {
			user: { id: user.id },
			fileId: fileId,
		}, {
			removeOnComplete: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 30,
			},
			removeOnFail: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 100,
			},
		});
	}

	@bindThis
	public createImportAntennasJob(user: ThinUser, antenna: Antenna) {
		return this.dbQueue.add('importAntennas', {
			user: { id: user.id },
			antenna,
		}, {
			removeOnComplete: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 30,
			},
			removeOnFail: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 100,
			},
		});
	}

	@bindThis
	public createDeleteAccountJob(user: ThinUser, opts: { soft?: boolean; } = {}) {
		return this.dbQueue.add('deleteAccount', {
			user: { id: user.id },
			soft: opts.soft,
		}, {
			removeOnComplete: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 30,
			},
			removeOnFail: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 100,
			},
		});
	}

	@bindThis
	public createFollowJob(followings: { from: ThinUser, to: ThinUser, requestId?: string, silent?: boolean, withReplies?: boolean }[]) {
		const jobs = followings.map(rel => this.generateRelationshipJobData('follow', rel));
		return this.relationshipQueue.addBulk(jobs);
	}

	@bindThis
	public createUnfollowJob(followings: { from: ThinUser, to: ThinUser, requestId?: string }[]) {
		const jobs = followings.map(rel => this.generateRelationshipJobData('unfollow', rel));
		return this.relationshipQueue.addBulk(jobs);
	}

	@bindThis
	public createDelayedUnfollowJob(followings: { from: ThinUser, to: ThinUser, requestId?: string }[], delay: number) {
		const jobs = followings.map(rel => this.generateRelationshipJobData('unfollow', rel, { delay }));
		return this.relationshipQueue.addBulk(jobs);
	}

	@bindThis
	public createBlockJob(blockings: { from: ThinUser, to: ThinUser, silent?: boolean }[]) {
		const jobs = blockings.map(rel => this.generateRelationshipJobData('block', rel));
		return this.relationshipQueue.addBulk(jobs);
	}

	@bindThis
	public createUnblockJob(blockings: { from: ThinUser, to: ThinUser, silent?: boolean }[]) {
		const jobs = blockings.map(rel => this.generateRelationshipJobData('unblock', rel));
		return this.relationshipQueue.addBulk(jobs);
	}

	@bindThis
	private generateRelationshipJobData(name: 'follow' | 'unfollow' | 'block' | 'unblock', data: RelationshipJobData, opts: Bull.JobsOptions = {}): {
		name: string,
		data: RelationshipJobData,
		opts: Bull.JobsOptions,
	} {
		return {
			name,
			data: {
				from: { id: data.from.id },
				to: { id: data.to.id },
				silent: data.silent,
				requestId: data.requestId,
				withReplies: data.withReplies,
			},
			opts: {
				removeOnComplete: {
					age: 3600 * 24 * 7, // keep up to 7 days
					count: 30,
				},
				removeOnFail: {
					age: 3600 * 24 * 7, // keep up to 7 days
					count: 100,
				},
				...opts,
			},
		};
	}

	@bindThis
	public createDeleteObjectStorageFileJob(key: string) {
		return this.objectStorageQueue.add('deleteFile', {
			key: key,
		}, {
			removeOnComplete: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 30,
			},
			removeOnFail: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 100,
			},
		});
	}

	@bindThis
	public createCleanRemoteFilesJob() {
		return this.objectStorageQueue.add('cleanRemoteFiles', {}, {
			removeOnComplete: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 30,
			},
			removeOnFail: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 100,
			},
		});
	}

	/**
	 * @see UserWebhookDeliverJobData
	 * @see UserWebhookDeliverProcessorService
	 */
	@bindThis
	public userWebhookDeliver<T extends WebhookEventTypes>(
		webhook: MiWebhook,
		type: T,
		content: UserWebhookPayload<T>,
		opts?: { attempts?: number },
	) {
		const data: UserWebhookDeliverJobData = {
			type,
			content,
			webhookId: webhook.id,
			userId: webhook.userId,
			to: webhook.url,
			secret: webhook.secret,
			createdAt: Date.now(),
			eventId: randomUUID(),
		};

		return this.userWebhookDeliverQueue.add(webhook.id, data, {
			attempts: opts?.attempts ?? 4,
			backoff: {
				type: 'custom',
			},
			removeOnComplete: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 30,
			},
			removeOnFail: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 100,
			},
		});
	}

	/**
	 * @see SystemWebhookDeliverJobData
	 * @see SystemWebhookDeliverProcessorService
	 */
	@bindThis
	public systemWebhookDeliver<T extends SystemWebhookEventType>(
		webhook: MiSystemWebhook,
		type: T,
		content: SystemWebhookPayload<T>,
		opts?: { attempts?: number },
	) {
		const data: SystemWebhookDeliverJobData = {
			type,
			content,
			webhookId: webhook.id,
			to: webhook.url,
			secret: webhook.secret,
			createdAt: Date.now(),
			eventId: randomUUID(),
		};

		return this.systemWebhookDeliverQueue.add(webhook.id, data, {
			attempts: opts?.attempts ?? 4,
			backoff: {
				type: 'custom',
			},
			removeOnComplete: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 30,
			},
			removeOnFail: {
				age: 3600 * 24 * 7, // keep up to 7 days
				count: 100,
			},
		});
	}

	@bindThis
	private getQueue(type: typeof QUEUE_TYPES[number]): Bull.Queue {
		switch (type) {
			case 'system': return this.systemQueue;
			case 'endedPollNotification': return this.endedPollNotificationQueue;
			case 'postScheduledNote': return this.postScheduledNoteQueue;
			case 'deliver': return this.deliverQueue;
			case 'inbox': return this.inboxQueue;
			case 'db': return this.dbQueue;
			case 'relationship': return this.relationshipQueue;
			case 'objectStorage': return this.objectStorageQueue;
			case 'userWebhookDeliver': return this.userWebhookDeliverQueue;
			case 'systemWebhookDeliver': return this.systemWebhookDeliverQueue;
			default: throw new Error(`Unrecognized queue type: ${type}`);
		}
	}

	@bindThis
	public async queueClear(queueType: typeof QUEUE_TYPES[number], state: '*' | 'completed' | 'wait' | 'active' | 'paused' | 'prioritized' | 'delayed' | 'failed') {
		const queue = this.getQueue(queueType);

		if (state === '*') {
			await Promise.all([
				queue.clean(0, 0, 'completed'),
				queue.clean(0, 0, 'wait'),
				queue.clean(0, 0, 'active'),
				queue.clean(0, 0, 'paused'),
				queue.clean(0, 0, 'prioritized'),
				queue.clean(0, 0, 'delayed'),
				queue.clean(0, 0, 'failed'),
			]);
		} else {
			await queue.clean(0, 0, state);
		}
	}

	@bindThis
	public async queuePromoteJobs(queueType: typeof QUEUE_TYPES[number]) {
		const queue = this.getQueue(queueType);
		await queue.promoteJobs();
	}

	@bindThis
	public async queueRetryJob(queueType: typeof QUEUE_TYPES[number], jobId: string) {
		const queue = this.getQueue(queueType);
		const job = await queue.getJob(jobId);
		if (job != null) {
			if (job.finishedOn != null) {
				await job.retry();
			} else {
				await job.promote();
			}
		}
	}

	@bindThis
	public async queueRemoveJob(queueType: typeof QUEUE_TYPES[number], jobId: string) {
		const queue = this.getQueue(queueType);
		const job = await queue.getJob(jobId);
		if (job != null) {
			await job.remove();
		}
	}

	@bindThis
	private packJobData(job: Bull.Job): Packed<'QueueJob'> {
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		const stacktrace = job.stacktrace ? job.stacktrace.filter(Boolean) : [];
		stacktrace.reverse();

		return {
			id: job.id!,
			name: job.name,
			data: job.data,
			opts: job.opts,
			timestamp: job.timestamp,
			processedOn: job.processedOn,
			processedBy: job.processedBy,
			finishedOn: job.finishedOn,
			progress: job.progress,
			attempts: job.attemptsMade,
			delay: job.delay,
			failedReason: job.failedReason,
			stacktrace: stacktrace,
			returnValue: job.returnvalue,
			isFailed: !!job.failedReason || (Array.isArray(stacktrace) && stacktrace.length > 0),
		};
	}

	@bindThis
	public async queueGetJob(queueType: typeof QUEUE_TYPES[number], jobId: string) {
		const queue = this.getQueue(queueType);
		const job = await queue.getJob(jobId);
		if (job != null) {
			return this.packJobData(job);
		} else {
			throw new Error(`Job not found: ${jobId}`);
		}
	}

	@bindThis
	public async queueGetJobLogs(queueType: typeof QUEUE_TYPES[number], jobId: string) {
		const queue = this.getQueue(queueType);
		const result = await queue.getJobLogs(jobId);
		return result.logs;
	}

	@bindThis
	public async queueGetJobs(queueType: typeof QUEUE_TYPES[number], jobTypes: JobType[], search?: string) {
		const RETURN_LIMIT = 100;
		const queue = this.getQueue(queueType);
		let jobs: Bull.Job[];

		if (search) {
			jobs = await queue.getJobs(jobTypes, 0, 1000);

			jobs = jobs.filter(job => {
				const jobString = JSON.stringify(job).toLowerCase();
				return search.toLowerCase().split(' ').every(term => {
					return jobString.includes(term);
				});
			});

			jobs = jobs.slice(0, RETURN_LIMIT);
		} else {
			jobs = await queue.getJobs(jobTypes, 0, RETURN_LIMIT);
		}

		return jobs.map(job => this.packJobData(job));
	}

	@bindThis
	public async queueGetQueues() {
		const fetchings = QUEUE_TYPES.map(async type => {
			const queue = this.getQueue(type);

			const counts = await queue.getJobCounts();
			const isPaused = await queue.isPaused();
			const metrics_completed = await queue.getMetrics('completed', 0, MetricsTime.ONE_WEEK);
			const metrics_failed = await queue.getMetrics('failed', 0, MetricsTime.ONE_WEEK);

			return {
				name: type,
				counts: counts,
				isPaused,
				metrics: {
					completed: metrics_completed,
					failed: metrics_failed,
				},
			};
		});

		return await Promise.all(fetchings);
	}

	@bindThis
	public async queueGetQueue(queueType: typeof QUEUE_TYPES[number]) {
		const queue = this.getQueue(queueType);
		const counts = await queue.getJobCounts();
		const isPaused = await queue.isPaused();
		const metrics_completed = await queue.getMetrics('completed', 0, MetricsTime.ONE_WEEK);
		const metrics_failed = await queue.getMetrics('failed', 0, MetricsTime.ONE_WEEK);
		const db = parseRedisInfo(await (await queue.client).info());

		return {
			name: queueType,
			qualifiedName: queue.qualifiedName,
			counts: counts,
			isPaused,
			metrics: {
				completed: metrics_completed,
				failed: metrics_failed,
			},
			db: {
				version: db.redis_version,
				mode: db.redis_mode as 'cluster' | 'standalone' | 'sentinel',
				runId: db.run_id,
				processId: db.process_id,
				port: parseInt(db.tcp_port),
				os: db.os,
				uptime: parseInt(db.uptime_in_seconds),
				memory: {
					total: parseInt(db.total_system_memory) || parseInt(db.maxmemory),
					used: parseInt(db.used_memory),
					fragmentationRatio: parseInt(db.mem_fragmentation_ratio),
					peak: parseInt(db.used_memory_peak),
				},
				clients: {
					connected: parseInt(db.connected_clients),
					blocked: parseInt(db.blocked_clients),
				},
			},
		};
	}
}
