/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { Mocked } from 'vitest';
import { Test } from '@nestjs/testing';
import { Redis } from 'ioredis';
import type { TestingModule } from '@nestjs/testing';
import { GlobalModule } from '@/GlobalModule.js';
import { FetchInstanceMetadataService } from '@/core/FetchInstanceMetadataService.js';
import { FederatedInstanceService } from '@/core/FederatedInstanceService.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import { LoggerService } from '@/core/LoggerService.js';
import { UtilityService } from '@/core/UtilityService.js';
import { IdService } from '@/core/IdService.js';
import { DI } from '@/di-symbols.js';

function mockRedis() {
	const hash = {} as any;
	const set = vi.fn<Redis['set']>((key: string, value) => {
		hash[key] = value;
		return Promise.resolve('OK');
	});
	return set;
}

describe('FetchInstanceMetadataService', () => {
	let app: TestingModule;
	let fetchInstanceMetadataService: Mocked<FetchInstanceMetadataService>;
	let federatedInstanceService: Mocked<FederatedInstanceService>;
	let httpRequestService: Mocked<HttpRequestService>;
	let redisClient: Mocked<Redis>;

	beforeEach(async () => {
		app = await Test
			.createTestingModule({
				imports: [
					GlobalModule,
				],
				providers: [
					FetchInstanceMetadataService,
					LoggerService,
					UtilityService,
					IdService,
				],
			})
			.useMocker((token) => {
				if (token === HttpRequestService) {
					return { getJson: vi.fn(), getHtml: vi.fn(), send: vi.fn() };
				} else if (token === FederatedInstanceService) {
					return { fetchOrRegister: vi.fn() };
				} else if (token === DI.redis) {
					return mockRedis;
				}
				return null;
			})
			.compile();

		app.enableShutdownHooks();

		fetchInstanceMetadataService = app.get<FetchInstanceMetadataService>(FetchInstanceMetadataService) as Mocked<FetchInstanceMetadataService>;
		federatedInstanceService = app.get<FederatedInstanceService>(FederatedInstanceService) as Mocked<FederatedInstanceService>;
		redisClient = app.get<Redis>(DI.redis) as Mocked<Redis>;
		httpRequestService = app.get<HttpRequestService>(HttpRequestService) as Mocked<HttpRequestService>;
	});

	afterEach(async () => {
		await app.close();
	});

	test('Lock and update', async () => {
		redisClient.set = mockRedis() as any;
		const now = Date.now();
		federatedInstanceService.fetchOrRegister.mockResolvedValue({ infoUpdatedAt: { getTime: () => { return now - 10 * 1000 * 60 * 60 * 24; } } } as any);
		httpRequestService.getJson.mockImplementation(() => { throw Error(); });
		const tryLockSpy = vi.spyOn(fetchInstanceMetadataService, 'tryLock');
		const unlockSpy = vi.spyOn(fetchInstanceMetadataService, 'unlock');

		await fetchInstanceMetadataService.fetchInstanceMetadata({ host: 'example.com' } as any);
		expect(tryLockSpy).toHaveBeenCalledTimes(1);
		expect(unlockSpy).toHaveBeenCalledTimes(1);
		expect(federatedInstanceService.fetchOrRegister).toHaveBeenCalledTimes(1);
		expect(httpRequestService.getJson).toHaveBeenCalled();
	});

	test('Lock and don\'t update', async () => {
		redisClient.set = mockRedis() as any;
		const now = Date.now();
		federatedInstanceService.fetchOrRegister.mockResolvedValue({ infoUpdatedAt: { getTime: () => now } } as any);
		httpRequestService.getJson.mockImplementation(() => { throw Error(); });
		const tryLockSpy = vi.spyOn(fetchInstanceMetadataService, 'tryLock');
		const unlockSpy = vi.spyOn(fetchInstanceMetadataService, 'unlock');

		await fetchInstanceMetadataService.fetchInstanceMetadata({ host: 'example.com' } as any);
		expect(tryLockSpy).toHaveBeenCalledTimes(1);
		expect(unlockSpy).toHaveBeenCalledTimes(1);
		expect(federatedInstanceService.fetchOrRegister).toHaveBeenCalledTimes(1);
		expect(httpRequestService.getJson).toHaveBeenCalledTimes(0);
	});

	test('Do nothing when lock not acquired', async () => {
		redisClient.set = mockRedis() as any;
		const now = Date.now();
		federatedInstanceService.fetchOrRegister.mockResolvedValue({ infoUpdatedAt: { getTime: () => now - 10 * 1000 * 60 * 60 * 24 } } as any);
		httpRequestService.getJson.mockImplementation(() => { throw Error(); });
		await fetchInstanceMetadataService.tryLock('example.com');
		const tryLockSpy = vi.spyOn(fetchInstanceMetadataService, 'tryLock');
		const unlockSpy = vi.spyOn(fetchInstanceMetadataService, 'unlock');

		await fetchInstanceMetadataService.fetchInstanceMetadata({ host: 'example.com' } as any);
		expect(tryLockSpy).toHaveBeenCalledTimes(1);
		expect(unlockSpy).toHaveBeenCalledTimes(0);
		expect(federatedInstanceService.fetchOrRegister).toHaveBeenCalledTimes(0);
		expect(httpRequestService.getJson).toHaveBeenCalledTimes(0);
	});

	test('Do when lock not acquired but forced', async () => {
		redisClient.set = mockRedis() as any;
		const now = Date.now();
		federatedInstanceService.fetchOrRegister.mockResolvedValue({ infoUpdatedAt: { getTime: () => now - 10 * 1000 * 60 * 60 * 24 } } as any);
		httpRequestService.getJson.mockImplementation(() => { throw Error(); });
		await fetchInstanceMetadataService.tryLock('example.com');
		const tryLockSpy = vi.spyOn(fetchInstanceMetadataService, 'tryLock');
		const unlockSpy = vi.spyOn(fetchInstanceMetadataService, 'unlock');

		await fetchInstanceMetadataService.fetchInstanceMetadata({ host: 'example.com' } as any, true);
		expect(tryLockSpy).toHaveBeenCalledTimes(0);
		expect(unlockSpy).toHaveBeenCalledTimes(1);
		expect(federatedInstanceService.fetchOrRegister).toHaveBeenCalledTimes(0);
		expect(httpRequestService.getJson).toHaveBeenCalled();
	});
});
