import { describe, test, beforeAll, vi } from 'vitest';
import assert, { deepStrictEqual, strictEqual } from 'assert';
import * as Misskey from 'misskey-js';
import { addCustomEmoji, createAccount, type LoginUser, resolveRemoteUser, waitForFollowRelation, WAIT_FOR_FEDERATION } from './utils.js';

describe('Emoji', () => {
	let alice: LoginUser, bob: LoginUser;
	let bobInA: Misskey.entities.UserDetailedNotMe, aliceInB: Misskey.entities.UserDetailedNotMe;

	beforeAll(async () => {
		[alice, bob] = await Promise.all([
			createAccount('a.test'),
			createAccount('b.test'),
		]);

		[bobInA, aliceInB] = await Promise.all([
			resolveRemoteUser('b.test', bob.id, alice),
			resolveRemoteUser('a.test', alice.id, bob),
		]);

		await bob.client.request('following/create', { userId: aliceInB.id });
		await waitForFollowRelation(bob, alice, 1);
	});

	async function waitForNoteInB(cond: (note: Misskey.entities.Note) => boolean): Promise<Misskey.entities.Note> {
		return await vi.waitFor(async () => {
			const notes = await bob.client.request('notes/timeline', {});
			const noteInB = notes.at(0);
			strictEqual(noteInB != null && cond(noteInB), true);
			return noteInB!;
		}, WAIT_FOR_FEDERATION);
	}

	test('Custom emoji are delivered with Note delivery', async () => {
		const emoji = await addCustomEmoji('a.test');
		await alice.client.request('notes/create', { text: `I love :${emoji.name}:` });

		const noteInB = await waitForNoteInB(note => note.text === `I love \u200b:${emoji.name}:\u200b`);

		assert(noteInB.emojis != null);
		assert(emoji.name in noteInB.emojis);
		strictEqual(noteInB.emojis[emoji.name], emoji.url);
	});

	test('Custom emoji are delivered with Reaction delivery', async () => {
		const emoji = await addCustomEmoji('a.test');
		const note = (await alice.client.request('notes/create', { text: 'a' })).createdNote;
		await waitForNoteInB(noteInB => noteInB.uri === `https://a.test/notes/${note.id}`);

		await alice.client.request('notes/reactions/create', { noteId: note.id, reaction: `:${emoji.name}:` });

		const noteInB = await waitForNoteInB(noteInB => noteInB.reactions[`:${emoji.name}@a.test:`] === 1);
		deepStrictEqual(noteInB.reactionEmojis[`${emoji.name}@a.test`], emoji.url);
	});

	test('Custom emoji are delivered with Profile delivery', async () => {
		const emoji = await addCustomEmoji('a.test');
		const renewedAlice = await alice.client.request('i/update', { name: `:${emoji.name}:` });

		const renewedaliceInB = await vi.waitFor(async () => {
			const renewedaliceInB = await bob.client.request('users/show', { userId: aliceInB.id });
			strictEqual(renewedaliceInB.name, renewedAlice.name);
			return renewedaliceInB;
		}, WAIT_FOR_FEDERATION);
		assert(emoji.name in renewedaliceInB.emojis);
		strictEqual(renewedaliceInB.emojis[emoji.name], emoji.url);
	});

	test('Local-only custom emoji aren\'t delivered with Note delivery', async () => {
		const emoji = await addCustomEmoji('a.test', { localOnly: true });
		await alice.client.request('notes/create', { text: `I love :${emoji.name}:` });

		const noteInB = await waitForNoteInB(note => note.text === `I love \u200b:${emoji.name}:\u200b`);

		// deepStrictEqual(noteInB.emojis, {}); // TODO: this fails (why?)
		deepStrictEqual({ ...noteInB.emojis }, {});
	});

	test('Local-only custom emoji aren\'t delivered with Reaction delivery', async () => {
		const emoji = await addCustomEmoji('a.test', { localOnly: true });
		const note = (await alice.client.request('notes/create', { text: 'a' })).createdNote;
		await waitForNoteInB(noteInB => noteInB.uri === `https://a.test/notes/${note.id}`);

		await alice.client.request('notes/reactions/create', { noteId: note.id, reaction: `:${emoji.name}:` });

		const noteInB = await waitForNoteInB(noteInB => noteInB.reactions['❤'] === 1);
		deepStrictEqual({ ...noteInB.reactions }, { '❤': 1 });
		deepStrictEqual({ ...noteInB.reactionEmojis }, {});
	});

	test('Local-only custom emoji aren\'t delivered with Profile delivery', async () => {
		const emoji = await addCustomEmoji('a.test', { localOnly: true });
		const renewedAlice = await alice.client.request('i/update', { name: `:${emoji.name}:` });

		const renewedaliceInB = await vi.waitFor(async () => {
			const renewedaliceInB = await bob.client.request('users/show', { userId: aliceInB.id });
			strictEqual(renewedaliceInB.name, renewedAlice.name);
			return renewedaliceInB;
		}, WAIT_FOR_FEDERATION);
		deepStrictEqual({ ...renewedaliceInB.emojis }, {});
	});
});
