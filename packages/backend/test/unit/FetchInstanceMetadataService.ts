/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import { jest } from '@jest/globals';
import { ModuleMocker } from 'jest-mock';
import { Test } from '@nestjs/testing';
import { Redis } from 'ioredis';
import { GlobalModule } from '@/GlobalModule.js';
import { FetchInstanceMetadataService } from '@/core/FetchInstanceMetadataService.js';
import { FederatedInstanceService } from '@/core/FederatedInstanceService.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import { LoggerService } from '@/core/LoggerService.js';
import { UtilityService } from '@/core/UtilityService.js';
import { IdService } from '@/core/IdService.js';
import { DI } from '@/di-symbols.js';
import type { TestingModule } from '@nestjs/testing';
import type { MockFunctionMetadata } from 'jest-mock';

function mockRedis() {
	const hash = {};
	const set = jest.fn((key, value) => {
		const ret = hash[key];
		hash[key] = value;
		return ret;
	});
	return set;
}

describe('FetchInstanceMetadataService', () => {
	let app: TestingModule;
	let fetchInstanceMetadataService: jest.Mocked<FetchInstanceMetadataService>;
	let federatedInstanceService: jest.Mocked<FederatedInstanceService>;
	let httpRequestService: jest.Mocked<HttpRequestService>;
	let redisClient: jest.Mocked<Redis.Redis>;

	beforeAll(async () => {
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
					return { getJson: jest.fn(), getHtml: jest.fn(), send: jest.fn() };
				} else if (token === FederatedInstanceService) {
					return { fetch: jest.fn() };
				} else if (token === DI.redis) {
					return mockRedis;
				}})
			.compile();

		app.enableShutdownHooks();

		fetchInstanceMetadataService = app.get<FetchInstanceMetadataService>(FetchInstanceMetadataService);
		federatedInstanceService = app.get<FederatedInstanceService>(FederatedInstanceService) as jest.Mocked<FederatedInstanceService>;
		redisClient = app.get<Redis.Redis>(DI.redis) as jest.Mocked<Redis.Redis>;
		httpRequestService = app.get<HttpRequestService>(HttpRequestService) as jest.Mocked<HttpRequestService>;
	});

	afterAll(async () => {
		await app.close();
	});

	test('Lock and update', async () => {
		redisClient.set = mockRedis();
		const now = Date.now();
		federatedInstanceService.fetch.mockReturnValue({ infoUpdatedAt: { getTime: () => { return now - 10 * 1000 * 60 * 60 * 24; } } });
		httpRequestService.getJson.mockImplementation(() => { throw Error(); });
		const tryLockSpy = jest.spyOn(fetchInstanceMetadataService, 'tryLock');
		const unlockSpy = jest.spyOn(fetchInstanceMetadataService, 'unlock');
		await fetchInstanceMetadataService.fetchInstanceMetadata({ host: 'example.com' });
		expect(tryLockSpy).toHaveBeenCalledTimes(1);
		expect(unlockSpy).toHaveBeenCalledTimes(1);
		expect(federatedInstanceService.fetch).toHaveBeenCalledTimes(1);
		expect(httpRequestService.getJson).toHaveBeenCalled();
	});
	test('Lock and don\'t update', async () => {
		redisClient.set = mockRedis();
		const now = Date.now();
		federatedInstanceService.fetch.mockReturnValue({ infoUpdatedAt: { getTime: () => now } });
		httpRequestService.getJson.mockImplementation(() => { throw Error(); });
		const tryLockSpy = jest.spyOn(fetchInstanceMetadataService, 'tryLock');
		const unlockSpy = jest.spyOn(fetchInstanceMetadataService, 'unlock');
		await fetchInstanceMetadataService.fetchInstanceMetadata({ host: 'example.com' });
		expect(tryLockSpy).toHaveBeenCalledTimes(1);
		expect(unlockSpy).toHaveBeenCalledTimes(1);
		expect(federatedInstanceService.fetch).toHaveBeenCalledTimes(1);
		expect(httpRequestService.getJson).toHaveBeenCalledTimes(0);
	});
	test('Do nothing when lock not acquired', async () => {
		redisClient.set = mockRedis();
		federatedInstanceService.fetch.mockReturnValue({ infoUpdatedAt: { getTime: () => now - 10 * 1000 * 60 * 60 * 24 } });
		httpRequestService.getJson.mockImplementation(() => { throw Error(); });
		const tryLockSpy = jest.spyOn(fetchInstanceMetadataService, 'tryLock');
		const unlockSpy = jest.spyOn(fetchInstanceMetadataService, 'unlock');
		await fetchInstanceMetadataService.tryLock('example.com');
		await fetchInstanceMetadataService.fetchInstanceMetadata({ host: 'example.com' });
		expect(tryLockSpy).toHaveBeenCalledTimes(2);
		expect(unlockSpy).toHaveBeenCalledTimes(0);
		expect(federatedInstanceService.fetch).toHaveBeenCalledTimes(0);
		expect(httpRequestService.getJson).toHaveBeenCalledTimes(0);
	});
});
