process.env.NODE_ENV = 'test';

import { buildServiceProvider, getRequiredService, ServiceCollection, ServiceProvider } from 'yohira';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { DI } from '@/di-symbols.js';
import { MetaService } from '@/core/MetaService.js';
import { addGlobalServices, initializeGlobalServices } from '@/boot/GlobalModule.js';
import { addCoreServices } from '@/boot/CoreModule.js';
import type { DataSource } from 'typeorm';

describe('MetaService', () => {
	let serviceProvider: ServiceProvider;
	let metaService: MetaService;

	beforeAll(async () => {
		const services = new ServiceCollection();
		addGlobalServices(services);
		addCoreServices(services);

		serviceProvider = buildServiceProvider(services);

		await initializeGlobalServices(serviceProvider);

		metaService = getRequiredService<MetaService>(serviceProvider, DI.MetaService);

		// Make it cached
		await metaService.fetch();
	});

	afterAll(async () => {
		await serviceProvider.disposeAsync();
	});

	test('fetch (cache)', async () => {
		const db = getRequiredService<DataSource>(serviceProvider, DI.db);
		const spy = vi.spyOn(db, 'transaction');

		const result = await metaService.fetch();

		expect(result.id).toBe('x');
		expect(spy).toHaveBeenCalledTimes(0);
	});

	test('fetch (force)', async () => {
		const db = getRequiredService<DataSource>(serviceProvider, DI.db);
		const spy = vi.spyOn(db, 'transaction');

		const result = await metaService.fetch(true);

		expect(result.id).toBe('x');
		expect(spy).toHaveBeenCalledTimes(1);
	});
});
