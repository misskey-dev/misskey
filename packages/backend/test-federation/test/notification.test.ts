import { deepStrictEqual, strictEqual } from 'assert';
import * as Misskey from 'misskey-js';
import { createAccount, fetchAdmin, isFired, resolveRemoteUser } from './utils.js';

const [
	[, aAdminClient],
	[, bAdminClient],
] = await Promise.all([
	fetchAdmin('a.test'),
	fetchAdmin('b.test'),
]);

describe('Notification', () => {
	let alice: Misskey.entities.SigninResponse, aliceClient: Misskey.api.APIClient;
	let bob: Misskey.entities.SigninResponse, bobClient: Misskey.api.APIClient;
	let bobInAServer: Misskey.entities.UserDetailedNotMe, aliceInBServer: Misskey.entities.UserDetailedNotMe;

	beforeAll(async () => {
		[alice, aliceClient] = await createAccount('a.test', aAdminClient);
		[bob, bobClient] = await createAccount('b.test', bAdminClient);

		[bobInAServer, aliceInBServer] = await Promise.all([
			resolveRemoteUser(`https://b.test/users/${bob.id}`, aliceClient),
			resolveRemoteUser(`https://a.test/users/${alice.id}`, bobClient),
		]);
	});

	describe('Follow', () => {
		test('Get notification when follow/followed', async () => {
			const fired = await Promise.all([
				isFired(
					'b.test', bob, 'main',
					async () => await bobClient.request('following/create', { userId: aliceInBServer.id }),
					'follow', msg => msg.id === aliceInBServer.id,
				),
				isFired(
					'a.test', alice, 'main',
					async () => {}, // NOTE: do nothing because done in above
					'followed', msg => msg.id === bobInAServer.id,
				),
			]);
			deepStrictEqual(fired, [true, true]);

			{
				const notifications = await bobClient.request('i/notifications', {});
				const notification = notifications[0];
				strictEqual(notification.type, 'followRequestAccepted');
				strictEqual(notification.userId, aliceInBServer.id);
			}

			{
				const notifications = await aliceClient.request('i/notifications', {});
				const notification = notifications[0];
				strictEqual(notification.type, 'follow');
				strictEqual(notification.userId, bobInAServer.id);
			}
		});
	});
});
