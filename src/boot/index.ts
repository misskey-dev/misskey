import * as cluster from 'cluster';
import * as chalk from 'chalk';
import Xev from 'xev';

import Logger from '../services/logger';
import { program } from '../argv';

// for typeorm
import 'reflect-metadata';
import { masterMain } from './master';
import { workerMain } from './worker';

const logger = new Logger('core', 'cyan');
const clusterLogger = logger.createSubLogger('cluster', 'orange', false);
const ev = new Xev();

/**
 * Init process
 */
export default async function() {
	process.title = `Misskey (${cluster.isMaster ? 'master' : 'worker'})`;

	if (cluster.isMaster || program.disableClustering) {
		await masterMain();

		if (cluster.isMaster) {
			ev.mount();
		}
	}

	if (cluster.isWorker || program.disableClustering) {
		await workerMain();
	}

	// ユニットテスト時にMisskeyが子プロセスで起動された時のため
	// それ以外のときは process.send は使えないので弾く
	if (process.send) {
		process.send('ok');
	}
}

//#region Events

// Listen new workers
cluster.on('fork', worker => {
	clusterLogger.debug(`Process forked: [${worker.id}]`);
});

// Listen online workers
cluster.on('online', worker => {
	clusterLogger.debug(`Process is now online: [${worker.id}]`);
});

// Listen for dying workers
cluster.on('exit', worker => {
	// Replace the dead worker,
	// we're not sentimental
	clusterLogger.error(chalk.red(`[${worker.id}] died :(`));
	cluster.fork();
});

// Display detail of unhandled promise rejection
if (!program.quiet) {
	process.on('unhandledRejection', console.dir);
}

// Display detail of uncaught exception
process.on('uncaughtException', err => {
	try {
		logger.error(err);
	} catch { }
});

// Dying away...
process.on('exit', code => {
	logger.info(`The process is going to exit with code ${code}`);
});

//#endregion
