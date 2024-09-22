import assert, { rejects, strictEqual } from 'node:assert';
import * as Misskey from 'misskey-js';
import { createAccount, deepStrictEqualWithExcludedFields, fetchAdmin, resolveRemoteNote, resolveRemoteUser, uploadFile } from './utils.js';

const [
	[, aAdminClient],
	[, bAdminClient],
] = await Promise.all([
	fetchAdmin('a.test'),
	fetchAdmin('b.test'),
]);

describe('Note', () => {
	let alice: Misskey.entities.SigninResponse, aliceClient: Misskey.api.APIClient, aliceUsername: string;
	let bob: Misskey.entities.SigninResponse, bobClient: Misskey.api.APIClient, bobUsername: string;
	let bobInAServer: Misskey.entities.UserDetailedNotMe, aliceInBServer: Misskey.entities.UserDetailedNotMe;

	beforeAll(async () => {
		[alice, aliceClient, { username: aliceUsername }] = await createAccount('a.test', aAdminClient);
		[bob, bobClient, { username: bobUsername }] = await createAccount('b.test', bAdminClient);

		[bobInAServer, aliceInBServer] = await Promise.all([
			resolveRemoteUser(`https://b.test/@${bobUsername}`, aliceClient),
			resolveRemoteUser(`https://a.test/@${aliceUsername}`, bobClient),
		]);
	});

	describe('Note content', () => {
		test('Consistency of Public Note', async () => {
			const image = await uploadFile('a.test', '../../test/resources/192.jpg', alice.i);
			const note = (await aliceClient.request('notes/create', {
				text: 'I am Alice!',
				fileIds: [image.id],
				poll: {
					choices: ['neko', 'inu'],
					multiple: false,
					expiredAfter: 60 * 60 * 1000,
				},
			})).createdNote;

			const resolvedNote = await resolveRemoteNote(`https://a.test/notes/${note.id}`, bobClient);
			deepStrictEqualWithExcludedFields(note, resolvedNote, [
				'id',
				'emojis',
				/** Consistency of files is checked at {@link file://./drive.test.ts}, so let's skip. */
				'fileIds',
				'files',
				'reactionAcceptance',
				'userId',
				'user',
				'uri',
			]);
			strictEqual(aliceInBServer.id, resolvedNote.userId);
		});

		test('Consistency of reply', async () => {
			const _replyedNote = (await aliceClient.request('notes/create', {
				text: 'a',
			})).createdNote;
			const note = (await aliceClient.request('notes/create', {
				text: 'b',
				replyId: _replyedNote.id,
			})).createdNote;
			// NOTE: the repliedCount is incremented, so fetch again
			const replyedNote = await aliceClient.request('notes/show', { noteId: _replyedNote.id });
			strictEqual(replyedNote.repliesCount, 1);

			const resolvedNote = await resolveRemoteNote(`https://a.test/notes/${note.id}`, bobClient);
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

			await new Promise(resolve => setTimeout(resolve, 1000));

			const resolvedReplyedNote = await bobClient.request('notes/show', { noteId: resolvedNote.replyId });
			strictEqual(resolvedReplyedNote.repliesCount, 1);
		});

		test('Consistency of Renote', async () => {
			// NOTE: the renoteCount is not incremented, so no need to fetch again
			const renotedNote = (await aliceClient.request('notes/create', {
				text: 'a',
			})).createdNote;
			const note = (await aliceClient.request('notes/create', {
				text: 'b',
				renoteId: renotedNote.id,
			})).createdNote;

			const resolvedNote = await resolveRemoteNote(`https://a.test/notes/${note.id}`, bobClient);
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
			const note = (await aliceClient.request('notes/create', { text: 'a', localOnly: true })).createdNote;
			rejects(
				async () => await bobClient.request('ap/show', { uri: `https://a.test/notes/${note.id}` }),
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

	describe('Reaction', () => {
		test('Consistency of reaction', async () => {
			const note = (await aliceClient.request('notes/create', { text: 'a' })).createdNote;
			const resolvedNote = await resolveRemoteNote(`https://a.test/notes/${note.id}`, bobClient);
			const reaction = '😅';
			await bobClient.request('notes/reactions/create', { noteId: resolvedNote.id, reaction });
			await new Promise(resolve => setTimeout(resolve, 1000));

			const reactions = await aliceClient.request('notes/reactions', { noteId: note.id });
			strictEqual(reactions.length, 1);
			strictEqual(reactions[0].type, reaction);
			strictEqual(reactions[0].user.id, bobInAServer.id);
		});
	});
});
