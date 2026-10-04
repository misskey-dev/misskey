/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, describe, expect, test } from 'vitest';
import * as Bull from 'bullmq';
import { InboxProcessorService } from '@/queue/processors/InboxProcessorService.js';
import { StatusError } from '@/misc/status-error.js';
import type { InboxJobData } from '@/queue/types.js';

const actor = 'https://remote.example/users/alice';

function createService(resolveError: Error): InboxProcessorService {
	const logger = { debug: () => {}, info: () => {}, warn: () => {}, error: () => {}, succ: () => {} };
	return new InboxProcessorService(
		{} as never, // meta
		{ toPuny: (host: string) => host, isFederationAllowedHost: () => true } as never,
		{} as never, // apInboxService
		{} as never, // federatedInstanceService
		{} as never, // fetchInstanceMetadataService
		{} as never, // jsonLdService
		{} as never, // apPersonService
		{
			getAuthUserFromKeyId: async () => null,
			getAuthUserFromApId: async () => { throw resolveError; },
		} as never,
		{} as never, // instanceChart
		{} as never, // apRequestChart
		{} as never, // federationChart
		{ logger: { createSubLogger: () => logger } } as never,
	);
}

function job(): Bull.Job<InboxJobData> {
	return {
		data: {
			signature: { keyId: `${actor}#main-key` },
			activity: { type: 'Create', actor, object: `${actor}/notes/1` },
		},
	} as never;
}

describe('InboxProcessorService: resolving the actor', () => {
	let service: InboxProcessorService | null = null;

	afterEach(async () => {
		await service?.onApplicationShutdown();
		service = null;
	});

	test('a non-retryable StatusError skips the job', async () => {
		service = createService(new StatusError('Gone', 410));
		await expect(service.process(job())).rejects.toBeInstanceOf(Bull.UnrecoverableError);
	});

	test('a retryable StatusError is retried', async () => {
		service = createService(new StatusError('Service Unavailable', 503));
		const result = service.process(job());
		await expect(result).rejects.toThrow(`Error in actor ${actor} - 503`);
		await expect(result).rejects.not.toBeInstanceOf(Bull.UnrecoverableError);
	});

	test('an unexpected error is thrown as it is, so the job is retried', async () => {
		const unexpected = new Error('connection terminated unexpectedly');
		service = createService(unexpected);
		await expect(service.process(job())).rejects.toBe(unexpected);
	});
});
