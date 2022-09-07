process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { jest } from '@jest/globals';
import { Container, Service } from 'typedi';
import { initDb } from '@/db/postgre.js';
import { Notes } from '@/models/index.js';
import { FooService } from '@/services/fooService.js';
import { WebhookService } from '../../src/services/webhookService.js';
import { NoteService } from '../../src/services/noteService.js';

describe('NoteService', () => {
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
		const noteService = new NoteService(Container.get('notesRepository'), webhookService as unknown as jest.Mocked<WebhookService>);

		await noteService.create({ id: 'aaa' }, { text: 'test' });
		expect(webhookService.deliver).toBeCalled();
	});
});
