import assert, { strictEqual } from 'node:assert';
import * as Misskey from 'misskey-js';
import { createAccount, fetchAdmin, type LoginUser, resolveRemoteNote, resolveRemoteUser, sleep } from './utils.js';

describe('Resolve Remote Reacted Notes', () => {
	let alice: LoginUser, bob: LoginUser, carol: LoginUser;
	let bobInC: Misskey.entities.UserDetailedNotMe;
	let cAdmin: LoginUser;

	beforeAll(async () => {
		[alice, bob] = await Promise.all([
			createAccount('a.test'),
			createAccount('b.test'),
		]);

		cAdmin = await fetchAdmin('c.test');

		await cAdmin.client.request('admin/update-meta', {
			resolveRemoteReactedNotes: true,
		});

		await sleep(1000);

		carol = await createAccount('c.test');

		await sleep(1000);

		bobInC = await resolveRemoteUser('b.test', bob.id, carol);
	});

	test('Note is resolved in c.test after followed user reacts to it', async () => {
		await carol.client.request('following/create', { userId: bobInC.id });
		await sleep(1000);

		const note = (await alice.client.request('notes/create', { text: 'test note from alice' })).createdNote;
		const noteInB = await resolveRemoteNote('a.test', note.id, bob);
		await bob.client.request('notes/reactions/create', { noteId: noteInB.id, reaction: '❤' });

		// Wait for ActivityPub delivery and note resolution with retry logic
		const expectedUri = `https://a.test/notes/${note.id}`;
		let reactedNoteInC: Misskey.entities.Note | undefined;
		for (let i = 0; i < 10; i++) {
			await sleep(1000);
			const notesInC = await carol.client.request('notes/global-timeline', {});
			reactedNoteInC = notesInC.find(n => n.uri === expectedUri);
			if (reactedNoteInC) break;
		}

		assert(reactedNoteInC != null, 'Note should be resolved in c.test after Bob reacted to it');
		strictEqual(reactedNoteInC.text, note.text);
		strictEqual(reactedNoteInC.createdAt, note.createdAt);
	});

	afterAll(async () => {
		await cAdmin.client.request('admin/update-meta', {
			resolveRemoteReactedNotes: false,
		});
		await sleep();
	});
});
