import * as Queue from 'bee-queue';
import * as httpSignature from 'http-signature';

import config from '../config';
import { ILocalUser } from '../models/user';
import { program } from '../argv';
import handler from './processors';
import { queueLogger } from './logger';

const enableQueue = !program.disableQueue;
const queueAvailable = config.redis != null;

const queue = initializeQueue();

function initializeQueue() {
	if (queueAvailable) {
		return new Queue('misskey', {
			redis: {
				port: config.redis.port,
				host: config.redis.host,
				password: config.redis.pass
			},

			removeOnSuccess: true,
			removeOnFailure: true,
			getEvents: false,
			sendEvents: false,
			storeJobs: false
		});
	} else {
		return null;
	}
}

export function deliver(user: ILocalUser, content: any, to: any) {
	if (content == null) return;

	const data = {
		type: 'deliver',
		user,
		content,
		to
	};

	if (queueAvailable && !program.disableApQueue) {
		return queue.createJob(data)
			.retries(8)
			.backoff('exponential', 1000)
			.save();
	} else {
		return handler({ data }, () => {});
	}
}

export function processInbox(activity: any, signature: httpSignature.IParsedSignature) {
	const data = {
		type: 'processInbox',
		activity: activity,
		signature
	};

	if (queueAvailable && !program.disableApQueue) {
		return queue.createJob(data)
			.retries(3)
			.backoff('exponential', 500)
			.save();
	} else {
		return handler({ data }, () => {});
	}
}

export function createExportNotesJob(user: ILocalUser) {
	if (!queueAvailable) throw 'queue unavailable';

	return queue.createJob({
		type: 'exportNotes',
		user: user
	})
		.save();
}

export function createExportFollowingJob(user: ILocalUser) {
	if (!queueAvailable) throw 'queue unavailable';

	return queue.createJob({
		type: 'exportFollowing',
		user: user
	})
		.save();
}

export function createExportMuteJob(user: ILocalUser) {
	if (!queueAvailable) throw 'queue unavailable';

	return queue.createJob({
		type: 'exportMute',
		user: user
	})
		.save();
}

export function createExportBlockingJob(user: ILocalUser) {
	if (!queueAvailable) throw 'queue unavailable';

	return queue.createJob({
		type: 'exportBlocking',
		user: user
	})
		.save();
}

export default function() {
	if (queueAvailable && enableQueue) {
		queue.process(128, handler);
		queueLogger.succ('Processing started');
	}

	return queue;
}

export function destroy() {
	queue.destroy().then(n => {
		queueLogger.succ(`All job removed (${n} jobs)`);
	});
}
