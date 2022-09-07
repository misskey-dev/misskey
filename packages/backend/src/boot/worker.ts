import cluster from 'node:cluster';
import { Container } from 'typedi';
import { Notes } from '@/models/index.js';
import { initDb } from '../db/postgre.js';

/**
 * Init worker process
 */
export async function workerMain() {
	await initDb();

	Container.set('notesRepository', Notes);

	// start server
	await import('../server/index.js').then(x => x.default());

	// start job queue
	import('../queue/index.js').then(x => x.default());

	if (cluster.isWorker) {
		// Send a 'ready' message to parent process
		process.send!('ready');
	}
}
