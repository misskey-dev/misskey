import assert, { deepStrictEqual, strictEqual } from 'assert';
import * as Misskey from 'misskey-js';
import { createAccount, fetchAdmin, resolveRemoteUser, sleep, uploadFile } from './utils.js';

const [aAdmin, aAdminClient] = await fetchAdmin('a.test');

describe('Emoji', () => {
	let alice: Misskey.entities.SigninResponse, aliceClient: Misskey.api.APIClient;
	let bob: Misskey.entities.SigninResponse, bobClient: Misskey.api.APIClient, bobUsername: string;
	let bobInAServer: Misskey.entities.UserDetailedNotMe, aliceInBServer: Misskey.entities.UserDetailedNotMe;

	beforeAll(async () => {
		[alice, aliceClient] = await createAccount('a.test');
		[bob, bobClient, { username: bobUsername }] = await createAccount('b.test');

		[bobInAServer, aliceInBServer] = await Promise.all([
			resolveRemoteUser('b.test', bob.id, aliceClient),
			resolveRemoteUser('a.test', alice.id, bobClient),
		]);

		await bobClient.request('following/create', { userId: aliceInBServer.id });
		await sleep(100);
	});

	test('Custom emoji are delivered with Note delivery', async () => {
		const name = crypto.randomUUID().replaceAll('-', '');
		const file = await uploadFile('a.test', '../../test/resources/192.jpg', aAdmin.i);
		await aAdminClient.request('admin/emoji/add', { name, fileId: file.id });
		await aliceClient.request('notes/create', { text: `I love :${name}:` });
		await sleep(100);

		const notes = await bobClient.request('notes/timeline', {});
		const noteInBServer = notes[0];

		strictEqual(noteInBServer.text, `I love \u200b:${name}:\u200b`);
		assert(noteInBServer.emojis != null);
		assert(name in noteInBServer.emojis);
		strictEqual(noteInBServer.emojis[name], file.url);
	});

	test('Custom emoji are delivered with Reaction delivery', async () => {
		const name = crypto.randomUUID().replaceAll('-', '');
		const file = await uploadFile('a.test', '../../test/resources/192.jpg', aAdmin.i);
		await aAdminClient.request('admin/emoji/add', { name, fileId: file.id });
		const note = (await aliceClient.request('notes/create', { text: 'a' })).createdNote;
		await sleep(100);

		await aliceClient.request('notes/reactions/create', { noteId: note.id, reaction: `:${name}:` });
		await sleep(100);

		const noteInBServer = (await bobClient.request('notes/timeline', {}))[0];
		deepStrictEqual(noteInBServer.reactions[`:${name}@a.test:`], 1);
		deepStrictEqual(noteInBServer.reactionEmojis[`${name}@a.test`], file.url);
	});

	test('Custom emoji are delivered with Profile delivery', async () => {
		const name = crypto.randomUUID().replaceAll('-', '');
		const file = await uploadFile('a.test', '../../test/resources/192.jpg', aAdmin.i);
		await aAdminClient.request('admin/emoji/add', { name, fileId: file.id });
		const renewedAlice = await aliceClient.request('i/update', { name: `:${name}:` });
		await sleep(100);

		const renewedAliceInBServer = await bobClient.request('users/show', { userId: aliceInBServer.id });
		strictEqual(renewedAliceInBServer.name, renewedAlice.name);
		assert(name in renewedAliceInBServer.emojis);
		strictEqual(renewedAliceInBServer.emojis[name], file.url);
	});

	test('Local-only custom emoji aren\'t delivered with Note delivery', async () => {
		const name = crypto.randomUUID().replaceAll('-', '');
		const file = await uploadFile('a.test', '../../test/resources/192.jpg', aAdmin.i);
		await aAdminClient.request('admin/emoji/add', { name, fileId: file.id, localOnly: true });
		await aliceClient.request('notes/create', { text: `I love :${name}:` });
		await sleep(100);

		const notes = await bobClient.request('notes/timeline', {});
		const noteInBServer = notes[0];

		strictEqual(noteInBServer.text, `I love \u200b:${name}:\u200b`);
		// deepStrictEqual(noteInBServer.emojis, {}); // TODO: this fails (why?)
		deepStrictEqual({ ...noteInBServer.emojis }, {});
	});

	test('Local-only custom emoji aren\'t delivered with Reaction delivery', async () => {
		const name = crypto.randomUUID().replaceAll('-', '');
		const file = await uploadFile('a.test', '../../test/resources/192.jpg', aAdmin.i);
		await aAdminClient.request('admin/emoji/add', { name, fileId: file.id, localOnly: true });
		const note = (await aliceClient.request('notes/create', { text: 'a' })).createdNote;
		await sleep(100);

		await aliceClient.request('notes/reactions/create', { noteId: note.id, reaction: `:${name}:` });
		await sleep(100);

		const noteInBServer = (await bobClient.request('notes/timeline', {}))[0];
		deepStrictEqual({ ...noteInBServer.reactions }, { '❤': 1 });
		deepStrictEqual({ ...noteInBServer.reactionEmojis }, {});
	});

	test('Local-only custom emoji aren\'t delivered with Profile delivery', async () => {
		const name = crypto.randomUUID().replaceAll('-', '');
		const file = await uploadFile('a.test', '../../test/resources/192.jpg', aAdmin.i);
		await aAdminClient.request('admin/emoji/add', { name, fileId: file.id, localOnly: true });
		const renewedAlice = await aliceClient.request('i/update', { name: `:${name}:` });
		await sleep(100);

		const renewedAliceInBServer = await bobClient.request('users/show', { userId: aliceInBServer.id });
		strictEqual(renewedAliceInBServer.name, renewedAlice.name);
		deepStrictEqual({ ...renewedAliceInBServer.emojis }, {});
	});
});
