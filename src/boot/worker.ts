import * as cluster from 'cluster';

/**
 * Init worker process
 */
export async function workerMain() {
	// start server
	await require('../server').default();

	// start job queue
	require('../queue').default();

	if (cluster.isWorker) {
		// Send a 'ready' message to parent process
		process.send('ready');
	}
}
