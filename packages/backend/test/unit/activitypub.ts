process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { Test } from '@nestjs/testing';
import { jest } from '@jest/globals';

import { ApNoteService } from '@/core/activitypub/models/ApNoteService.js';
import { ApPersonService } from '@/core/activitypub/models/ApPersonService.js';
import { ApRendererService } from '@/core/activitypub/ApRendererService.js';
import { GlobalModule } from '@/GlobalModule.js';
import { CoreModule } from '@/core/CoreModule.js';
import { FederatedInstanceService } from '@/core/FederatedInstanceService.js';
import { LoggerService } from '@/core/LoggerService.js';
import type { IActor, ICreate, IObject, IOrderedCollection, IOrderedCollectionPage, IPost } from '@/core/activitypub/type.js';
import { Note } from '@/models/index.js';
import { secureRndstr } from '@/misc/secure-rndstr.js';
import { MockResolver } from '../misc/mock-resolver.js';

const host = 'https://host1.test';

function createRandomActor(): IActor & { id: string } {
	const preferredUsername = secureRndstr(8);
	const actorId = `${host}/users/${preferredUsername.toLowerCase()}`;

	return {
		'@context': 'https://www.w3.org/ns/activitystreams',
		id: actorId,
		type: 'Person',
		preferredUsername,
		inbox: `${actorId}/inbox`,
		outbox: `${actorId}/outbox`,
	};
}

function createRandomCreateActivity(actor: IActor, length: number): ICreate[] {
	return new Array(length).fill(null).map((): ICreate => {
		const id = secureRndstr(8);
		const noteId = `${host}/notes/${id}`;

		return {
			type: 'Create',
			id: `${noteId}/activity`,
			actor,
			object: {
				id: noteId,
				type: 'Note',
				attributedTo: actor.id,
				content: 'test test foo',
			} satisfies IPost,
		};
	});
}

function createRandomNonPagedOutbox(actor: IActor, length: number): IOrderedCollection {
	const orderedItems = createRandomCreateActivity(actor, length);

	return {
		'@context': 'https://www.w3.org/ns/activitystreams',
		type: 'OrderedCollection',
		id: actor.outbox as string,
		totalItems: orderedItems.length,
		orderedItems,
	};
}

function createRandomOutboxPage(actor: IActor, id: string, length: number): IOrderedCollectionPage {
	const orderedItems = createRandomCreateActivity(actor, length);

	return {
		'@context': 'https://www.w3.org/ns/activitystreams',
		type: 'OrderedCollectionPage',
		id,
		totalItems: orderedItems.length,
		orderedItems,
	};
}

function createRandomPagedOutbox(actor: IActor): IOrderedCollection {
	return {
		'@context': 'https://www.w3.org/ns/activitystreams',
		type: 'OrderedCollection',
		id: actor.outbox as string,
		totalItems: 10,
		first: `${actor.outbox}?first`,
	};
}

describe('ActivityPub', () => {
	let noteService: ApNoteService;
	let personService: ApPersonService;
	let rendererService: ApRendererService;
	let resolver: MockResolver;

	beforeEach(async () => {
		const app = await Test.createTestingModule({
			imports: [GlobalModule, CoreModule],
		}).compile();

		await app.init();
		app.enableShutdownHooks();

		noteService = app.get<ApNoteService>(ApNoteService);
		personService = app.get<ApPersonService>(ApPersonService);
		rendererService = app.get<ApRendererService>(ApRendererService);
		resolver = new MockResolver(await app.resolve<LoggerService>(LoggerService));

		// Prevent ApPersonService from fetching instance, as it causes Jest import-after-test error
		const federatedInstanceService = app.get<FederatedInstanceService>(FederatedInstanceService);
		jest.spyOn(federatedInstanceService, 'fetch').mockImplementation(() => new Promise(() => { }));
	});

	describe('Parse minimum object', () => {
		const actor = createRandomActor();

		const post = {
			'@context': 'https://www.w3.org/ns/activitystreams',
			id: `${host}/users/${secureRndstr(8)}`,
			type: 'Note',
			attributedTo: actor.id,
			to: 'https://www.w3.org/ns/activitystreams#Public',
			content: 'あ',
		};

		test('Minimum Actor', async () => {
			resolver._register(actor.id, actor);

			const user = await personService.createPerson(actor.id, resolver);

			assert.deepStrictEqual(user.uri, actor.id);
			assert.deepStrictEqual(user.username, actor.preferredUsername);
			assert.deepStrictEqual(user.inbox, actor.inbox);
		});

		test('Minimum Note', async () => {
			resolver._register(actor.id, actor);
			resolver._register(post.id, post);

			const note = await noteService.createNote(post.id, resolver, true);

			assert.deepStrictEqual(note?.uri, post.id);
			assert.deepStrictEqual(note.visibility, 'public');
			assert.deepStrictEqual(note.text, post.content);
		});
	});

	describe('Name field', () => {
		test('Truncate long name', async () => {
			const actor = {
				...createRandomActor(),
				name: secureRndstr(129),
			};

			resolver._register(actor.id, actor);

			const user = await personService.createPerson(actor.id, resolver);

			assert.deepStrictEqual(user.name, actor.name.slice(0, 128));
		});

		test('Normalize empty name', async () => {
			const actor = {
				...createRandomActor(),
				name: '',
			};

			resolver._register(actor.id, actor);

			const user = await personService.createPerson(actor.id, resolver);

			assert.strictEqual(user.name, null);
		});
	});

	describe('Renderer', () => {
		test('Render an announce with visibility: followers', () => {
			rendererService.renderAnnounce(null, {
				createdAt: new Date(0),
				visibility: 'followers',
			} as Note);
		});
	});

	describe('Outbox', () => {
		test('Fetch non-paged outbox from IActor', async () => {
			const actor = createRandomActor();
			const outbox = createRandomNonPagedOutbox(actor, 10);

			resolver._register(actor.id, actor);
			resolver._register(actor.outbox as string, outbox);

			await personService.createPerson(actor.id, resolver);

			for (const item of outbox.orderedItems as ICreate[]) {
				const note = await noteService.fetchNote(item.object);
				assert.ok(note);
				assert.strictEqual(note.text, 'test test foo');
				assert.strictEqual(note.uri, (item.object as IObject).id);
			}
		});

		test('Fetch paged outbox from IActor', async () => {
			const actor = createRandomActor();
			const outbox = createRandomPagedOutbox(actor);
			const page = createRandomOutboxPage(actor, outbox.id!, 10);

			resolver._register(actor.id, actor);
			resolver._register(actor.outbox as string, outbox);
			resolver._register(outbox.first as string, page);

			await personService.createPerson(actor.id, resolver);

			for (const item of page.orderedItems as ICreate[]) {
				const note = await noteService.fetchNote(item.object);
				assert.ok(note);
				assert.strictEqual(note.text, 'test test foo');
				assert.strictEqual(note.uri, (item.object as IObject).id);
			}
		});

		test('Fetch only the first 100 items', async () => {
			const actor = createRandomActor();
			const outbox = createRandomNonPagedOutbox(actor, 200);

			resolver._register(actor.id, actor);
			resolver._register(actor.outbox as string, outbox);

			await personService.createPerson(actor.id, resolver);

			const items = outbox.orderedItems as ICreate[];
			assert.ok(await noteService.fetchNote(items[99].object));
			assert.ok(!await noteService.fetchNote(items[100].object));
		});
	});
});
