import cluster from 'node:cluster';
import { NestFactory } from '@nestjs/core';
import { initDb } from '../db/postgre.js';
import createServer from '../server/index.js';
import { AppModule } from '../app.module.js';

/**
 * Init worker process
 */
export async function workerMain() {
	await initDb();

	const app = await NestFactory.createApplicationContext(AppModule);

	// start server
	await createServer(app);

	// start job queue
	import('../queue/index.js').then(x => x.default());

	if (cluster.isWorker) {
		// Send a 'ready' message to parent process
		process.send!('ready');
	}
}
