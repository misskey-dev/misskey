import cluster from 'node:cluster';
import { envOption } from '@/env.js';
import { jobQueue, server } from './common.js';

/**
 * Init worker process
 */
export async function workerMain() {
	if (envOption.onlyServer) {
		await server();
	} else if (envOption.onlyQueue) {
		await jobQueue();
	} else {
		await jobQueue();
	}

	if (cluster.isWorker) {
		// Send a 'ready' message to parent process
		process.send!('ready');
	}
}
