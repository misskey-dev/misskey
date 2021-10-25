import * as httpSignature from 'http-signature';

import config from '@/config/index';
import { envOption } from '../env';

import processDeliver from './processors/deliver';
import processInbox from './processors/inbox';
import processDb from './processors/db/index';
import procesObjectStorage from './processors/object-storage/index';
import { queueLogger } from './logger';
import { DriveFile } from '@/models/entities/drive-file';
import { getJobInfo } from './get-job-info';
import { systemQueue, dbQueue, deliverQueue, inboxQueue, objectStorageQueue } from './queues';
import { ThinUser } from './types';
import { IActivity } from '@/remote/activitypub/type';

function renderError(e: Error): any {
	return {
		stack: e?.stack,
		message: e?.message,
		name: e?.name
	};
}

const systemLogger = queueLogger.createSubLogger('system');
const deliverLogger = queueLogger.createSubLogger('deliver');
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

export function deliver(user: ThinUser, content: unknown, to: string | null) {
	if (content == null) return null;
	if (to == null) return null;

	const data = {
		user: {
			id: user.id
		},
		content,
		to
	};

	return deliverQueue.add(data, {
		attempts: config.deliverJobMaxAttempts || 12,
		timeout: 1 * 60 * 1000,	// 1min
		backoff: {
			type: 'apBackoff'
		},
		removeOnComplete: true,
		removeOnFail: true
	});
}

export function inbox(activity: IActivity, signature: httpSignature.IParsedSignature) {
	const data = {
		activity: activity,
		signature
	};

	return inboxQueue.add(data, {
		attempts: config.inboxJobMaxAttempts || 8,
		timeout: 5 * 60 * 1000,	// 5min
		backoff: {
			type: 'apBackoff'
		},
		removeOnComplete: true,
		removeOnFail: true
	});
}

export function createDeleteDriveFilesJob(user: ThinUser) {
	return dbQueue.add('deleteDriveFiles', {
		user: user
	}, {
		removeOnComplete: true,
		removeOnFail: true
	});
}

export function createExportNotesJob(user: ThinUser) {
	return dbQueue.add('exportNotes', {
		user: user
	}, {
		removeOnComplete: true,
		removeOnFail: true
	});
}

export function createExportFollowingJob(user: ThinUser) {
	return dbQueue.add('exportFollowing', {
		user: user
	}, {
		removeOnComplete: true,
		removeOnFail: true
	});
}

export function createExportMuteJob(user: ThinUser) {
	return dbQueue.add('exportMute', {
		user: user
	}, {
		removeOnComplete: true,
		removeOnFail: true
	});
}

export function createExportBlockingJob(user: ThinUser) {
	return dbQueue.add('exportBlocking', {
		user: user
	}, {
		removeOnComplete: true,
		removeOnFail: true
	});
}

export function createExportUserListsJob(user: ThinUser) {
	return dbQueue.add('exportUserLists', {
		user: user
	}, {
		removeOnComplete: true,
		removeOnFail: true
	});
}

export function createImportFollowingJob(user: ThinUser, fileId: DriveFile['id']) {
	return dbQueue.add('importFollowing', {
		user: user,
		fileId: fileId
	}, {
		removeOnComplete: true,
		removeOnFail: true
	});
}

export function createImportMutingJob(user: ThinUser, fileId: DriveFile['id']) {
	return dbQueue.add('importMuting', {
		user: user,
		fileId: fileId
	}, {
		removeOnComplete: true,
		removeOnFail: true
	});
}

export function createImportBlockingJob(user: ThinUser, fileId: DriveFile['id']) {
	return dbQueue.add('importBlocking', {
		user: user,
		fileId: fileId
	}, {
		removeOnComplete: true,
		removeOnFail: true
	});
}

export function createImportUserListsJob(user: ThinUser, fileId: DriveFile['id']) {
	return dbQueue.add('importUserLists', {
		user: user,
		fileId: fileId
	}, {
		removeOnComplete: true,
		removeOnFail: true
	});
}

export function createDeleteAccountJob(user: ThinUser, opts: { soft?: boolean; } = {}) {
	return dbQueue.add('deleteAccount', {
		user: user,
		soft: opts.soft
	}, {
		removeOnComplete: true,
		removeOnFail: true
	});
}

export function createDeleteObjectStorageFileJob(key: string) {
	return objectStorageQueue.add('deleteFile', {
		key: key
	}, {
		removeOnComplete: true,
		removeOnFail: true
	});
}

export function createCleanRemoteFilesJob() {
	return objectStorageQueue.add('cleanRemoteFiles', {}, {
		removeOnComplete: true,
		removeOnFail: true
	});
}

export default function() {
	if (envOption.onlyServer) return;

	deliverQueue.process(config.deliverJobConcurrency || 128, processDeliver);
	inboxQueue.process(config.inboxJobConcurrency || 16, processInbox);
	processDb(dbQueue);
	procesObjectStorage(objectStorageQueue);

	systemQueue.add('resyncCharts', {
	}, {
		repeat: { cron: '0 0 * * *' }
	});
}

export function destroy() {
	deliverQueue.once('cleaned', (jobs, status) => {
		deliverLogger.succ(`Cleaned ${jobs.length} ${status} jobs`);
	});
	deliverQueue.clean(0, 'delayed');

	inboxQueue.once('cleaned', (jobs, status) => {
		inboxLogger.succ(`Cleaned ${jobs.length} ${status} jobs`);
	});
	inboxQueue.clean(0, 'delayed');
}
