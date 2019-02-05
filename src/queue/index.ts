import * as Queue from 'bee-queue';
import config from '../config';

import { ILocalUser } from '../models/user';
import { program } from '../argv';
import handler from './processors';

const enableQueue = config.redis != null && !program.disableQueue;

const queue = initializeQueue();

function initializeQueue() {
	if (enableQueue) {
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
	if (enableQueue) {
		return queue.createJob(data)
			.retries(4)
			.backoff('exponential', 16384) // 16s
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
	if (!enableQueue) throw 'queue disabled';

	return queue.createJob({
		type: 'exportNotes',
		user: user
	})
		.save();
}

export default function() {
	if (enableQueue) {
		queue.process(128, handler);
	}
}
