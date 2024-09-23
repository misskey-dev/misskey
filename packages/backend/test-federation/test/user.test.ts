import { rejects, strictEqual } from 'node:assert';
import * as Misskey from 'misskey-js';
import { createAccount, deepStrictEqualWithExcludedFields, fetchAdmin, resolveRemoteNote, resolveRemoteUser, sleep } from './utils.js';

const [
	[, aAdminClient],
	[, bAdminClient],
] = await Promise.all([
	fetchAdmin('a.test'),
	fetchAdmin('b.test'),
]);

describe('User', () => {
	describe('Profile', () => {
		describe('Consistency of profile', () => {
			let alice: Misskey.entities.SigninResponse;
			let aliceWatcherClient: Misskey.api.APIClient;
			let aliceWatcherInBServerClient: Misskey.api.APIClient;

			beforeAll(async () => {
				[alice] = await createAccount('a.test', aAdminClient);
				[
					[, aliceWatcherClient],
					[, aliceWatcherInBServerClient],
				] = await Promise.all([
					createAccount('a.test', aAdminClient),
					createAccount('b.test', bAdminClient),
				]);
			});

			test('Check consistency', async () => {
				const aliceInAServer = await aliceWatcherClient.request('users/show', { userId: alice.id });
				const resolved = await resolveRemoteUser('a.test', aliceInAServer.id, aliceWatcherInBServerClient);
				const aliceInBServer = await aliceWatcherInBServerClient.request('users/show', { userId: resolved.id });

				// console.log(`a.test: ${JSON.stringify(aliceInAServer, null, '\t')}`);
				// console.log(`b.test: ${JSON.stringify(aliceInBServer, null, '\t')}`);

				deepStrictEqualWithExcludedFields(aliceInAServer, aliceInBServer, [
					'id',
					'host',
					'avatarUrl',
					'instance',
					'badgeRoles',
					'url',
					'uri',
					'createdAt',
					'lastFetchedAt',
					'publicReactions',
				]);
			});
		});

		describe('isCat is federated', () => {
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

			test('Not isCat for default', () => {
				strictEqual(aliceInBServer.isCat, false);
			});

			test('Becoming a cat is sent to their followers', async () => {
				await bobClient.request('following/create', { userId: aliceInBServer.id });
				await sleep(1000);

				await aliceClient.request('i/update', { isCat: true });
				await sleep(1000);

				const res = await bobClient.request('users/show', { userId: aliceInBServer.id });
				strictEqual(res.isCat, true);
			});
		});

		describe('Pinning Notes', () => {
			let alice: Misskey.entities.SigninResponse, aliceClient: Misskey.api.APIClient;
			let bob: Misskey.entities.SigninResponse, bobClient: Misskey.api.APIClient;
			let aliceInBServer: Misskey.entities.UserDetailedNotMe;

			beforeAll(async () => {
				[alice, aliceClient] = await createAccount('a.test', aAdminClient);
				[bob, bobClient] = await createAccount('b.test', bAdminClient);
				aliceInBServer = await resolveRemoteUser('a.test', alice.id, bobClient);

				await bobClient.request('following/create', { userId: aliceInBServer.id });
			});

			test('Pinning localOnly Note is not delivered', async () => {
				const note = (await aliceClient.request('notes/create', { text: 'a', localOnly: true })).createdNote;
				await aliceClient.request('i/pin', { noteId: note.id });
				await sleep(1000);

				const _aliceInBServer = await bobClient.request('users/show', { userId: aliceInBServer.id });
				strictEqual(_aliceInBServer.pinnedNoteIds.length, 0);
			});

			test('Pinning followers-only Note is not delivered', async () => {
				const note = (await aliceClient.request('notes/create', { text: 'a', visibility: 'followers' })).createdNote;
				await aliceClient.request('i/pin', { noteId: note.id });
				await sleep(1000);

				const _aliceInBServer = await bobClient.request('users/show', { userId: aliceInBServer.id });
				strictEqual(_aliceInBServer.pinnedNoteIds.length, 0);
			});

			let pinnedNote: Misskey.entities.Note;

			test('Pinning normal Note is delivered', async () => {
				pinnedNote = (await aliceClient.request('notes/create', { text: 'a' })).createdNote;
				await aliceClient.request('i/pin', { noteId: pinnedNote.id });
				await sleep(1000);

				const _aliceInBServer = await bobClient.request('users/show', { userId: aliceInBServer.id });
				strictEqual(_aliceInBServer.pinnedNoteIds.length, 1);
				const pinnedNoteInBServer = await resolveRemoteNote('a.test', pinnedNote.id, bobClient);
				strictEqual(_aliceInBServer.pinnedNotes[0].id, pinnedNoteInBServer.id);
			});

			test('Unpinning normal Note is delivered', async () => {
				await aliceClient.request('i/unpin', { noteId: pinnedNote.id });
				await sleep(1000);

				const _aliceInBServer = await bobClient.request('users/show', { userId: aliceInBServer.id });
				strictEqual(_aliceInBServer.pinnedNoteIds.length, 0);
			});
		});
	});

	describe('Follow / Unfollow', () => {
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

		describe('Follow a.test ==> b.test', () => {
			beforeAll(async () => {
				await aliceClient.request('following/create', { userId: bobInAServer.id });

				await sleep(1000);
			});

			test('Check consistency with `users/following` and `users/followers` endpoints', async () => {
				await Promise.all([
					strictEqual(
						(await aliceClient.request('users/following', { userId: alice.id }))
							.some(v => v.followeeId === bobInAServer.id),
						true,
					),
					strictEqual(
						(await bobClient.request('users/followers', { userId: bob.id }))
							.some(v => v.followerId === aliceInBServer.id),
						true,
					),
				]);
			});
		});

		describe('Unfollow a.test ==> b.test', () => {
			beforeAll(async () => {
				await aliceClient.request('following/delete', { userId: bobInAServer.id });

				await sleep(1000);
			});

			test('Check consistency with `users/following` and `users/followers` endpoints', async () => {
				await Promise.all([
					strictEqual(
						(await aliceClient.request('users/following', { userId: alice.id }))
							.some(v => v.followeeId === bobInAServer.id),
						false,
					),
					strictEqual(
						(await bobClient.request('users/followers', { userId: bob.id }))
							.some(v => v.followerId === aliceInBServer.id),
						false,
					),
				]);
			});
		});
	});

	describe('Follow requests', () => {
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

			await aliceClient.request('i/update', { isLocked: true });
		});

		describe('Send follow request from Bob to Alice and cancel', () => {
			describe('Bob sends follow request to Alice', () => {
				beforeAll(async () => {
					await bobClient.request('following/create', { userId: aliceInBServer.id });
					await sleep(1000);
				});

				test('Alice should have a request', async () => {
					const requests = await aliceClient.request('following/requests/list', {});
					strictEqual(requests.length, 1);
					strictEqual(requests[0].followee.id, alice.id);
					strictEqual(requests[0].follower.id, bobInAServer.id);
				});
			});

			describe('Alice cancels it', () => {
				beforeAll(async () => {
					await bobClient.request('following/requests/cancel', { userId: aliceInBServer.id });
					await sleep(1000);
				});

				test('Alice should have no requests', async () => {
					const requests = await aliceClient.request('following/requests/list', {});
					strictEqual(requests.length, 0);
				});
			});
		});

		describe('Send follow request from Bob to Alice and reject', () => {
			beforeAll(async () => {
				await bobClient.request('following/create', { userId: aliceInBServer.id });
				await sleep(1000);

				await aliceClient.request('following/requests/reject', { userId: bobInAServer.id });
				await sleep(1000);
			});

			test('Bob should have no requests', async () => {
				await rejects(
					async () => await bobClient.request('following/requests/cancel', { userId: aliceInBServer.id }),
					(err: any) => {
						strictEqual(err.code, 'FOLLOW_REQUEST_NOT_FOUND');
						return true;
					},
				);
			});

			test('Bob doesn\'t follow Alice', async () => {
				const following = await bobClient.request('users/following', { userId: bob.id });
				strictEqual(following.length, 0);
			});
		});

		describe('Send follow request from Bob to Alice and accept', () => {
			beforeAll(async () => {
				await bobClient.request('following/create', { userId: aliceInBServer.id });
				await sleep(1000);

				await aliceClient.request('following/requests/accept', { userId: bobInAServer.id });
				await sleep(1000);
			});

			test('Bob follows Alice', async () => {
				const following = await bobClient.request('users/following', { userId: bob.id });
				strictEqual(following.length, 1);
				strictEqual(following[0].followeeId, aliceInBServer.id);
				strictEqual(following[0].followerId, bob.id);
			});
		});
	});
});
