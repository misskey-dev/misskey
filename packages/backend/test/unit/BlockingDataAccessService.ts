/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as assert from 'assert';
import { beforeAll, describe, test } from 'vitest';
import { Test } from '@nestjs/testing';

import { CoreModule } from '@/core/CoreModule.js';
import { BlockingDataAccessService } from '@/core/data-access/BlockingDataAccessService.js';
import { GlobalModule } from '@/GlobalModule.js';

describe('BlockingDataAccessService', () => {
	let blockingDataAccessService: BlockingDataAccessService;

	beforeAll(async () => {
		const app = await Test.createTestingModule({
			imports: [GlobalModule, CoreModule],
		}).compile();
		blockingDataAccessService = app.get<BlockingDataAccessService>(BlockingDataAccessService);
	});

	test('DI コンテナから解決できる', () => {
		assert.ok(blockingDataAccessService);
		assert.strictEqual(typeof blockingDataAccessService.isBlocking, 'function');
		assert.strictEqual(typeof blockingDataAccessService.findBlocking, 'function');
		assert.strictEqual(typeof blockingDataAccessService.createBlocking, 'function');
		assert.strictEqual(typeof blockingDataAccessService.deleteBlocking, 'function');
	});
});
