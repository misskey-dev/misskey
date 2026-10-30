/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import { afterAll, beforeAll, describe, test, expect, vi } from 'vitest';
import type { Mocked } from 'vitest';
import { Test } from '@nestjs/testing';
import { mockDeep } from 'vitest-mock-extended';
import type { TestingModule } from '@nestjs/testing';
import { ApRendererService } from '@/core/activitypub/ApRendererService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { IdService } from '@/core/IdService.js';
import { QueueService } from '@/core/QueueService.js';
import { RelayService } from '@/core/RelayService.js';
import { SystemAccountService } from '@/core/SystemAccountService.js';
import { GlobalModule } from '@/GlobalModule.js';
import { UtilityService } from '@/core/UtilityService.js';

describe('RelayService', () => {
	let app: TestingModule;
	let relayService: RelayService;
	let queueService: Mocked<QueueService>;

	beforeAll(async () => {
		app = await Test.createTestingModule({
			imports: [
				GlobalModule,
			],
			providers: [
				IdService,
				ApRendererService,
				RelayService,
				UserEntityService,
				SystemAccountService,
				UtilityService,
			],
		})
			.useMocker((token) => {
				if (token === QueueService) {
					return { deliver: vi.fn() };
				}
				if (typeof token === 'function') {
					return mockDeep<typeof token>();
				}
			})
			.compile();

		app.enableShutdownHooks();

		relayService = app.get<RelayService>(RelayService);
		queueService = app.get<QueueService>(QueueService) as Mocked<QueueService>;
	});

	afterAll(async () => {
		await app.close();
	});

	test('addRelay', async () => {
		const result = await relayService.addRelay('https://example.com');

		expect(result.inbox).toBe('https://example.com');
		expect(result.status).toBe('requesting');
		expect(queueService.deliver).toHaveBeenCalled();
		expect(queueService.deliver.mock.lastCall![1]?.type).toBe('Follow');
		expect(queueService.deliver.mock.lastCall![2]).toBe('https://example.com');
		//expect(queueService.deliver.mock.lastCall![0].username).toBe('relay.actor');
	});

	test('listRelay', async () => {
		const result = await relayService.listRelay();

		expect(result.length).toBe(1);
		expect(result[0].inbox).toBe('https://example.com');
		expect(result[0].status).toBe('requesting');
	});

	test('removeRelay: succ', async () => {
		await relayService.removeRelay('https://example.com');

		expect(queueService.deliver).toHaveBeenCalled();
		expect(queueService.deliver.mock.lastCall![1]?.type).toBe('Undo');
		expect(typeof queueService.deliver.mock.lastCall![1]?.object).toBe('object');
		expect((queueService.deliver.mock.lastCall![1]?.object as any).type).toBe('Follow');
		expect(queueService.deliver.mock.lastCall![2]).toBe('https://example.com');
		//expect(queueService.deliver.mock.lastCall![0].username).toBe('relay.actor');

		const list = await relayService.listRelay();
		expect(list.length).toBe(0);
	});

	test('removeRelay: fail', async () => {
		await expect(relayService.removeRelay('https://x.example.com'))
			.rejects.toThrow('relay not found');
	});
});
