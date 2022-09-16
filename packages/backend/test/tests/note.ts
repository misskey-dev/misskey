process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { initDb } from '@/db/postgre.js';
import { Notes } from '@/models/index.js';
import { GlobalModule } from '@/GlobalModule.js';
import { CoreModule } from '@/services/CoreModule.js';

describe('NoteCreateService', () => {
	let catsService: CatsService;

	beforeAll(async () => {
		//await initTestDb();
		await initDb();
	});

	beforeEach(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [
				GlobalModule,
			],
			providers: [CatsService],
		}).compile();

		catsService = moduleRef.get<CatsService>(CatsService);
	});

	it('createしたときwebhookが配信される', async () => {	
		class WebhookService2 {
			public deliver = jest.fn(() => {});
		}

		const webhookService = new WebhookService2();
		const noteCreateService = new NoteCreateService(Container.get('notesRepository'), webhookService as unknown as jest.Mocked<WebhookService>);

		await noteCreateService.create({ id: 'aaa' }, { text: 'test' });
		expect(webhookService.deliver).toBeCalled();
	});
});
