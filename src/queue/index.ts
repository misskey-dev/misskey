import * as Queue from 'bee-queue';
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

export function createHttpJob(data: any) {
	if (queueAvailable) {
		return queue.createJob(data)
			.retries(3)
			.backoff('exponential', 1000)
			.save();
	} else {
		return handler({ data }, () => {});
	}
}

export function deliver(user: ILocalUser, content: any, to: any) {
	if (content == null) return;

	createHttpJob({
		type: 'deliver',
		user,
		content,
		to
	});
}

export function createExportNotesJob(user: ILocalUser) {
	if (!queueAvailable) throw 'queue unavailable';

	return queue.createJob({
		type: 'exportNotes',
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
