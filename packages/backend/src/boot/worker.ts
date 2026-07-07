/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import cluster from 'node:cluster';
import { envOption } from '@/env.js';
import { loadConfig } from '@/config.js';
import { initTelemetry } from '@/core/telemetry/telemetry-registry.js';
import { initExtraThreadPool, jobQueue, server } from './common.js';

/**
 * Init worker process
 */
export async function workerMain() {
	const config = loadConfig();

	initExtraThreadPool(config);

	await initTelemetry(config);

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
