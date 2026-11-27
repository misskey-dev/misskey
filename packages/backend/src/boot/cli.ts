/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import 'reflect-metadata';
import { EventEmitter } from 'node:events';
import { parseArgs } from 'node:util';
import { NestFactory } from '@nestjs/core';
import { CommandModule } from '@/cli/CommandModule.js';
import { NestLogger } from '@/NestLogger.js';
import { CommandService } from '@/cli/CommandService.js';
import type { SearchIndexMaintenanceRequest } from '@/queue/types.js';

process.title = 'Misskey Cli';

Error.stackTraceLimit = Infinity;
EventEmitter.defaultMaxListeners = 128;

function parseDate(flag: string, value: string | undefined): number | undefined {
	if (value == null) return undefined;

	const match = /^(\d{4}-\d{2}-\d{2})T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.exec(value);
	const time = Date.parse(value);
	if (match == null || !Number.isFinite(time) || !new Date(match[1]).toISOString().startsWith(match[1])) {
		throw new Error(`${flag} must be an ISO 8601 date and time with a timezone, such as 2026-01-01T00:00:00Z.`);
	}
	return time;
}

async function runCommand() {
	const [command = 'help', ...args] = process.argv.slice(2);
	if (command === 'help') {
		console.log('Available commands:');
		console.log('  help - Displays this help message');
		console.log('  ping - Checks the CLI connection');
		console.log('  reset-captcha - Resets the captcha');
		console.log('  meilisearch-reindex [--since <ISO 8601>] [--until <ISO 8601>] - Queues indexing of existing notes (until is exclusive)');
		console.log('  meilisearch-reset --confirm - Queues deletion of all note search documents');
		return;
	}

	let searchRequest: SearchIndexMaintenanceRequest | undefined;
	switch (command) {
		case 'ping':
		case 'reset-captcha':
			break;
		case 'meilisearch-reindex': {
			const { values } = parseArgs({
				args,
				options: { since: { type: 'string' }, until: { type: 'string' } },
			});
			searchRequest = {
				operation: 'reindex',
				sinceDate: parseDate('--since', values.since),
				untilDate: parseDate('--until', values.until),
			};
			break;
		}
		case 'meilisearch-reset': {
			const { values } = parseArgs({ args, options: { confirm: { type: 'boolean' } } });
			if (!values.confirm) throw new Error('Pass --confirm to delete all documents in the Meilisearch note index.');
			searchRequest = { operation: 'reset' };
			break;
		}
		default:
			throw new Error(`Unrecognized command: ${command}. Use "help" to see available commands.`);
	}

	const app = await NestFactory.createApplicationContext(CommandModule, {
		logger: new NestLogger(),
		abortOnError: false,
	});
	try {
		const commandService = app.get(CommandService);
		if (searchRequest != null) {
			await commandService.enqueueSearchIndexMaintenance(searchRequest);
		} else if (command === 'ping') {
			await commandService.ping();
		} else {
			await commandService.resetCaptcha();
			console.log('Captcha has been reset.');
		}
	} finally {
		await app.close();
	}
}

try {
	await runCommand();
} catch (err) {
	console.error(err instanceof Error ? err.message : String(err));
	process.exitCode = 1;
}
