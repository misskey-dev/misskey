import test, { describe } from 'node:test';
import assert, { strictEqual } from 'node:assert';
import { createAccount, fetchAdmin } from './utils.js';

const [
	[, aAdminClient],
	[, bAdminClient],
] = await Promise.all([
	fetchAdmin('a.local'),
	fetchAdmin('b.local'),
]);

describe('Move', async () => {
	await test('Minimum move', async () => {
		const [, aliceClient, { username: aliceUsername }] = await createAccount('a.local', aAdminClient);
		const [, bobClient, { username: bobUsername }] = await createAccount('b.local', bAdminClient);

		await bobClient.request('i/update', { alsoKnownAs: [`@${aliceUsername}@a.local`] });
		await aliceClient.request('i/move', { moveToAccount: `@${bobUsername}@b.local` });
	});

	/** @see https://github.com/misskey-dev/misskey/issues/11320 */
	await test('Following relation is transferred after move', async () => {
		const [alice, aliceClient, { username: aliceUsername }] = await createAccount('a.local', aAdminClient);
		const [bob, bobClient, { username: bobUsername }] = await createAccount('b.local', bAdminClient);
		const [carol, carolClient, { username: carolUsername }] = await createAccount('a.local', aAdminClient);

		// Follow @carol@a.local ==> @alice@a.local
		await carolClient.request('following/create', { userId: alice.id });

		// Move @alice@a.local ==> @bob@b.local
		await bobClient.request('i/update', { alsoKnownAs: [`@${aliceUsername}@a.local`] });
		await aliceClient.request('i/move', { moveToAccount: `@${bobUsername}@b.local` });
		await new Promise(resolve => setTimeout(resolve, 3000));

		await test('Check from follower', async () => {
			const following = await carolClient.request('users/following', { userId: carol.id });
			strictEqual(following.length, 2);
			const followees = following.map(({ followee }) => followee);
			assert(followees.every(followee => followee != null));
			assert(followees.some(({ id, url }) => id === alice.id && url === null));
			assert(followees.some(({ url }) => url === `https://b.local/@${bobUsername}`));
		});

		await test('Check from followee', async () => {
			const followers = await bobClient.request('users/followers', { userId: bob.id });
			strictEqual(followers.length, 1);
			const follower = followers[0].follower;
			assert(follower != null);
			strictEqual(follower.url, `https://a.local/@${carolUsername}`);
		});
	});
});
