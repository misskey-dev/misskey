import * as Queue from 'bee-queue';

import config from '../config';
import http from './processors/http';
import { ILocalUser } from '../models/user';

const queue = new Queue('misskey', {
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

export function createHttpJob(data: any) {
	return queue.createJob(data)
		//.retries(4)
		//.backoff('exponential', 16384) // 16s
		.save();
}

export function deliver(user: ILocalUser, content: any, to: any) {
	createHttpJob({
		type: 'deliver',
		user,
		content,
		to
	});
}

export default function() {
	queue.process(128, http);
}
