import * as cluster from 'cluster';
import { initDb } from '../db/postgre';
import Xev from 'xev';
import { registerTheme } from '../pluginThemes';
import { Theme } from '../theme';

const ev = new Xev();

/**
 * Init worker process
 */
export async function workerMain() {
	await initDb();

	// start server
	await require('../server').default();

	// start job queue
	require('../queue').default();

	if (cluster.isWorker) {
		// Send a 'ready' message to parent process
		process.send!('ready');

		ev.on('registerPluginTheme', (theme: Theme) => {
			registerTheme(theme);
		});
	}
}
