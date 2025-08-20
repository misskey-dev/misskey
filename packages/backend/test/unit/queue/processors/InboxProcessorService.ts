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
			// Mock getAuthUserFromKeyId to return null (not found)
			jest.spyOn(apDbResolverService, 'getAuthUserFromKeyId').mockResolvedValue(null);
			
			// Mock getAuthUserFromApId to throw "Instance is blocked" error
			jest.spyOn(apDbResolverService, 'getAuthUserFromApId').mockRejectedValue(
				new IdentifiableError('09d79f9e-64f1-4316-9cfa-e75c4d091574', 'Instance is blocked')
			);

			const jobData = {
				signature: {
					keyId: 'https://relay.example.com/actor#main-key',
				},
				activity: {
					type: 'Create',
					actor: 'https://blocked.example.com/users/testuser',
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

			// Should throw UnrecoverableError with skip message
			await assert.rejects(
				inboxProcessorService.process(job),
				(err: any) => {
					return err instanceof Bull.UnrecoverableError && 
						   err.message.includes('skip: Instance is blocked');
				}
			);
		});
	});
});