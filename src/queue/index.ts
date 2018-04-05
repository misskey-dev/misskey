import { createQueue } from 'kue';
import * as debug from 'debug';

import config from '../config';
import db from './processors/db';
import http from './processors/http';

const log = debug('misskey:queue');

const queue = createQueue({
	redis: {
		port: config.redis.port,
		host: config.redis.host,
		auth: config.redis.pass
	}
});

export function createHttp(data) {
	log(`HTTP job created: ${JSON.stringify(data)}`);

	return queue
		.create('http', data)
		.attempts(16)
		.backoff({ delay: 16384, type: 'exponential' });
}

export function createDb(data) {
	return queue.create('db', data);
}

export function deliver(user, content, to) {
	return createHttp({
		type: 'deliver',
		user,
		content,
		to
	});
}

export default function() {
	queue.process('db', db);

	/*
		256 is the default concurrency limit of Mozilla Firefox and Google
		Chromium.
		a8af215e691f3a2205a3758d2d96e9d328e100ff - chromium/src.git - Git at Google
		https://chromium.googlesource.com/chromium/src.git/+/a8af215e691f3a2205a3758d2d96e9d328e100ff
		Network.http.max-connections - MozillaZine Knowledge Base
		http://kb.mozillazine.org/Network.http.max-connections
	*/
	queue.process('http', 256, http);
}
