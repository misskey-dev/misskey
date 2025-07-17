import assert, { rejects, strictEqual } from 'node:assert';
import * as Misskey from 'misskey-js';
import { createAccount, deepStrictEqualWithExcludedFields, fetchAdmin, type LoginUser, resolveRemoteNote, resolveRemoteUser, sleep } from './utils.js';

const [aAdmin, bAdmin] = await Promise.all([
	fetchAdmin('a.test'),
	fetchAdmin('b.test'),
]);

describe('User Suspension', () => {
	describe('Suspension', () => {
		describe('Check suspend/unsuspend consistency', () => {
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

			test('Bob follows Alice, and Alice gets suspended, there is no following relation, and Bob fails to follow again', async () => {
				await bob.client.request('following/create', { userId: aliceInB.id });
				await sleep();

				const followers = await alice.client.request('users/followers', { userId: alice.id });
				strictEqual(followers.length, 1); // followed by Bob

				await aAdmin.client.request('admin/suspend-user', { userId: alice.id });
				await sleep();

				const following = await bob.client.request('users/following', { userId: bob.id });
				strictEqual(following.length, 0); // no following relation

				await rejects(
					async () => await bob.client.request('following/create', { userId: aliceInB.id }),
					(err: any) => {
						strictEqual(err.code, 'NO_SUCH_USER');
						return true;
					},
				);
			});

			test('Alice gets unsuspended, Bob succeeds in following Alice', async () => {
				await aAdmin.client.request('admin/unsuspend-user', { userId: alice.id });
				await sleep();

				const followers = await alice.client.request('users/followers', { userId: alice.id });
				strictEqual(followers.length, 1); // FIXME: followers are not deleted??

				/**
				 * FIXME: still rejected!
				 *        seems to can't process Undo Delete activity because it is not implemented
				 *        related @see https://github.com/misskey-dev/misskey/issues/13273
				 */
				await rejects(
					async () => await bob.client.request('following/create', { userId: aliceInB.id }),
					(err: any) => {
						strictEqual(err.code, 'NO_SUCH_USER');
						return true;
					},
				);

				// FIXME: resolving also fails
				await rejects(
					async () => await resolveRemoteUser('a.test', alice.id, bob),
					(err: any) => {
						strictEqual(err.code, 'INTERNAL_ERROR');
						return true;
					},
				);
			});

			/**
			 * instead of simple unsuspension, let's tell existence by following from Alice
			 */
			test('Alice can follow Bob', async () => {
				await alice.client.request('following/create', { userId: bobInA.id });
				await sleep();

				const bobFollowers = await bob.client.request('users/followers', { userId: bob.id });
				strictEqual(bobFollowers.length, 1); // followed by Alice
				assert(bobFollowers[0].follower != null);
				const renewedaliceInB = bobFollowers[0].follower;
				assert(aliceInB.username === renewedaliceInB.username);
				assert(aliceInB.host === renewedaliceInB.host);
				assert(aliceInB.id !== renewedaliceInB.id); // TODO: Same username and host, but their ids are different! Is it OK?

				const following = await bob.client.request('users/following', { userId: bob.id });
				strictEqual(following.length, 0); // following are deleted

				// Bob tries to follow Alice
				await bob.client.request('following/create', { userId: renewedaliceInB.id });
				await sleep();

				const aliceFollowers = await alice.client.request('users/followers', { userId: alice.id });
				strictEqual(aliceFollowers.length, 1);

				// FIXME: but resolving still fails ...
				await rejects(
					async () => await resolveRemoteUser('a.test', alice.id, bob),
					(err: any) => {
						strictEqual(err.code, 'INTERNAL_ERROR');
						return true;
					},
				);
			});
		});
	});
});
