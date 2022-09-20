process.env.NODE_ENV = 'test';

import { jest } from '@jest/globals';
import { ModuleMocker } from 'jest-mock';
import { Test } from '@nestjs/testing';
import { GlobalModule } from '@/GlobalModule.js';
import { RelayService } from '@/core/RelayService.js';
import { ApRendererService } from '@/core/remote/activitypub/ApRendererService.js';
import { CreateSystemUserService } from '@/core/CreateSystemUserService.js';
import { QueueService } from '@/core/QueueService.js';
import { IdService } from '@/core/IdService.js';
import type { RelaysRepository } from '@/models/index.js';
import { DI } from '@/di-symbols.js';
import type { TestingModule } from '@nestjs/testing';
import type { MockFunctionMetadata } from 'jest-mock';

const moduleMocker = new ModuleMocker(global);

describe('RelayService', () => {
	let app: TestingModule;
	let relayService: RelayService;
	let queueService: jest.Mocked<QueueService>;
	let relaysRepository: RelaysRepository;

	beforeAll(async () => {
		app = await Test.createTestingModule({
			imports: [
				GlobalModule,
			],
			providers: [
				IdService,
				CreateSystemUserService,
				ApRendererService,
				RelayService,
			],
		})
			.useMocker((token) => {
				if (token === QueueService) {
					return { deliver: jest.fn() };
				}
				if (typeof token === 'function') {
					const mockMetadata = moduleMocker.getMetadata(token) as MockFunctionMetadata<any, any>;
					const Mock = moduleMocker.generateFromMetadata(mockMetadata);
					return new Mock();
				}
			})
			.compile();

		app.enableShutdownHooks();

		relayService = app.get<RelayService>(RelayService);
		queueService = app.get<QueueService>(QueueService) as jest.Mocked<QueueService>;
		relaysRepository = app.get<RelaysRepository>(DI.relaysRepository);
	});

	afterAll(async () => {
		await app.close();
	});

	it('addRelay', async () => {	
		const result = await relayService.addRelay('https://example.com');

		expect(result.inbox).toBe('https://example.com');
		expect(result.status).toBe('requesting');
		expect(queueService.deliver).toHaveBeenCalled();
		expect(queueService.deliver.mock.lastCall![1].type).toBe('Follow');
		expect(queueService.deliver.mock.lastCall![2]).toBe('https://example.com');
		//expect(queueService.deliver.mock.lastCall![0].username).toBe('relay.actor');
	});

	it('listRelay', async () => {	
		const result = await relayService.listRelay();

		expect(result.length).toBe(1);
		expect(result[0].inbox).toBe('https://example.com');
		expect(result[0].status).toBe('requesting');
	});

	it('removeRelay: succ', async () => {	
		await relayService.removeRelay('https://example.com');

		expect(queueService.deliver).toHaveBeenCalled();
		expect(queueService.deliver.mock.lastCall![1].type).toBe('Undo');
		expect(queueService.deliver.mock.lastCall![1].object.type).toBe('Follow');
		expect(queueService.deliver.mock.lastCall![2]).toBe('https://example.com');
		//expect(queueService.deliver.mock.lastCall![0].username).toBe('relay.actor');

		const list = await relayService.listRelay();
		expect(list.length).toBe(0);
	});

	it('removeRelay: fail', async () => {	
		await expect(relayService.removeRelay('https://x.example.com'))
			.rejects.toThrow('relay not found');
	});
});
