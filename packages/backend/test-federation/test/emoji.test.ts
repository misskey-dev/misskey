import assert, { strictEqual } from 'assert';
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
		await sleep(1000);
	});

	test('A server creates a custom emoji, and Bob can resolve it from Note', async () => {
		const name = crypto.randomUUID().replaceAll('-', '');
		const file = await uploadFile('a.test', '../../test/resources/192.jpg', aAdmin.i);
		await aAdminClient.request('admin/emoji/add', { name, fileId: file.id });
		const note = (await aliceClient.request('notes/create', { text: `I love :${name}:` })).createdNote;
		await sleep(1000);

		const notes = await bobClient.request('notes/timeline', {});
		strictEqual(notes.length, 1);
		const noteInBServer = notes[0];

		assert(note.text !== noteInBServer.text); // TODO: why?
		assert(noteInBServer.emojis != null);
		assert(name in noteInBServer.emojis);
		assert(noteInBServer.emojis[name] === file.url);
	});

	test('A server creates a custom emoji, and Bob can resolve it from Profile', async () => {
		const name = crypto.randomUUID().replaceAll('-', '');
		const file = await uploadFile('a.test', '../../test/resources/192.jpg', aAdmin.i);
		await aAdminClient.request('admin/emoji/add', { name, fileId: file.id });
		await aliceClient.request('i/update', { name: `:${name}:` });
		await sleep(1000);

		const renewedAliceInBServer = await bobClient.request('users/show', { userId: aliceInBServer.id });
		assert(name in renewedAliceInBServer.emojis);
		assert(renewedAliceInBServer.emojis[name] === file.url);
	});
});
