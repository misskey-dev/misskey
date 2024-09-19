import { deepStrictEqual, strictEqual } from 'node:assert';
import test, { before, describe } from 'node:test';
import * as Misskey from 'misskey-js';
import { createAccount, fetchAdmin, resolveRemoteAccount } from './utils.js';

const [
	[, aAdminClient],
	[, bAdminClient],
] = await Promise.all([
	fetchAdmin('a.local'),
	fetchAdmin('b.local'),
]);

describe('User', () => {
	describe('Profile', async () => {
		describe('Consistency of profile', async () => {
			const [alice] = await createAccount('a.local', aAdminClient);
			const [
				[, aliceWatcherClient],
				[, aliceWatcherInBServerClient],
			] = await Promise.all([
				createAccount('a.local', aAdminClient),
				createAccount('b.local', bAdminClient),
			]);

			const aliceInAServer = await aliceWatcherClient.request('users/show', { userId: alice.id });

			const resolved = await aliceWatcherInBServerClient.request('ap/show', {
				uri: `https://a.local/@${aliceInAServer.username}`,
			});
			strictEqual(resolved.type, 'User');

			const aliceInBServer = await aliceWatcherInBServerClient.request('users/show', { userId: resolved.object.id });

			// console.log(`a.local: ${JSON.stringify(aliceInAServer, null, '\t')}`);
			// console.log(`b.local: ${JSON.stringify(aliceInBServer, null, '\t')}`);

			const toBeDeleted: (keyof Misskey.entities.UserDetailedNotMe)[] = [
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
			];
			const _aliceInAServer: Partial<Misskey.entities.UserDetailedNotMe> = structuredClone(aliceInAServer);
			const _aliceInBServer: Partial<Misskey.entities.UserDetailedNotMe> = structuredClone(aliceInBServer);
			for (const alice of [_aliceInAServer, _aliceInBServer]) {
				for (const field of toBeDeleted) {
					delete alice[field];
				}
			}

			deepStrictEqual(_aliceInAServer, _aliceInBServer);
		});
	});

	describe('Follow / Unfollow', async () => {
		const [alice, aliceClient, { username: aliceUsername }] = await createAccount('a.local', aAdminClient);
		const [bob, bobClient, { username: bobUsername }] = await createAccount('b.local', bAdminClient);

		const aliceAcct = `@${aliceUsername}@a.local`;
		const bobAcct = `@${bobUsername}@b.local`;

		const [bobInAServer, aliceInBServer] = await Promise.all([
			resolveRemoteAccount(aliceAcct, bobAcct, aliceClient),
			resolveRemoteAccount(bobAcct, aliceAcct, bobClient),
		]);

		await describe('Follow a.local ==> b.local', async () => {
			before(async () => {
				console.log(`Following ${bobAcct} from ${aliceAcct} ...`);
				await aliceClient.request('following/create', { userId: bobInAServer.object.id });
				console.log(`Followed ${bobAcct} from ${aliceAcct}`);

				// wait for 1 secound
				await new Promise(resolve => setTimeout(resolve, 1000));
			});

			test('Check consistency with `users/following` and `users/followers` endpoints', async () => {
				await Promise.all([
					strictEqual(
						(await aliceClient.request('users/following', { userId: alice.id }))
							.some(v => v.followeeId === bobInAServer.object.id),
						true,
					),
					strictEqual(
						(await bobClient.request('users/followers', { userId: bob.id }))
							.some(v => v.followerId === aliceInBServer.object.id),
						true,
					),
				]);
			});
		});

		await describe('Unfollow a.local ==> b.local', async () => {
			before(async () => {
				console.log(`Unfollowing ${bobAcct} from ${aliceAcct} ...`);
				await aliceClient.request('following/delete', { userId: bobInAServer.object.id });
				console.log(`Unfollowed ${bobAcct} from ${aliceAcct}`);

				// wait for 1 secound
				await new Promise(resolve => setTimeout(resolve, 1000));
			});

			test('Check consistency with `users/following` and `users/followers` endpoints', async () => {
				await Promise.all([
					strictEqual(
						(await aliceClient.request('users/following', { userId: alice.id }))
							.some(v => v.followeeId === bobInAServer.object.id),
						false,
					),
					strictEqual(
						(await bobClient.request('users/followers', { userId: bob.id }))
							.some(v => v.followerId === aliceInBServer.object.id),
						false,
					),
				]);
			});
		});
	});
});
