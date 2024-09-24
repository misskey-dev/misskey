import assert, { rejects, strictEqual } from 'node:assert';
import * as Misskey from 'misskey-js';
import { createAccount, deepStrictEqualWithExcludedFields, type LoginUser, resolveRemoteNote, resolveRemoteUser, sleep, uploadFile } from './utils.js';

describe('Note', () => {
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
	});

	describe('Note content', () => {
		test('Consistency of Public Note', async () => {
			const image = await uploadFile('a.test', '../../test/resources/192.jpg', alice.i);
			const note = (await alice.client.request('notes/create', {
				text: 'I am Alice!',
				fileIds: [image.id],
				poll: {
					choices: ['neko', 'inu'],
					multiple: false,
					expiredAfter: 60 * 60 * 1000,
				},
			})).createdNote;

			const resolvedNote = await resolveRemoteNote('a.test', note.id, bob);
			deepStrictEqualWithExcludedFields(note, resolvedNote, [
				'id',
				'emojis',
				/** Consistency of files is checked at {@link file://./drive.test.ts}, so let's skip. */
				'fileIds',
				'files',
				/** @see https://github.com/misskey-dev/misskey/issues/12409 */
				'reactionAcceptance',
				'userId',
				'user',
				'uri',
			]);
			strictEqual(aliceInBServer.id, resolvedNote.userId);
		});

		test('Consistency of reply', async () => {
			const _replyedNote = (await alice.client.request('notes/create', {
				text: 'a',
			})).createdNote;
			const note = (await alice.client.request('notes/create', {
				text: 'b',
				replyId: _replyedNote.id,
			})).createdNote;
			// NOTE: the repliedCount is incremented, so fetch again
			const replyedNote = await alice.client.request('notes/show', { noteId: _replyedNote.id });
			strictEqual(replyedNote.repliesCount, 1);

			const resolvedNote = await resolveRemoteNote('a.test', note.id, bob);
			deepStrictEqualWithExcludedFields(note, resolvedNote, [
				'id',
				'emojis',
				'reactionAcceptance',
				'replyId',
				'reply',
				'userId',
				'user',
				'uri',
			]);
			assert(resolvedNote.replyId != null);
			assert(resolvedNote.reply != null);
			deepStrictEqualWithExcludedFields(replyedNote, resolvedNote.reply, [
				'id',
				// TODO: why clippedCount loses consistency?
				'clippedCount',
				'emojis',
				'userId',
				'user',
				'uri',
				// flaky because this is parallelly incremented, so let's check it below
				'repliesCount',
			]);
			strictEqual(aliceInBServer.id, resolvedNote.userId);

			await sleep(100);

			const resolvedReplyedNote = await bob.client.request('notes/show', { noteId: resolvedNote.replyId });
			strictEqual(resolvedReplyedNote.repliesCount, 1);
		});

		test('Consistency of Renote', async () => {
			// NOTE: the renoteCount is not incremented, so no need to fetch again
			const renotedNote = (await alice.client.request('notes/create', {
				text: 'a',
			})).createdNote;
			const note = (await alice.client.request('notes/create', {
				text: 'b',
				renoteId: renotedNote.id,
			})).createdNote;

			const resolvedNote = await resolveRemoteNote('a.test', note.id, bob);
			deepStrictEqualWithExcludedFields(note, resolvedNote, [
				'id',
				'emojis',
				'reactionAcceptance',
				'renoteId',
				'renote',
				'userId',
				'user',
				'uri',
			]);
			assert(resolvedNote.renoteId != null);
			assert(resolvedNote.renote != null);
			deepStrictEqualWithExcludedFields(renotedNote, resolvedNote.renote, [
				'id',
				'emojis',
				'userId',
				'user',
				'uri',
			]);
			strictEqual(aliceInBServer.id, resolvedNote.userId);
		});
	});

	describe('Other props', () => {
		test('localOnly', async () => {
			const note = (await alice.client.request('notes/create', { text: 'a', localOnly: true })).createdNote;
			rejects(
				async () => await bob.client.request('ap/show', { uri: `https://a.test/notes/${note.id}` }),
				(err: any) => {
					/**
					 * FIXME: this error is not handled
					 * @see https://github.com/misskey-dev/misskey/issues/12736
					 */
					strictEqual(err.code, 'INTERNAL_ERROR');
					return true;
				},
			);
		});
	});

	describe('Deletion', () => {
		let carol: LoginUser;

		beforeAll(async () => {
			carol = await createAccount('a.test');

			await carol.client.request('following/create', { userId: bobInAServer.id });
			await sleep(100);
		});

		test('Delete is derivered to followers', async () => {
			const note = (await bob.client.request('notes/create', { text: 'I\'m Bob.' })).createdNote;
			const noteInAServer = await resolveRemoteNote('b.test', note.id, carol);
			await bob.client.request('notes/delete', { noteId: note.id });
			await sleep(100);

			await rejects(
				async () => await carol.client.request('notes/show', { noteId: noteInAServer.id }),
				(err: any) => {
					strictEqual(err.code, 'NO_SUCH_NOTE');
					return true;
				},
			);
		});
	});

	describe('Reaction', () => {
		test('Consistency of reaction', async () => {
			const note = (await alice.client.request('notes/create', { text: 'a' })).createdNote;
			const resolvedNote = await resolveRemoteNote('a.test', note.id, bob);
			const reaction = '😅';
			await bob.client.request('notes/reactions/create', { noteId: resolvedNote.id, reaction });
			await sleep(100);

			const reactions = await alice.client.request('notes/reactions', { noteId: note.id });
			strictEqual(reactions.length, 1);
			strictEqual(reactions[0].type, reaction);
			strictEqual(reactions[0].user.id, bobInAServer.id);
		});
	});

	describe('Poll', () => {
		describe('Any remote user\'s vote is delivered to the author', () => {
			let carol: LoginUser;

			beforeAll(async () => {
				carol = await createAccount('a.test');
			});

			test('Bob creates poll and receives a vote from Carol', async () => {
				const note = (await bob.client.request('notes/create', { poll: { choices: ['inu', 'neko'] } })).createdNote;
				const noteInAServer = await resolveRemoteNote('b.test', note.id, carol);
				await carol.client.request('notes/polls/vote', { noteId: noteInAServer.id, choice: 0 });
				await sleep(100);

				const noteAfterVote = await bob.client.request('notes/show', { noteId: note.id });
				assert(noteAfterVote.poll != null);
				strictEqual(noteAfterVote.poll.choices[0].votes, 1);
				strictEqual(noteAfterVote.poll.choices[1].votes, 0);
			});
		});

		describe('Local user\'s vote is delivered to the author\'s remote followers', () => {
			let bobRemoteFollower: LoginUser, localVoter: LoginUser;

			beforeAll(async () => {
				[
					bobRemoteFollower,
					localVoter,
				] = await Promise.all([
					createAccount('a.test'),
					createAccount('b.test'),
				]);

				await bobRemoteFollower.client.request('following/create', { userId: bobInAServer.id });
				await sleep(100);
			});

			test('A vote in Bob\'s server is delivered to Bob\'s remote followers', async () => {
				const note = (await bob.client.request('notes/create', { poll: { choices: ['inu', 'neko'] } })).createdNote;
				// NOTE: resolve before voting
				const noteInAServer = await resolveRemoteNote('b.test', note.id, bobRemoteFollower);
				await localVoter.client.request('notes/polls/vote', { noteId: note.id, choice: 0 });
				await sleep(100);

				const noteAfterVote = await bobRemoteFollower.client.request('notes/show', { noteId: noteInAServer.id });
				assert(noteAfterVote.poll != null);
				strictEqual(noteAfterVote.poll.choices[0].votes, 1);
				strictEqual(noteAfterVote.poll.choices[1].votes, 0);
			});
		});
	});
});
