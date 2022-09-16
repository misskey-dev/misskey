process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { jest } from '@jest/globals';

import { initDb } from '@/db/postgre.js';
import { Notes } from '@/models/index.js';
import { FooService } from '@/services/fooService.js';
import { NoteCreateService } from '../../src/services/note/NoteCreateService.js';
import type { WebhookService } from '../../src/services/webhookService.js';

describe('NoteCreateService', () => {
	beforeAll(async () => {
		//await initTestDb();
		await initDb();

		Container.set('notesRepository', Notes);
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
