import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import type { IActivity } from '@/core/remote/activitypub/type.js';
import type { DriveFile } from '@/models/entities/DriveFile.js';
import type { Webhook, webhookEventTypes } from '@/models/entities/Webhook.js';
import type { Config } from '@/config.js';
import { DI } from '@/di-symbols.js';
import type { DbQueue, DeliverQueue, EndedPollNotificationQueue, InboxQueue, ObjectStorageQueue, SystemQueue, WebhookDeliverQueue } from './queue/QueueModule.js';
import type { ThinUser } from '../queue/types.js';
import type httpSignature from '@peertube/http-signature';

@Injectable()
export class QueueService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject('queue:system') public systemQueue: SystemQueue,
		@Inject('queue:endedPollNotification') public endedPollNotificationQueue: EndedPollNotificationQueue,
		@Inject('queue:deliver') public deliverQueue: DeliverQueue,
		@Inject('queue:inbox') public inboxQueue: InboxQueue,
		@Inject('queue:db') public dbQueue: DbQueue,
		@Inject('queue:objectStorage') public objectStorageQueue: ObjectStorageQueue,
		@Inject('queue:webhookDeliver') public webhookDeliverQueue: WebhookDeliverQueue,
	) {}

	public deliver(user: ThinUser, content: IActivity | null, to: string | null) {
		if (content == null) return null;
		if (to == null) return null;

		const data = {
			user: {
				id: user.id,
			},
			content,
			to,
		};

		return this.deliverQueue.add(data, {
			attempts: this.config.deliverJobMaxAttempts ?? 12,
			timeout: 1 * 60 * 1000,	// 1min
			backoff: {
				type: 'apBackoff',
			},
			removeOnComplete: true,
			removeOnFail: true,
		});
	}

	public inbox(activity: IActivity, signature: httpSignature.IParsedSignature) {
		const data = {
			activity: activity,
			signature,
		};
	
		return this.inboxQueue.add(data, {
			attempts: this.config.inboxJobMaxAttempts ?? 8,
			timeout: 5 * 60 * 1000,	// 5min
			backoff: {
				type: 'apBackoff',
			},
			removeOnComplete: true,
			removeOnFail: true,
		});
	}

	public createDeleteDriveFilesJob(user: ThinUser) {
		return this.dbQueue.add('deleteDriveFiles', {
			user: user,
		}, {
			removeOnComplete: true,
			removeOnFail: true,
		});
	}

	public createExportCustomEmojisJob(user: ThinUser) {
		return this.dbQueue.add('exportCustomEmojis', {
			user: user,
		}, {
			removeOnComplete: true,
			removeOnFail: true,
		});
	}

	public createExportNotesJob(user: ThinUser) {
		return this.dbQueue.add('exportNotes', {
			user: user,
		}, {
			removeOnComplete: true,
			removeOnFail: true,
		});
	}

	public createExportFollowingJob(user: ThinUser, excludeMuting = false, excludeInactive = false) {
		return this.dbQueue.add('exportFollowing', {
			user: user,
			excludeMuting,
			excludeInactive,
		}, {
			removeOnComplete: true,
			removeOnFail: true,
		});
	}

	public createExportMuteJob(user: ThinUser) {
		return this.dbQueue.add('exportMuting', {
			user: user,
		}, {
			removeOnComplete: true,
			removeOnFail: true,
		});
	}

	public createExportBlockingJob(user: ThinUser) {
		return this.dbQueue.add('exportBlocking', {
			user: user,
		}, {
			removeOnComplete: true,
			removeOnFail: true,
		});
	}

	public createExportUserListsJob(user: ThinUser) {
		return this.dbQueue.add('exportUserLists', {
			user: user,
		}, {
			removeOnComplete: true,
			removeOnFail: true,
		});
	}

	public createImportFollowingJob(user: ThinUser, fileId: DriveFile['id']) {
		return this.dbQueue.add('importFollowing', {
			user: user,
			fileId: fileId,
		}, {
			removeOnComplete: true,
			removeOnFail: true,
		});
	}

	public createImportMutingJob(user: ThinUser, fileId: DriveFile['id']) {
		return this.dbQueue.add('importMuting', {
			user: user,
			fileId: fileId,
		}, {
			removeOnComplete: true,
			removeOnFail: true,
		});
	}

	public createImportBlockingJob(user: ThinUser, fileId: DriveFile['id']) {
		return this.dbQueue.add('importBlocking', {
			user: user,
			fileId: fileId,
		}, {
			removeOnComplete: true,
			removeOnFail: true,
		});
	}

	public createImportUserListsJob(user: ThinUser, fileId: DriveFile['id']) {
		return this.dbQueue.add('importUserLists', {
			user: user,
			fileId: fileId,
		}, {
			removeOnComplete: true,
			removeOnFail: true,
		});
	}

	public createImportCustomEmojisJob(user: ThinUser, fileId: DriveFile['id']) {
		return this.dbQueue.add('importCustomEmojis', {
			user: user,
			fileId: fileId,
		}, {
			removeOnComplete: true,
			removeOnFail: true,
		});
	}

	public createDeleteAccountJob(user: ThinUser, opts: { soft?: boolean; } = {}) {
		return this.dbQueue.add('deleteAccount', {
			user: user,
			soft: opts.soft,
		}, {
			removeOnComplete: true,
			removeOnFail: true,
		});
	}

	public createDeleteObjectStorageFileJob(key: string) {
		return this.objectStorageQueue.add('deleteFile', {
			key: key,
		}, {
			removeOnComplete: true,
			removeOnFail: true,
		});
	}

	public createCleanRemoteFilesJob() {
		return this.objectStorageQueue.add('cleanRemoteFiles', {}, {
			removeOnComplete: true,
			removeOnFail: true,
		});
	}

	public webhookDeliver(webhook: Webhook, type: typeof webhookEventTypes[number], content: unknown) {
		const data = {
			type,
			content,
			webhookId: webhook.id,
			userId: webhook.userId,
			to: webhook.url,
			secret: webhook.secret,
			createdAt: Date.now(),
			eventId: uuid(),
		};
	
		return this.webhookDeliverQueue.add(data, {
			attempts: 4,
			timeout: 1 * 60 * 1000,	// 1min
			backoff: {
				type: 'apBackoff',
			},
			removeOnComplete: true,
			removeOnFail: true,
		});
	}

	public destroy() {
		this.deliverQueue.once('cleaned', (jobs, status) => {
			//deliverLogger.succ(`Cleaned ${jobs.length} ${status} jobs`);
		});
		this.deliverQueue.clean(0, 'delayed');
	
		this.inboxQueue.once('cleaned', (jobs, status) => {
			//inboxLogger.succ(`Cleaned ${jobs.length} ${status} jobs`);
		});
		this.inboxQueue.clean(0, 'delayed');
	}
}
