import * as cluster from 'cluster';
import { initMainPostgre } from '../db/entities';

/**
 * Init worker process
 */
export async function workerMain() {
	await initMainPostgre();
	await require('../db/charts').initChartPostgre();

	// start server
	await require('../server').default();

	// start job queue
	require('../queue').default();

	if (cluster.isWorker) {
		// Send a 'ready' message to parent process
		process.send('ready');
	}
}
