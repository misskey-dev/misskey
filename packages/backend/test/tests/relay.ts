process.env.NODE_ENV = 'test';

import { jest } from '@jest/globals';
import { ModuleMocker } from 'jest-mock';
import { Test } from '@nestjs/testing';
import { initDb } from '@/db/postgre.js';
import { GlobalModule } from '@/GlobalModule.js';
import { RelayService } from '@/services/RelayService.js';
import { ApRendererService } from '@/services/remote/activitypub/ApRendererService.js';
import { CreateSystemUserService } from '@/services/CreateSystemUserService.js';
import { QueueService } from '@/services/QueueService.js';
import { IdService } from '@/services/IdService.js';
import type { MockFunctionMetadata } from 'jest-mock';

const moduleMocker = new ModuleMocker(global);

describe('RelayService', () => {
	let relayService: RelayService;
	let queueService: jest.Mocked<QueueService>;

	beforeAll(async () => {
		//await initTestDb();
		await initDb();
	});

	beforeEach(async () => {
		const moduleRef = await Test.createTestingModule({
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

		relayService = moduleRef.get<RelayService>(RelayService);
		queueService = moduleRef.get<QueueService>(QueueService) as jest.Mocked<QueueService>;
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

	it('removeRelay', async () => {	
		await relayService.removeRelay('https://example.com');

		expect(queueService.deliver).toHaveBeenCalled();
		expect(queueService.deliver.mock.lastCall![1].type).toBe('Undo');
		expect(queueService.deliver.mock.lastCall![1].object.type).toBe('Follow');
		expect(queueService.deliver.mock.lastCall![2]).toBe('https://example.com');
		//expect(queueService.deliver.mock.lastCall![0].username).toBe('relay.actor');

		const list = await relayService.listRelay();
		expect(list.length).toBe(0);
	});
});
