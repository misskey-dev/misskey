/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import cluster from 'node:cluster';
import Logger from '@/logger.js';
import { envOption } from '@/env.js';
import { loadConfig } from '@/config.js';
import { initTelemetry } from '@/core/telemetry/telemetry-registry.js';
import { installTelemetrySignalHandlers } from '@/core/telemetry/telemetry-shutdown.js';
import { initExtraThreadPool, jobQueue, server } from './common.js';

const logger = new Logger('core', 'cyan');
const bootLogger = logger.createSubLogger('boot', 'magenta');

/**
 * Init worker process
 */
export async function workerMain() {
	const config = loadConfig();

	initExtraThreadPool(config);

	try {
		await initTelemetry(config);
	} catch (e) {
		bootLogger.error(e instanceof Error ? e : new Error(String(e)), null, true);
		process.exit(1);
	}
	installTelemetrySignalHandlers();

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
