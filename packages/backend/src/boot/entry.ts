/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Misskey Entry Point!
 */

import cluster from 'node:cluster';
import { EventEmitter } from 'node:events';
import { writeHeapSnapshot } from 'node:v8';
import Xev from 'xev';
import Logger from '@/logger.js';
import { envOption } from '../env.js';
import { installProcessErrorHandlers } from './process-error-handler.js';
import { isShutdownInProgress } from './shutdown-handler.js';
import { readyRef } from './ready.js';

import 'reflect-metadata';

process.title = `Misskey (${cluster.isPrimary ? 'master' : 'worker'})`;

Error.stackTraceLimit = Infinity;
EventEmitter.defaultMaxListeners = 128;

const logger = new Logger('core', 'cyan');
const clusterLogger = logger.createSubLogger('cluster', 'orange');
const ev = new Xev();

installProcessErrorHandlers({ logger, quiet: envOption.quiet });

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
	if (isShutdownInProgress()) {
		clusterLogger.info(`Process exited during shutdown: [${worker.id}]`);
		return;
	}

	// 終了したワーカーは従来どおり再生成し、表示色は出力処理へ任せます。
	clusterLogger.error(`[${worker.id}] died :(`);
	cluster.fork();
});

// Dying away...
process.on('exit', code => {
	if (isShutdownInProgress()) return;
	logger.info(`The process is going to exit with code ${code}`);
});

//#endregion

if (!envOption.disableClustering) {
	if (cluster.isPrimary) {
		const { masterMain } = await import('./master.js');
		await masterMain();
		ev.mount();
	} else if (cluster.isWorker) {
		const { workerMain } = await import('./worker.js');
		await workerMain();
	} else {
		throw new Error('Unknown process type');
	}
} else {
	// 非clusterの場合はMasterのみが起動するため、Workerの処理は行わない(cluster.isWorker === trueの状態でこのブロックに来ることはない)
	const { masterMain } = await import('./master.js');
	await masterMain();
	ev.mount();
}

process.on('message', msg => {
	if (msg === 'gc') {
		if (global.gc != null) {
			logger.info('Manual GC triggered');
			for (let i = 0; i < 3; i++) {
				global.gc();
			}
			if (process.send != null) process.send('gc ok');
		} else {
			logger.warn('Manual GC requested but gc is not available. Start the process with --expose-gc to enable this feature.');
			if (process.send != null) process.send('gc unavailable');
		}
	} else if (msg === 'memory usage') {
		if (process.send != null) {
			process.send({
				type: 'memory usage',
				value: process.memoryUsage(),
			});
		}
	} else if (msg != null && typeof msg === 'object' && 'type' in msg && msg.type === 'heap snapshot' && 'path' in msg && typeof msg.path === 'string') {
		if (process.send != null) {
			try {
				const path = writeHeapSnapshot(msg.path);
				process.send({
					type: 'heap snapshot',
					path,
				});
			} catch (err) {
				process.send({
					type: 'heap snapshot error',
					message: err instanceof Error ? err.message : String(err),
				});
			}
		}
	}
});

readyRef.value = true;

// ユニットテスト時にMisskeyが子プロセスで起動された時のため
// それ以外のときは process.send は使えないので弾く
if (process.send) {
	process.send('ok');
}
