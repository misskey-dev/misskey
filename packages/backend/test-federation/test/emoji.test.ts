import assert, { deepStrictEqual, strictEqual } from 'assert';
import * as Misskey from 'misskey-js';
import { addCustomEmoji, createAccount, type LoginUser, resolveRemoteUser, sleep } from './utils.js';

describe('Emoji', () => {
	let alice: LoginUser, bob: LoginUser;
	let bobInAServer: Misskey.entities.UserDetailedNotMe, aliceInBServer: Misskey.entities.UserDetailedNotMe;

	beforeAll(async () => {
		[alice, bob] = await Promise.all([
			createAccount('a.test'),
			createAccount('b.test'),
		]);

		[bobInAServer, aliceInBServer] = await Promise.all([
			resolveRemoteUser('b.test', bob.id, alice),
			resolveRemoteUser('a.test', alice.id, bob),
		]);

		await bob.client.request('following/create', { userId: aliceInBServer.id });
		await sleep();
	});

	test('Custom emoji are delivered with Note delivery', async () => {
		const emoji = await addCustomEmoji('a.test');
		await alice.client.request('notes/create', { text: `I love :${emoji.name}:` });
		await sleep();

		const notes = await bob.client.request('notes/timeline', {});
		const noteInBServer = notes[0];

		strictEqual(noteInBServer.text, `I love \u200b:${emoji.name}:\u200b`);
		assert(noteInBServer.emojis != null);
		assert(emoji.name in noteInBServer.emojis);
		strictEqual(noteInBServer.emojis[emoji.name], emoji.url);
	});

	test('Custom emoji are delivered with Reaction delivery', async () => {
		const emoji = await addCustomEmoji('a.test');
		const note = (await alice.client.request('notes/create', { text: 'a' })).createdNote;
		await sleep();

		await alice.client.request('notes/reactions/create', { noteId: note.id, reaction: `:${emoji.name}:` });
		await sleep();

		const noteInBServer = (await bob.client.request('notes/timeline', {}))[0];
		deepStrictEqual(noteInBServer.reactions[`:${emoji.name}@a.test:`], 1);
		deepStrictEqual(noteInBServer.reactionEmojis[`${emoji.name}@a.test`], emoji.url);
	});

	test('Custom emoji are delivered with Profile delivery', async () => {
		const emoji = await addCustomEmoji('a.test');
		const renewedAlice = await alice.client.request('i/update', { name: `:${emoji.name}:` });
		await sleep();

		const renewedAliceInBServer = await bob.client.request('users/show', { userId: aliceInBServer.id });
		strictEqual(renewedAliceInBServer.name, renewedAlice.name);
		assert(emoji.name in renewedAliceInBServer.emojis);
		strictEqual(renewedAliceInBServer.emojis[emoji.name], emoji.url);
	});

	test('Local-only custom emoji aren\'t delivered with Note delivery', async () => {
		const emoji = await addCustomEmoji('a.test', { localOnly: true });
		await alice.client.request('notes/create', { text: `I love :${emoji.name}:` });
		await sleep();

		const notes = await bob.client.request('notes/timeline', {});
		const noteInBServer = notes[0];

		strictEqual(noteInBServer.text, `I love \u200b:${emoji.name}:\u200b`);
		// deepStrictEqual(noteInBServer.emojis, {}); // TODO: this fails (why?)
		deepStrictEqual({ ...noteInBServer.emojis }, {});
	});

	test('Local-only custom emoji aren\'t delivered with Reaction delivery', async () => {
		const emoji = await addCustomEmoji('a.test', { localOnly: true });
		const note = (await alice.client.request('notes/create', { text: 'a' })).createdNote;
		await sleep();

		await alice.client.request('notes/reactions/create', { noteId: note.id, reaction: `:${emoji.name}:` });
		await sleep();

		const noteInBServer = (await bob.client.request('notes/timeline', {}))[0];
		deepStrictEqual({ ...noteInBServer.reactions }, { '❤': 1 });
		deepStrictEqual({ ...noteInBServer.reactionEmojis }, {});
	});

	test('Local-only custom emoji aren\'t delivered with Profile delivery', async () => {
		const emoji = await addCustomEmoji('a.test', { localOnly: true });
		const renewedAlice = await alice.client.request('i/update', { name: `:${emoji.name}:` });
		await sleep();

		const renewedAliceInBServer = await bob.client.request('users/show', { userId: aliceInBServer.id });
		strictEqual(renewedAliceInBServer.name, renewedAlice.name);
		deepStrictEqual({ ...renewedAliceInBServer.emojis }, {});
	});
});
