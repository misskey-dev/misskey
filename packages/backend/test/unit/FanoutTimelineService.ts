/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, vi, test, expect, afterEach, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import * as Redis from 'ioredis';
import type { Mocked } from 'vitest';
import { FanoutTimelineService } from '@/core/FanoutTimelineService.js';
import { IdService } from '@/core/IdService.js';
import { DI } from '@/di-symbols.js';

describe('FanoutTimelineService', () => {
	let app: TestingModule;
	let service: FanoutTimelineService;
	let redisForTimelines: Mocked<Redis.Redis>;
	let idService: IdService;

	beforeAll(async () => {
		app = await Test.createTestingModule({
			providers: [
				FanoutTimelineService,
				{
					provide: IdService,
					useValue: {
						parse: vi.fn(),
						gen: vi.fn(),
					},
				},
				{
					provide: DI.redisForTimelines,
					useValue: {
						eval: vi.fn(),
						lpush: vi.fn(),
						lrange: vi.fn(),
						del: vi.fn(),
						pipeline: vi.fn(() => ({
							lpush: vi.fn(),
							ltrim: vi.fn(),
							lrange: vi.fn(),
							exec: vi.fn(),
						})),
					},
				},
			],
		}).compile();

		app.enableShutdownHooks();

		service = app.get<FanoutTimelineService>(FanoutTimelineService);
		redisForTimelines = app.get(DI.redisForTimelines);
		idService = app.get<IdService>(IdService);
	});

	afterAll(async () => {
		await app.close();
	});

	afterEach(async () => {
		vi.clearAllMocks();
	});

	test('injectDummyIfEmpty should call Redis EVAL with correct script', async () => {
		redisForTimelines.eval.mockResolvedValue(1);

		const result = await service.injectDummyIfEmpty('homeTimeline:123', 'dummyId');

		expect(redisForTimelines.eval).toHaveBeenCalledWith(
			expect.stringContaining('if redis.call("LLEN", KEYS[1]) == 0 then'),
			1,
			'list:homeTimeline:123',
			'dummyId',
		);
		expect(result).toBe(true);
	});

	test('injectDummyIfEmpty should return false if list is not empty', async () => {
		redisForTimelines.eval.mockResolvedValue(0);

		const result = await service.injectDummyIfEmpty('homeTimeline:123', 'dummyId');

		expect(redisForTimelines.eval).toHaveBeenCalled();
		expect(result).toBe(false);
	});
});
