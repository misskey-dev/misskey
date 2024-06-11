/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import cluster from 'node:cluster';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { envOption } from '@/env.js';
import { loadConfig } from '@/config.js';
import { jobQueue, server } from './common.js';

/**
 * Init worker process
 */
export async function workerMain() {
	const config = loadConfig();

	if (config.sentryForBackend) {
		Sentry.init({
			integrations: [
				...(config.sentryForBackend.enableNodeProfiling ? [nodeProfilingIntegration()] : []),
			],

			// Performance Monitoring
			tracesSampleRate: 1.0, //  Capture 100% of the transactions

			// Set sampling rate for profiling - this is relative to tracesSampleRate
			profilesSampleRate: 1.0,

			maxBreadcrumbs: 0,

			...config.sentryForBackend.options,
		});
	}

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
