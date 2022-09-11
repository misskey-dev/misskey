import cluster from 'node:cluster';
import { NestFactory } from '@nestjs/core';
import { envOption } from '@/env.js';
import { initDb } from '../db/postgre.js';
import createServer from '../server/index.js';
import initializeQueue from '../queue/index.js';
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
	if (!envOption.onlyServer) {
		await initializeQueue(app);
	}

	if (cluster.isWorker) {
		// Send a 'ready' message to parent process
		process.send!('ready');
	}
}
