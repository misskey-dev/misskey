import { rejects, strictEqual } from 'node:assert';
import test, { before, describe } from 'node:test';
import { createAccount, deepStrictEqualWithExcludedFields, fetchAdmin, resolveRemoteUser } from './utils.js';

const [
	[, aAdminClient],
	[, bAdminClient],
] = await Promise.all([
	fetchAdmin('a.test'),
	fetchAdmin('b.test'),
]);

describe('User', () => {
	describe('Profile', async () => {
		describe('Consistency of profile', async () => {
			const [alice] = await createAccount('a.test', aAdminClient);
			const [
				[, aliceWatcherClient],
				[, aliceWatcherInBServerClient],
			] = await Promise.all([
				createAccount('a.test', aAdminClient),
				createAccount('b.test', bAdminClient),
			]);

			const aliceInAServer = await aliceWatcherClient.request('users/show', { userId: alice.id });

			const resolved = await resolveRemoteUser(`https://a.test/@${aliceInAServer.username}`, aliceWatcherInBServerClient);

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

		describe('isCat is federated', async () => {
			const [, aliceClient, { username: aliceUsername }] = await createAccount('a.test', aAdminClient);
			const [, bobClient] = await createAccount('b.test', bAdminClient);
			const aliceInBServer = await resolveRemoteUser(`https://a.test/@${aliceUsername}`, bobClient);
			await test('Not isCat for default', () => {
				strictEqual(aliceInBServer.isCat, false);
			});

			await test('Becoming a cat is sent to their followers', async () => {
				await bobClient.request('following/create', { userId: aliceInBServer.id });
				await new Promise(resolve => setTimeout(resolve, 1000));

				await aliceClient.request('i/update', { isCat: true });
				await new Promise(resolve => setTimeout(resolve, 1000));

				const res = await bobClient.request('users/show', { userId: aliceInBServer.id });
				strictEqual(res.isCat, true);
			});
		});
	});

	describe('Follow / Unfollow', async () => {
		const [alice, aliceClient, { username: aliceUsername }] = await createAccount('a.test', aAdminClient);
		const [bob, bobClient, { username: bobUsername }] = await createAccount('b.test', bAdminClient);

		const [bobInAServer, aliceInBServer] = await Promise.all([
			resolveRemoteUser(`https://b.test/@${bobUsername}`, aliceClient),
			resolveRemoteUser(`https://a.test/@${aliceUsername}`, bobClient),
		]);

		await describe('Follow a.test ==> b.test', async () => {
			before(async () => {
				await aliceClient.request('following/create', { userId: bobInAServer.id });

				await new Promise(resolve => setTimeout(resolve, 1000));
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

		await describe('Unfollow a.test ==> b.test', async () => {
			before(async () => {
				await aliceClient.request('following/delete', { userId: bobInAServer.id });

				await new Promise(resolve => setTimeout(resolve, 1000));
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

	describe('Follow requests', async () => {
		const [alice, aliceClient, { username: aliceUsername }] = await createAccount('a.test', aAdminClient);
		const [bob, bobClient, { username: bobUsername }] = await createAccount('b.test', bAdminClient);

		const [bobInAServer, aliceInBServer] = await Promise.all([
			resolveRemoteUser(`https://b.test/@${bobUsername}`, aliceClient),
			resolveRemoteUser(`https://a.test/@${aliceUsername}`, bobClient),
		]);

		await aliceClient.request('i/update', { isLocked: true });

		await test('Send follow request from Bob to Alice and cancel', async () => {
			await bobClient.request('following/create', { userId: aliceInBServer.id });
			await new Promise(resolve => setTimeout(resolve, 1000));

			await test('Alice should have a request', async () => {
				const requests = await aliceClient.request('following/requests/list', {});
				strictEqual(requests.length, 1);
				strictEqual(requests[0].followee.id, alice.id);
				strictEqual(requests[0].follower.id, bobInAServer.id);
			});

			await bobClient.request('following/requests/cancel', { userId: aliceInBServer.id });
			await new Promise(resolve => setTimeout(resolve, 1000));

			await test('Alice should have no requests', async () => {
				const requests = await aliceClient.request('following/requests/list', {});
				strictEqual(requests.length, 0);
			});
		});

		await test('Send follow request from Bob to Alice and reject', async () => {
			await bobClient.request('following/create', { userId: aliceInBServer.id });
			await new Promise(resolve => setTimeout(resolve, 1000));

			await aliceClient.request('following/requests/reject', { userId: bobInAServer.id });
			await new Promise(resolve => setTimeout(resolve, 1000));

			await test('Bob should have no requests', async () => {
				await rejects(
					async () => await bobClient.request('following/requests/cancel', { userId: aliceInBServer.id }),
					(err: any) => {
						strictEqual(err.code, 'FOLLOW_REQUEST_NOT_FOUND');
						return true;
					},
				);
			});

			await test('Bob doesn\'t follow Alice', async () => {
				const following = await bobClient.request('users/following', { userId: bob.id });
				strictEqual(following.length, 0);
			});
		});

		await test('Send follow request from Bob to Alice and accept', async () => {
			await bobClient.request('following/create', { userId: aliceInBServer.id });
			await new Promise(resolve => setTimeout(resolve, 1000));

			await aliceClient.request('following/requests/accept', { userId: bobInAServer.id });
			await new Promise(resolve => setTimeout(resolve, 1000));

			await test('Bob follows Alice', async () => {
				const following = await bobClient.request('users/following', { userId: bob.id });
				strictEqual(following.length, 1);
				strictEqual(following[0].followeeId, aliceInBServer.id);
				strictEqual(following[0].followerId, bob.id);
			});
		});
	});
});
