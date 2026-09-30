import assert, { rejects, strictEqual } from 'node:assert';
import { describe, test, vi } from 'vitest';
import * as Misskey from 'misskey-js';
import { createAccount, deepStrictEqualWithExcludedFields, fetchAdmin, resolveRemoteNote, resolveRemoteUser } from './utils.js';

const [aAdmin, bAdmin] = await Promise.all([
	fetchAdmin('a.test'),
	fetchAdmin('b.test'),
]);

describe('User Suspension', () => {
	describe('Suspension', () => {
		describe('Check suspend/unsuspend consistency', () => {
			test('keeps following data while hiding relationships during remote suspension', async () => {
				const [alice, bob] = await Promise.all([
					createAccount('a.test'),
					createAccount('b.test'),
				]);

				const [bobInA, aliceInB] = await Promise.all([
					resolveRemoteUser('b.test', bob.id, alice),
					resolveRemoteUser('a.test', alice.id, bob),
				]);

				await bob.client.request('following/create', { userId: aliceInB.id });
				await vi.waitFor(async () => {
					const followers = await alice.client.request('users/followers', { userId: alice.id });
					strictEqual(followers.length, 1);
				});

				await aAdmin.client.request('admin/suspend-user', { userId: alice.id });
				await vi.waitFor(async () => {
					const aliceInBRaw = await bAdmin.client.request('admin/show-user', { userId: aliceInB.id });
					strictEqual(aliceInBRaw.isRemoteSuspended, true);
				});

				await rejects(
					async () => await bob.client.request('following/create', { userId: aliceInB.id }),
					(err: any) => {
						strictEqual(err.code, 'ALREADY_FOLLOWING');
						return true;
					},
				);

				await aAdmin.client.request('admin/unsuspend-user', { userId: alice.id });
				await vi.waitFor(async () => {
					const aliceInBRenewed = await bAdmin.client.request('admin/show-user', { userId: aliceInB.id });
					strictEqual(aliceInBRenewed.isRemoteSuspended, false);
				});

				await rejects(
					async () => await bob.client.request('following/create', { userId: aliceInB.id }),
					(err: any) => {
						strictEqual(err.code, 'ALREADY_FOLLOWING');
						return true;
					},
				);

				await alice.client.request('following/create', { userId: bobInA.id });
				await vi.waitFor(async () => {
					const bobFollowers = await bob.client.request('users/followers', { userId: bob.id });
					strictEqual(bobFollowers.length, 1);
					assert(bobFollowers[0].follower != null);
					const renewedAliceInB = bobFollowers[0].follower;
					assert(aliceInB.username === renewedAliceInB.username);
					assert(aliceInB.host === renewedAliceInB.host);
					assert(aliceInB.id === renewedAliceInB.id);
				});

				await aAdmin.client.request('admin/suspend-user', { userId: alice.id });
				await vi.waitFor(async () => {
					const aliceInBRaw = await bAdmin.client.request('admin/show-user', { userId: aliceInB.id });
					strictEqual(aliceInBRaw.isRemoteSuspended, true);
					const bobFollowers = await bob.client.request('users/followers', { userId: bob.id });
					strictEqual(bobFollowers.length, 0);
				});
			});
		});
	});
});
