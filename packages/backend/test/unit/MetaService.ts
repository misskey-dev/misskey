process.env.NODE_ENV = 'test';

import { jest } from '@jest/globals';
import { ModuleMocker } from 'jest-mock';
import { Test } from '@nestjs/testing';
import { GlobalModule } from '@/GlobalModule.js';
import type { MetasRepository } from '@/models/index.js';
import { DI } from '@/di-symbols.js';
import { MetaService } from '@/core/MetaService.js';
import { CoreModule } from '@/core/CoreModule.js';
import type { DataSource } from 'typeorm';
import type { TestingModule } from '@nestjs/testing';

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
