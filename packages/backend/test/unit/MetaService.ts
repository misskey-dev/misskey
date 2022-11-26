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
import type { MockFunctionMetadata } from 'jest-mock';

const moduleMocker = new ModuleMocker(global);

describe('MetaService', () => {
	let app: TestingModule;
	let metaService: MetaService;
	let metasRepository: MetasRepository;

	beforeAll(async () => {
		app = await Test.createTestingModule({
			imports: [
				GlobalModule,
				CoreModule,
			],
		}).compile();

		app.enableShutdownHooks();

		metaService = app.get<MetaService>(MetaService, { strict: false });
		metasRepository = app.get<MetasRepository>(DI.metasRepository, { strict: false });
	});

	afterAll(async () => {
		await app.close();
	});

	/* なんか動かない
	it('fetch (cache)', async () => {
		const db = app.get<DataSource>(DI.db);
		const originalFunction = db.transaction;
		const spy = jest.spyOn(db, 'transaction');
		spy.mockImplementation((...args) => originalFunction(...args));

		const result = await metaService.fetch();

		expect(result.id).toBe('x');
		expect(spy).toHaveBeenCalledTimes(0);

		spy.mockRestore();
	});

	it('fetch (force)', async () => {
		const db = app.get<DataSource>(DI.db);
		const originalFunction = db.transaction;
		const spy = jest.spyOn(db, 'transaction');
		// 何故かここで無限再帰する db.transaction がspyのままになっている？
		spy.mockImplementation((...args) => originalFunction(...args));

		const result = await metaService.fetch(true);

		expect(result.id).toBe('x');
		expect(spy).toHaveBeenCalledTimes(1);

		spy.mockRestore();
	});*/
});
