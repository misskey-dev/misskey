/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import { jest } from '@jest/globals';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { DataSource } from 'typeorm';
import { CoreModule } from '@/core/CoreModule.js';
import { MetaService } from '@/core/MetaService.js';
import { DI } from '@/di-symbols.js';
import { GlobalModule } from '@/GlobalModule.js';

describe('MetaService', () => {
	let app: TestingModule;
	let metaService: MetaService;

	beforeAll(async () => {
		app = await Test.createTestingModule({
			imports: [
				GlobalModule,
				CoreModule,
			],
		}).compile();

		app.enableShutdownHooks();

		metaService = app.get<MetaService>(MetaService, { strict: false });

		// Make it cached
		await metaService.fetch();
	});

	afterAll(async () => {
		await app.close();
	});

	test('fetch (cache)', async () => {
		const db = app.get<DataSource>(DI.db);
		const spy = jest.spyOn(db, 'transaction');

		const result = await metaService.fetch();

		expect(result.id).toBe('x');
		expect(spy).toHaveBeenCalledTimes(0);
	});

	test('fetch (force)', async () => {
		const db = app.get<DataSource>(DI.db);
		const spy = jest.spyOn(db, 'transaction');

		const result = await metaService.fetch(true);

		expect(result.id).toBe('x');
		expect(spy).toHaveBeenCalledTimes(1);
	});
});
