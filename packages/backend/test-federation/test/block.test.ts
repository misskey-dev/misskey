import { deepStrictEqual, rejects, strictEqual } from 'node:assert';
import * as Misskey from 'misskey-js';
import { createAccount, fetchAdmin, resolveRemoteNote, resolveRemoteUser, sleep } from './utils.js';

const [
	[, aAdminClient],
	[, bAdminClient],
] = await Promise.all([
	fetchAdmin('a.test'),
	fetchAdmin('b.test'),
]);

describe('Blocking', () => {
	describe('Check follow', () => {
		let alice: Misskey.entities.SigninResponse, aliceClient: Misskey.api.APIClient;
		let bob: Misskey.entities.SigninResponse, bobClient: Misskey.api.APIClient;
		let bobInAServer: Misskey.entities.UserDetailedNotMe, aliceInBServer: Misskey.entities.UserDetailedNotMe;

		beforeAll(async () => {
			[alice, aliceClient] = await createAccount('a.test', aAdminClient);
			[bob, bobClient] = await createAccount('b.test', bAdminClient);

			[bobInAServer, aliceInBServer] = await Promise.all([
				resolveRemoteUser('b.test', bob.id, aliceClient),
				resolveRemoteUser('a.test', alice.id, bobClient),
			]);
		});

		test('Cannot follow if blocked', async () => {
			await aliceClient.request('blocking/create', { userId: bobInAServer.id });
			await sleep(1000);
			await rejects(
				async () => await bobClient.request('following/create', { userId: aliceInBServer.id }),
				(err: any) => {
					strictEqual(err.code, 'BLOCKED');
					return true;
				},
			);

			const following = await bobClient.request('users/following', { userId: bob.id });
			strictEqual(following.length, 0);
			const followers = await aliceClient.request('users/followers', { userId: alice.id });
			strictEqual(followers.length, 0);
		});

		// FIXME: this is invalid case
		test('Cannot follow even if unblocked', async () => {
			// unblock here
			await aliceClient.request('blocking/delete', { userId: bobInAServer.id });
			await sleep(1000);

			// TODO: why still being blocked?
			await rejects(
				async () => await bobClient.request('following/create', { userId: aliceInBServer.id }),
				(err: any) => {
					strictEqual(err.code, 'BLOCKED');
					return true;
				},
			);
		});

		test.skip('Can follow if unblocked', async () => {
			await aliceClient.request('blocking/delete', { userId: bobInAServer.id });
			await sleep(1000);

			await bobClient.request('following/create', { userId: aliceInBServer.id });
			await sleep(1000);

			const following = await bobClient.request('users/following', { userId: bob.id });
			strictEqual(following.length, 1);
			const followers = await aliceClient.request('users/followers', { userId: alice.id });
			strictEqual(followers.length, 1);
		});

		test.skip('Remove follower when block them', async () => {
			test('before block', async () => {
				const following = await bobClient.request('users/following', { userId: bob.id });
				strictEqual(following.length, 1);
				const followers = await aliceClient.request('users/followers', { userId: alice.id });
				strictEqual(followers.length, 1);
			});

			await aliceClient.request('blocking/create', { userId: bobInAServer.id });
			await sleep(1000);

			test('after block', async () => {
				const following = await bobClient.request('users/following', { userId: bob.id });
				strictEqual(following.length, 0);
				const followers = await aliceClient.request('users/followers', { userId: alice.id });
				strictEqual(followers.length, 0);
			});
		});
	});

	describe('Check reply', () => {
		let alice: Misskey.entities.SigninResponse, aliceClient: Misskey.api.APIClient;
		let bob: Misskey.entities.SigninResponse, bobClient: Misskey.api.APIClient;
		let bobInAServer: Misskey.entities.UserDetailedNotMe, aliceInBServer: Misskey.entities.UserDetailedNotMe;

		beforeAll(async () => {
			[alice, aliceClient] = await createAccount('a.test', aAdminClient);
			[bob, bobClient] = await createAccount('b.test', bAdminClient);

			[bobInAServer, aliceInBServer] = await Promise.all([
				resolveRemoteUser('b.test', bob.id, aliceClient),
				resolveRemoteUser('a.test', alice.id, bobClient),
			]);
		});

		test('Cannot reply if blocked', async () => {
			await aliceClient.request('blocking/create', { userId: bobInAServer.id });
			await sleep(1000);

			const note = (await aliceClient.request('notes/create', { text: 'a' })).createdNote;
			const resolvedNote = await resolveRemoteNote('a.test', note.id, bobClient);
			await rejects(
				async () => await bobClient.request('notes/create', { text: 'b', replyId: resolvedNote.id }),
				(err: any) => {
					strictEqual(err.code, 'YOU_HAVE_BEEN_BLOCKED');
					return true;
				},
			);
		});

		test('Can reply if unblocked', async () => {
			await aliceClient.request('blocking/delete', { userId: bobInAServer.id });
			await sleep(1000);

			const note = (await aliceClient.request('notes/create', { text: 'a' })).createdNote;
			const resolvedNote = await resolveRemoteNote('a.test', note.id, bobClient);
			const reply = (await bobClient.request('notes/create', { text: 'b', replyId: resolvedNote.id })).createdNote;

			await resolveRemoteNote('b.test', reply.id, aliceClient);
		});
	});

	describe('Check reaction', () => {
		let alice: Misskey.entities.SigninResponse, aliceClient: Misskey.api.APIClient;
		let bob: Misskey.entities.SigninResponse, bobClient: Misskey.api.APIClient;
		let bobInAServer: Misskey.entities.UserDetailedNotMe, aliceInBServer: Misskey.entities.UserDetailedNotMe;

		beforeAll(async () => {
			[alice, aliceClient] = await createAccount('a.test', aAdminClient);
			[bob, bobClient] = await createAccount('b.test', bAdminClient);

			[bobInAServer, aliceInBServer] = await Promise.all([
				resolveRemoteUser('b.test', bob.id, aliceClient),
				resolveRemoteUser('a.test', alice.id, bobClient),
			]);
		});

		test('Cannot reply if blocked', async () => {
			await aliceClient.request('blocking/create', { userId: bobInAServer.id });
			await sleep(1000);

			const note = (await aliceClient.request('notes/create', { text: 'a' })).createdNote;
			const resolvedNote = await resolveRemoteNote('a.test', note.id, bobClient);
			await rejects(
				async () => await bobClient.request('notes/reactions/create', { noteId: resolvedNote.id, reaction: '😅' }),
				(err: any) => {
					strictEqual(err.code, 'YOU_HAVE_BEEN_BLOCKED');
					return true;
				},
			);
		});

		// FIXME: this is invalid case
		test('Cannot reply even if unblocked', async () => {
			// unblock here
			await aliceClient.request('blocking/delete', { userId: bobInAServer.id });
			await sleep(1000);

			const note = (await aliceClient.request('notes/create', { text: 'a' })).createdNote;
			const resolvedNote = await resolveRemoteNote('a.test', note.id, bobClient);

			// TODO: why still being blocked?
			await rejects(
				async () => await bobClient.request('notes/reactions/create', { noteId: resolvedNote.id, reaction: '😅' }),
				(err: any) => {
					strictEqual(err.code, 'YOU_HAVE_BEEN_BLOCKED');
					return true;
				},
			);
		});

		test.skip('Can reply if unblocked', async () => {
			await aliceClient.request('blocking/delete', { userId: bobInAServer.id });
			await sleep(1000);

			const note = (await aliceClient.request('notes/create', { text: 'a' })).createdNote;
			const resolvedNote = await resolveRemoteNote('a.test', note.id, bobClient);
			await bobClient.request('notes/reactions/create', { noteId: resolvedNote.id, reaction: '😅' });

			const _note = await aliceClient.request('notes/show', { noteId: note.id });
			deepStrictEqual(_note.reactions, { '😅': 1 });
		});
	});
});
