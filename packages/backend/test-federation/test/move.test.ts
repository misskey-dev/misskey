import assert, { strictEqual } from 'node:assert';
import * as Misskey from 'misskey-js';
import { createAccount, sleep } from './utils.js';

describe('Move', () => {
	test('Minimum move', async () => {
		const [, aliceClient, { username: aliceUsername }] = await createAccount('a.test');
		const [, bobClient, { username: bobUsername }] = await createAccount('b.test');

		await bobClient.request('i/update', { alsoKnownAs: [`@${aliceUsername}@a.test`] });
		await aliceClient.request('i/move', { moveToAccount: `@${bobUsername}@b.test` });
	});

	/** @see https://github.com/misskey-dev/misskey/issues/11320 */
	describe('Following relation is transferred after move', () => {
		let alice: Misskey.entities.SigninResponse, aliceClient: Misskey.api.APIClient, aliceUsername: string;
		let bob: Misskey.entities.SigninResponse, bobClient: Misskey.api.APIClient, bobUsername: string;
		let carol: Misskey.entities.SigninResponse, carolClient: Misskey.api.APIClient, carolUsername: string;

		beforeAll(async () => {
			[alice, aliceClient, { username: aliceUsername }] = await createAccount('a.test');
			[bob, bobClient, { username: bobUsername }] = await createAccount('b.test');
			[carol, carolClient, { username: carolUsername }] = await createAccount('a.test');

			// Follow @carol@a.test ==> @alice@a.test
			await carolClient.request('following/create', { userId: alice.id });

			// Move @alice@a.test ==> @bob@b.test
			await bobClient.request('i/update', { alsoKnownAs: [`@${aliceUsername}@a.test`] });
			await aliceClient.request('i/move', { moveToAccount: `@${bobUsername}@b.test` });
			await sleep(3000);
		});

		test('Check from follower', async () => {
			const following = await carolClient.request('users/following', { userId: carol.id });
			strictEqual(following.length, 2);
			const followees = following.map(({ followee }) => followee);
			assert(followees.every(followee => followee != null));
			assert(followees.some(({ id, url }) => id === alice.id && url === null));
			assert(followees.some(({ url }) => url === `https://b.test/@${bobUsername}`));
		});

		test('Check from followee', async () => {
			const followers = await bobClient.request('users/followers', { userId: bob.id });
			strictEqual(followers.length, 1);
			const follower = followers[0].follower;
			assert(follower != null);
			strictEqual(follower.url, `https://a.test/@${carolUsername}`);
		});
	});
});
