import { describe, test, beforeAll } from 'vitest';
import assert, { strictEqual } from 'node:assert';
import { createAccount, type LoginUser, resolveRemoteUser, waitForFollowRelation, waitForFollowers, waitForFollowing } from './utils.js';

describe('Move', () => {
	test('Minimum move', async () => {
		const [alice, bob] = await Promise.all([
			createAccount('a.test'),
			createAccount('b.test'),
		]);

		await bob.client.request('i/update', { alsoKnownAs: [`@${alice.username}@a.test`] });
		await alice.client.request('i/move', { moveToAccount: `@${bob.username}@b.test` });
	});

	/** @see https://github.com/misskey-dev/misskey/issues/18019 */
	test('Following relation on the destination server is transferred after move', async () => {
		const [alice, bob, carol] = await Promise.all([
			createAccount('a.test'),
			createAccount('b.test'),
			createAccount('b.test'),
		]);

		// Follow @carol@b.test ==> @alice@a.test and wait for Follow/Accept.
		const remoteAlice = await resolveRemoteUser('a.test', alice.id, carol);
		await carol.client.request('following/create', { userId: remoteAlice.id });
		await waitForFollowRelation(carol, alice, 1);

		// Move @alice@a.test ==> @bob@b.test.
		await bob.client.request('i/update', { alsoKnownAs: [`@${alice.username}@a.test`] });
		await alice.client.request('i/move', { moveToAccount: `@${bob.username}@b.test` });

		await waitForFollowing(carol, 2);
		await waitForFollowers(bob, 1);

		const following = await carol.client.request('users/following', { userId: carol.id });
		strictEqual(following.length, 2);
		assert(following.some(({ followee }) => followee?.id === bob.id && followee.url === null));
		assert(following.some(({ followee }) => followee?.id === remoteAlice.id));

		const followers = await bob.client.request('users/followers', { userId: bob.id });
		strictEqual(followers.length, 1);
		const follower = followers[0].follower;
		assert(follower != null);
		strictEqual(follower.id, carol.id);
		strictEqual(follower.url, null);
	});

	/** @see https://github.com/misskey-dev/misskey/issues/11320 */
	describe('Following relation is transferred after move', () => {
		let alice: LoginUser, bob: LoginUser, carol: LoginUser;

		beforeAll(async () => {
			[alice, bob] = await Promise.all([
				createAccount('a.test'),
				createAccount('b.test'),
			]);
			carol = await createAccount('a.test');

			// Follow @carol@a.test ==> @alice@a.test
			await carol.client.request('following/create', { userId: alice.id });

			// Move @alice@a.test ==> @bob@b.test
			await bob.client.request('i/update', { alsoKnownAs: [`@${alice.username}@a.test`] });
			await alice.client.request('i/move', { moveToAccount: `@${bob.username}@b.test` });

			await waitForFollowing(carol, 2);
			await waitForFollowers(bob, 1);
		});

		test('Check from follower', async () => {
			const following = await carol.client.request('users/following', { userId: carol.id });
			strictEqual(following.length, 2);
			const followees = following.map(({ followee }) => followee);
			assert(followees.every(followee => followee != null));
			assert(followees.some(({ id, url }) => id === alice.id && url === null));
			assert(followees.some(({ url }) => url === `https://b.test/@${bob.username}`));
		});

		test('Check from followee', async () => {
			const followers = await bob.client.request('users/followers', { userId: bob.id });
			strictEqual(followers.length, 1);
			const follower = followers[0].follower;
			assert(follower != null);
			strictEqual(follower.url, `https://a.test/@${carol.username}`);
		});
	});
});
