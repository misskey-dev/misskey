import * as Queue from 'bee-queue';
import * as httpSignature from 'http-signature';

import config from '../config';
import { ILocalUser } from '../models/user';
import { program } from '../argv';
import handler from './processors';
import { queueLogger } from './logger';

const enableQueue = !program.disableQueue;
const enableQueueProcessing = !program.onlyServer && enableQueue;
const queueAvailable = config.redis != null;

const queue = initializeQueue();

function initializeQueue() {
	if (queueAvailable && enableQueue) {
		return new Queue('misskey-queue', {
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

	if (queueAvailable && enableQueueProcessing) {
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

	if (queueAvailable && enableQueueProcessing) {
		return queue.createJob(data)
			.retries(3)
			.backoff('exponential', 500)
			.save();
	} else {
		return handler({ data }, () => {});
	}
}

export function createDeleteNotesJob(user: ILocalUser) {
	const data = {
		type: 'deleteNotes',
		user: user
	};

	if (queueAvailable && enableQueueProcessing) {
		return queue.createJob(data).save();
	} else {
		return handler({ data }, () => {});
	}
}

export function createDeleteDriveFilesJob(user: ILocalUser) {
	const data = {
		type: 'deleteDriveFiles',
		user: user
	};

	if (queueAvailable && enableQueueProcessing) {
		return queue.createJob(data).save();
	} else {
		return handler({ data }, () => {});
	}
}

export function createExportNotesJob(user: ILocalUser) {
	const data = {
		type: 'exportNotes',
		user: user
	};

	if (queueAvailable && enableQueueProcessing) {
		return queue.createJob(data).save();
	} else {
		return handler({ data }, () => {});
	}
}

export function createExportFollowingJob(user: ILocalUser) {
	const data = {
		type: 'exportFollowing',
		user: user
	};

	if (queueAvailable && enableQueueProcessing) {
		return queue.createJob(data).save();
	} else {
		return handler({ data }, () => {});
	}
}

export function createExportMuteJob(user: ILocalUser) {
	const data = {
		type: 'exportMute',
		user: user
	};

	if (queueAvailable && enableQueueProcessing) {
		return queue.createJob(data).save();
	} else {
		return handler({ data }, () => {});
	}
}

export function createExportBlockingJob(user: ILocalUser) {
	const data = {
		type: 'exportBlocking',
		user: user
	};

	if (queueAvailable && enableQueueProcessing) {
		return queue.createJob(data).save();
	} else {
		return handler({ data }, () => {});
	}
}

export default function() {
	if (queueAvailable && enableQueueProcessing) {
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
