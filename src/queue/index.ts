import * as Queue from 'bull';
import * as httpSignature from 'http-signature';

import config from '../config';
import { ILocalUser } from '../models/user';
import { program } from '../argv';

import processDeliver from './processors/deliver';
import processInbox from './processors/process-inbox';
import processDb from './processors/db';

function initializeQueue(name: string) {
	return new Queue(name, config.redis != null ? {
		redis: {
			port: config.redis.port,
			host: config.redis.host,
			password: config.redis.pass,
			db: 1
		}
	} : null);
}

const deliverQueue = initializeQueue('deliver');
const inboxQueue = initializeQueue('inbox');
const dbQueue = initializeQueue('db');

export function deliver(user: ILocalUser, content: any, to: any) {
	if (content == null) return null;

	const data = {
		user,
		content,
		to
	};

	return deliverQueue.add(data, {
		attempts: 4,
		backoff: {
			type: 'exponential',
			delay: 1000
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
		attempts: 4,
		backoff: {
			type: 'exponential',
			delay: 1000
		},
		removeOnComplete: true,
		removeOnFail: true
	});
}

export function createDeleteNotesJob(user: ILocalUser) {
	return dbQueue.add('deleteNotes', {
		user: user
	}, {
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

export default function() {
	if (!program.onlyServer) {
		deliverQueue.process(processDeliver);
		inboxQueue.process(processInbox);
		processDb(dbQueue);
	}
}

export function destroy() {
	/*
	queue.destroy().then(n => {
		queueLogger.succ(`All job removed (${n} jobs)`);
	});*/
}
