/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { Test } from '@nestjs/testing';
import { jest } from '@jest/globals';
import * as Bull from 'bullmq';

import { InboxProcessorService } from '@/queue/processors/InboxProcessorService.js';
import { ApDbResolverService } from '@/core/activitypub/ApDbResolverService.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import { StatusError } from '@/misc/status-error.js';
import { GlobalModule } from '@/GlobalModule.js';
import { CoreModule } from '@/core/CoreModule.js';
import { MiMeta } from '@/models/_.js';
import { DI } from '@/di-symbols.js';

describe('InboxProcessorService', () => {
	let inboxProcessorService: InboxProcessorService;
	let apDbResolverService: ApDbResolverService;

	const meta = {
		blockedHosts: ['blocked.example.com'],
	} as MiMeta;

	beforeAll(async () => {
		const app = await Test.createTestingModule({
			imports: [GlobalModule, CoreModule],
		})
			.overrideProvider(DI.meta).useFactory({ factory: () => meta })
			.compile();

		await app.init();
		app.enableShutdownHooks();

		inboxProcessorService = app.get<InboxProcessorService>(InboxProcessorService);
		apDbResolverService = app.get<ApDbResolverService>(ApDbResolverService);
	});

	describe('process', () => {
		test('should skip jobs when actor is from blocked instance via relay', async () => {
			// Mock getAuthUserFromKeyId to return null (simulating relay scenario where keyId host differs)
			jest.spyOn(apDbResolverService, 'getAuthUserFromKeyId').mockResolvedValue(null);
			
			// Mock getAuthUserFromApId to throw "Instance is blocked" error
			jest.spyOn(apDbResolverService, 'getAuthUserFromApId').mockRejectedValue(
				new IdentifiableError('09d79f9e-64f1-4316-9cfa-e75c4d091574', 'Instance is blocked')
			);

			const jobData = {
				signature: {
					keyId: 'https://relay.example.com/actor#main-key', // Different from actor host
				},
				activity: {
					type: 'Create',
					actor: 'https://blocked.example.com/users/testuser', // Blocked instance
					id: 'https://blocked.example.com/activities/1',
					object: {
						type: 'Note',
						id: 'https://blocked.example.com/notes/1',
						content: 'test note',
						attributedTo: 'https://blocked.example.com/users/testuser',
					},
				},
			};

			const job = {
				data: jobData,
			} as Bull.Job;

			// Should throw UnrecoverableError with skip message instead of retrying
			await assert.rejects(
				inboxProcessorService.process(job),
				(err: any) => {
					return err instanceof Bull.UnrecoverableError && 
						   err.message.includes('skip: Instance is blocked');
				}
			);
		});

		test('should skip jobs when blocked instance error occurs during activity processing', async () => {
			// Mock successful user resolution
			jest.spyOn(apDbResolverService, 'getAuthUserFromKeyId').mockResolvedValue({
				user: { id: 'user1', uri: 'https://relay.example.com/users/relay' } as any,
				key: { keyPem: 'fake-key' } as any,
			});

			// Mock apInboxService.performActivity to throw "Instance is blocked" error
			// This simulates the error occurring during object resolution in performActivity
			const mockPerformActivity = jest.fn().mockRejectedValue(
				new IdentifiableError('09d79f9e-64f1-4316-9cfa-e75c4d091574', 'Instance is blocked')
			);
			
			// We need to mock the entire service since it's private
			Object.defineProperty(inboxProcessorService, 'apInboxService', {
				value: { performActivity: mockPerformActivity },
				writable: true,
			});

			const jobData = {
				signature: {
					keyId: 'https://relay.example.com/actor#main-key',
				},
				activity: {
					type: 'Create',
					actor: 'https://relay.example.com/users/relay',
					id: 'https://relay.example.com/activities/1',
					object: 'https://blocked.example.com/notes/1', // Reference to blocked instance
				},
			};

			const job = {
				data: jobData,
			} as Bull.Job;

			// Should return skip message instead of throwing
			const result = await inboxProcessorService.process(job);
			assert.strictEqual(result, 'skip: blocked instance');
		});

		test('should handle other errors normally (not affected by the fix)', async () => {
			// Mock getAuthUserFromKeyId to return null
			jest.spyOn(apDbResolverService, 'getAuthUserFromKeyId').mockResolvedValue(null);
			
			// Mock getAuthUserFromApId to throw a different IdentifiableError
			jest.spyOn(apDbResolverService, 'getAuthUserFromApId').mockRejectedValue(
				new IdentifiableError('some-other-error-id', 'Some other error')
			);

			const jobData = {
				signature: {
					keyId: 'https://example.com/actor#main-key',
				},
				activity: {
					type: 'Create',
					actor: 'https://example.com/users/testuser',
					id: 'https://example.com/activities/1',
					object: {
						type: 'Note',
						id: 'https://example.com/notes/1',
						content: 'test note',
						attributedTo: 'https://example.com/users/testuser',
					},
				},
			};

			const job = {
				data: jobData,
			} as Bull.Job;

			// Should NOT catch this error and let it propagate (preserving existing behavior)
			await assert.rejects(
				inboxProcessorService.process(job),
				(err: any) => {
					return err instanceof IdentifiableError && 
						   err.id === 'some-other-error-id';
				}
			);
		});

		test('should still handle StatusError as before', async () => {
			// Mock getAuthUserFromKeyId to return null
			jest.spyOn(apDbResolverService, 'getAuthUserFromKeyId').mockResolvedValue(null);
			
			// Mock getAuthUserFromApId to throw a non-retryable StatusError
			jest.spyOn(apDbResolverService, 'getAuthUserFromApId').mockRejectedValue(
				new StatusError('Not Found', 404, 'User not found')
			);

			const jobData = {
				signature: {
					keyId: 'https://example.com/actor#main-key',
				},
				activity: {
					type: 'Create',
					actor: 'https://example.com/users/deleted',
					id: 'https://example.com/activities/1',
					object: {
						type: 'Note',
						id: 'https://example.com/notes/1',
						content: 'test note',
						attributedTo: 'https://example.com/users/deleted',
					},
				},
			};

			const job = {
				data: jobData,
			} as Bull.Job;

			// Should handle StatusError as before (UnrecoverableError for non-retryable)
			await assert.rejects(
				inboxProcessorService.process(job),
				(err: any) => {
					return err instanceof Bull.UnrecoverableError && 
						   err.message.includes('skip: Ignored deleted actors');
				}
			);
		});
	});
});