import * as cluster from 'cluster';
import { initPostgre } from '../db/postgre';

/**
 * Init worker process
 */
export async function workerMain() {
	await initPostgre();

	// start server
	await require('../server').default();

	// start job queue
	require('../queue').default();

	if (cluster.isWorker) {
		// Send a 'ready' message to parent process
		process.send('ready');
	}
}
