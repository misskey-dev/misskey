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
	const data = {
		type: 'deleteNotes',
		user: user
	};

	return dbQueue.add(data, {
		removeOnComplete: true,
		removeOnFail: true
	});
}

export function createDeleteDriveFilesJob(user: ILocalUser) {
	const data = {
		type: 'deleteDriveFiles',
		user: user
	};

	return dbQueue.add(data, {
		removeOnComplete: true,
		removeOnFail: true
	});
}

export function createExportNotesJob(user: ILocalUser) {
	const data = {
		type: 'exportNotes',
		user: user
	};

	return dbQueue.add(data, {
		removeOnComplete: true,
		removeOnFail: true
	});
}

export function createExportFollowingJob(user: ILocalUser) {
	const data = {
		type: 'exportFollowing',
		user: user
	};

	return dbQueue.add(data, {
		removeOnComplete: true,
		removeOnFail: true
	});
}

export function createExportMuteJob(user: ILocalUser) {
	const data = {
		type: 'exportMute',
		user: user
	};

	return dbQueue.add(data, {
		removeOnComplete: true,
		removeOnFail: true
	});
}

export function createExportBlockingJob(user: ILocalUser) {
	const data = {
		type: 'exportBlocking',
		user: user
	};

	return dbQueue.add(data, {
		removeOnComplete: true,
		removeOnFail: true
	});
}

export default function() {
	if (!program.onlyServer) {
		deliverQueue.process(processDeliver);
		inboxQueue.process(processInbox);
		dbQueue.process(processDb);
	}
}

export function destroy() {
	/*
	queue.destroy().then(n => {
		queueLogger.succ(`All job removed (${n} jobs)`);
	});*/
}
