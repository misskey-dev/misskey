import assert, { rejects, strictEqual } from 'node:assert';
import * as Misskey from 'misskey-js';
import { addCustomEmoji, createAccount, createModerator, deepStrictEqualWithExcludedFields, type LoginUser, resolveRemoteNote, resolveRemoteUser, sleep, uploadFile } from './utils.js';

describe('Note', () => {
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
	});

	describe('Note content', () => {
		test('Consistency of Public Note', async () => {
			const image = await uploadFile('a.test', alice);
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
			strictEqual(aliceInB.id, resolvedNote.userId);
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
			strictEqual(aliceInB.id, resolvedNote.userId);

			await sleep();

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
			strictEqual(aliceInB.id, resolvedNote.userId);
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
		describe('Check Delete consistency', () => {
			let carol: LoginUser;

			beforeAll(async () => {
				carol = await createAccount('a.test');

				await carol.client.request('following/create', { userId: bobInA.id });
				await sleep();
			});

			test('Delete is derivered to followers', async () => {
				const note = (await bob.client.request('notes/create', { text: 'I\'m Bob.' })).createdNote;
				const noteInA = await resolveRemoteNote('b.test', note.id, carol);
				await bob.client.request('notes/delete', { noteId: note.id });
				await sleep();

				await rejects(
					async () => await carol.client.request('notes/show', { noteId: noteInA.id }),
					(err: any) => {
						strictEqual(err.code, 'NO_SUCH_NOTE');
						return true;
					},
				);
			});
		});

		describe('Deletion of remote user\'s note for moderation', () => {
			let note: Misskey.entities.Note;

			test('Alice post is deleted in B', async () => {
				note = (await alice.client.request('notes/create', { text: 'Hello' })).createdNote;
				const noteInB = await resolveRemoteNote('a.test', note.id, bob);
				const bMod = await createModerator('b.test');
				await bMod.client.request('notes/delete', { noteId: noteInB.id });
				await rejects(
					async () => await bob.client.request('notes/show', { noteId: noteInB.id }),
					(err: any) => {
						strictEqual(err.code, 'NO_SUCH_NOTE');
						return true;
					},
				);
			});

			/**
			 * FIXME: implement soft deletion as well as user?
			 *        @see https://github.com/misskey-dev/misskey/issues/11437
			 */
			test.failing('Not found even if resolve again', async () => {
				const noteInB = await resolveRemoteNote('a.test', note.id, bob);
				await rejects(
					async () => await bob.client.request('notes/show', { noteId: noteInB.id }),
					(err: any) => {
						strictEqual(err.code, 'NO_SUCH_NOTE');
						return true;
					},
				);
			});
		});
	});

	describe('Reaction', () => {
		describe('Consistency', () => {
			test('Unicode reaction', async () => {
				const note = (await alice.client.request('notes/create', { text: 'a' })).createdNote;
				const resolvedNote = await resolveRemoteNote('a.test', note.id, bob);
				const reaction = '😅';
				await bob.client.request('notes/reactions/create', { noteId: resolvedNote.id, reaction });
				await sleep();

				const reactions = await alice.client.request('notes/reactions', { noteId: note.id });
				strictEqual(reactions.length, 1);
				strictEqual(reactions[0].type, reaction);
				strictEqual(reactions[0].user.id, bobInA.id);
			});

			test('Custom emoji reaction', async () => {
				const note = (await alice.client.request('notes/create', { text: 'a' })).createdNote;
				const resolvedNote = await resolveRemoteNote('a.test', note.id, bob);
				const emoji = await addCustomEmoji('b.test');
				await bob.client.request('notes/reactions/create', { noteId: resolvedNote.id, reaction: `:${emoji.name}:` });
				await sleep();

				const reactions = await alice.client.request('notes/reactions', { noteId: note.id });
				strictEqual(reactions.length, 1);
				strictEqual(reactions[0].type, `:${emoji.name}@b.test:`);
				strictEqual(reactions[0].user.id, bobInA.id);
			});
		});

		describe('Acceptance', () => {
			test('Even if likeOnly, remote users can react with custom emoji, but it is converted to like', async () => {
				const note = (await alice.client.request('notes/create', { text: 'a', reactionAcceptance: 'likeOnly' })).createdNote;
				const noteInB = await resolveRemoteNote('a.test', note.id, bob);
				const emoji = await addCustomEmoji('b.test');
				await bob.client.request('notes/reactions/create', { noteId: noteInB.id, reaction: `:${emoji.name}:` });
				await sleep();

				const reactions = await alice.client.request('notes/reactions', { noteId: note.id });
				strictEqual(reactions.length, 1);
				strictEqual(reactions[0].type, '❤');
			});

			/**
			 * TODO: this may be unexpected behavior?
			 *       @see https://github.com/misskey-dev/misskey/issues/12409
			 */
			test('Even if nonSensitiveOnly, remote users can react with sensitive emoji, and it is not converted', async () => {
				const note = (await alice.client.request('notes/create', { text: 'a', reactionAcceptance: 'nonSensitiveOnly' })).createdNote;
				const noteInB = await resolveRemoteNote('a.test', note.id, bob);
				const emoji = await addCustomEmoji('b.test', { isSensitive: true });
				await bob.client.request('notes/reactions/create', { noteId: noteInB.id, reaction: `:${emoji.name}:` });
				await sleep();

				const reactions = await alice.client.request('notes/reactions', { noteId: note.id });
				strictEqual(reactions.length, 1);
				strictEqual(reactions[0].type, `:${emoji.name}@b.test:`);
			});
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
				const noteInA = await resolveRemoteNote('b.test', note.id, carol);
				await carol.client.request('notes/polls/vote', { noteId: noteInA.id, choice: 0 });
				await sleep();

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

				await bobRemoteFollower.client.request('following/create', { userId: bobInA.id });
				await sleep();
			});

			test('A vote in Bob\'s server is delivered to Bob\'s remote followers', async () => {
				const note = (await bob.client.request('notes/create', { poll: { choices: ['inu', 'neko'] } })).createdNote;
				// NOTE: resolve before voting
				const noteInA = await resolveRemoteNote('b.test', note.id, bobRemoteFollower);
				await localVoter.client.request('notes/polls/vote', { noteId: note.id, choice: 0 });
				await sleep();

				const noteAfterVote = await bobRemoteFollower.client.request('notes/show', { noteId: noteInA.id });
				assert(noteAfterVote.poll != null);
				strictEqual(noteAfterVote.poll.choices[0].votes, 1);
				strictEqual(noteAfterVote.poll.choices[1].votes, 0);
			});
		});
	});
});
