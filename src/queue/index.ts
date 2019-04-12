import * as Queue from 'bull';
import * as httpSignature from 'http-signature';

import config from '../config';
import { ILocalUser } from '../models/entities/user';
import { program } from '../argv';

import processDeliver from './processors/deliver';
import processInbox from './processors/inbox';
import processDb from './processors/db';
import { queueLogger } from './logger';
import { DriveFile } from '../models/entities/drive-file';

function initializeQueue(name: string) {
	return new Queue(name, {
		redis: {
			port: config.redis.port,
			host: config.redis.host,
			password: config.redis.pass,
			db: config.redis.db || 0,
		},
		prefix: config.redis.prefix ? `${config.redis.prefix}:queue` : 'queue'
	});
}

export const deliverQueue = initializeQueue('deliver');
export const inboxQueue = initializeQueue('inbox');
export const dbQueue = initializeQueue('db');

const deliverLogger = queueLogger.createSubLogger('deliver');
const inboxLogger = queueLogger.createSubLogger('inbox');

deliverQueue
	.on('waiting', (jobId) => deliverLogger.debug(`waiting id=${jobId}`))
	.on('active', (job) => deliverLogger.debug(`active id=${job.id} to=${job.data.to}`))
	.on('completed', (job, result) => deliverLogger.debug(`completed(${result}) id=${job.id} to=${job.data.to}`))
	.on('failed', (job, err) => deliverLogger.warn(`failed(${err}) id=${job.id} to=${job.data.to}`))
	.on('error', (error) => deliverLogger.error(`error ${error}`))
	.on('stalled', (job) => deliverLogger.warn(`stalled id=${job.id} to=${job.data.to}`));

inboxQueue
	.on('waiting', (jobId) => inboxLogger.debug(`waiting id=${jobId}`))
	.on('active', (job) => inboxLogger.debug(`active id=${job.id}`))
	.on('completed', (job, result) => inboxLogger.debug(`completed(${result}) id=${job.id}`))
	.on('failed', (job, err) => inboxLogger.warn(`failed(${err}) id=${job.id} activity=${job.data.activity ? job.data.activity.id : 'none'}`))
	.on('error', (error) => inboxLogger.error(`error ${error}`))
	.on('stalled', (job) => inboxLogger.warn(`stalled id=${job.id} activity=${job.data.activity ? job.data.activity.id : 'none'}`));

export function deliver(user: ILocalUser, content: any, to: any) {
	if (content == null) return null;

	const data = {
		user,
		content,
		to
	};

	return deliverQueue.add(data, {
		attempts: 8,
		backoff: {
			type: 'exponential',
			delay: 60 * 1000
		},
		removeOnComplete: true,
		removeOnFail: true
	});
}

export function inbox(activity: any, signature: httpSignature.IParsedSignature) {
	const data = {
		activity: activity,
		signature
	};

	return inboxQueue.add(data, {
		attempts: 8,
		backoff: {
			type: 'exponential',
			delay: 1000
		},
		removeOnComplete: true,
		removeOnFail: true
	});
}

export function createDeleteDriveFilesJob(user: ILocalUser) {
	return dbQueue.add('deleteDriveFiles', {
		user: user
	}, {
		removeOnComplete: true,
		removeOnFail: true
	});
}

export function createExportNotesJob(user: ILocalUser) {
	return dbQueue.add('exportNotes', {
		user: user
	}, {
		removeOnComplete: true,
		removeOnFail: true
	});
}

export function createExportFollowingJob(user: ILocalUser) {
	return dbQueue.add('exportFollowing', {
		user: user
	}, {
		removeOnComplete: true,
		removeOnFail: true
	});
}

export function createExportMuteJob(user: ILocalUser) {
	return dbQueue.add('exportMute', {
		user: user
	}, {
		removeOnComplete: true,
		removeOnFail: true
	});
}

export function createExportBlockingJob(user: ILocalUser) {
	return dbQueue.add('exportBlocking', {
		user: user
	}, {
		removeOnComplete: true,
		removeOnFail: true
	});
}

export function createExportUserListsJob(user: ILocalUser) {
	return dbQueue.add('exportUserLists', {
		user: user
	}, {
		removeOnComplete: true,
		removeOnFail: true
	});
}

export function createImportFollowingJob(user: ILocalUser, fileId: DriveFile['id']) {
	return dbQueue.add('importFollowing', {
		user: user,
		fileId: fileId
	}, {
		removeOnComplete: true,
		removeOnFail: true
	});
}

export function createImportUserListsJob(user: ILocalUser, fileId: DriveFile['id']) {
	return dbQueue.add('importUserLists', {
		user: user,
		fileId: fileId
	}, {
		removeOnComplete: true,
		removeOnFail: true
	});
}

export default function() {
	if (!program.onlyServer) {
		deliverQueue.process(128, processDeliver);
		inboxQueue.process(128, processInbox);
		processDb(dbQueue);
	}
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
