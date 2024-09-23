import { deepStrictEqual, strictEqual } from 'assert';
import * as Misskey from 'misskey-js';
import { createAccount, fetchAdmin, isFired, resolveRemoteNote, resolveRemoteUser, sleep } from './utils.js';

const [
	[, aAdminClient],
	[, bAdminClient],
] = await Promise.all([
	fetchAdmin('a.test'),
	fetchAdmin('b.test'),
]);

describe('Notification', () => {
	let alice: Misskey.entities.SigninResponse, aliceClient: Misskey.api.APIClient, aliceUsername: string;
	let bob: Misskey.entities.SigninResponse, bobClient: Misskey.api.APIClient;
	let bobInAServer: Misskey.entities.UserDetailedNotMe, aliceInBServer: Misskey.entities.UserDetailedNotMe;

	beforeAll(async () => {
		[alice, aliceClient, { username: aliceUsername }] = await createAccount('a.test', aAdminClient);
		[bob, bobClient] = await createAccount('b.test', bAdminClient);

		[bobInAServer, aliceInBServer] = await Promise.all([
			resolveRemoteUser('b.test', bob.id, aliceClient),
			resolveRemoteUser('a.test', alice.id, bobClient),
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

		afterAll(async () => await bobClient.request('following/delete', { userId: aliceInBServer.id }));
	});

	describe('Note', () => {
		test('Get notification when get a reaction', async () => {
			const note = (await aliceClient.request('notes/create', { text: 'a' })).createdNote;
			const noteInBServer = await resolveRemoteNote('a.test', note.id, bobClient);
			const reaction = '😅';
			const fired = await isFired(
				'a.test', alice, 'main',
				async () => await bobClient.request('notes/reactions/create', { noteId: noteInBServer.id, reaction }),
				'notification', msg => {
					return msg.type === 'reaction' && msg.note.id === note.id && msg.userId === bobInAServer.id && msg.reaction === reaction;
				},
			);
			strictEqual(fired, true);
		});

		test('Get notification when replied', async () => {
			const note = (await aliceClient.request('notes/create', { text: 'a' })).createdNote;
			const noteInBServer = await resolveRemoteNote('a.test', note.id, bobClient);
			const text = crypto.randomUUID();
			const fired = await Promise.all([
				isFired(
					'a.test', alice, 'main',
					async () => {
						await sleep(200);
						await bobClient.request('notes/create', { text, replyId: noteInBServer.id });
					},
					'notification', msg => {
						return msg.type === 'reply' && msg.note.reply!.id === note.id && msg.userId === bobInAServer.id && msg.note.text === text;
					},
				),
				isFired(
					'a.test', alice, 'main',
					async () => {}, // NOTE: do nothing because already done above
					'reply', msg => msg.reply!.id === note.id && msg.userId === bobInAServer.id && msg.text === text,
				),
			]);
			deepStrictEqual(fired, [true, true]);
		});

		test('Get notification when renoted', async () => {
			const note = (await aliceClient.request('notes/create', { text: 'a' })).createdNote;
			const noteInBServer = await resolveRemoteNote('a.test', note.id, bobClient);
			const fired = await Promise.all([
				isFired(
					'a.test', alice, 'main',
					async () => {
						await sleep(200);
						await bobClient.request('notes/create', { renoteId: noteInBServer.id });
					},
					'notification', msg => {
						return msg.type === 'renote' && msg.note.renote!.id === note.id && msg.userId === bobInAServer.id;
					},
				),
				isFired(
					'a.test', alice, 'main',
					async () => {}, // NOTE: do nothing because already done above
					'renote', msg => msg.renote!.id === note.id && msg.userId === bobInAServer.id,
				),
			]);
			deepStrictEqual(fired, [true, true]);
		});

		test('Get notification when quoted', async () => {
			const note = (await aliceClient.request('notes/create', { text: 'a' })).createdNote;
			const noteInBServer = await resolveRemoteNote('a.test', note.id, bobClient);
			const text = crypto.randomUUID();
			const fired = await Promise.all([
				isFired(
					'a.test', alice, 'main',
					async () => {
						await sleep(200);
						await bobClient.request('notes/create', { text, renoteId: noteInBServer.id });
					},
					'notification', msg => {
						return msg.type === 'quote' && msg.note.renote!.id === note.id && msg.userId === bobInAServer.id && msg.note.text === text;
					},
				),
				isFired(
					'a.test', alice, 'main',
					async () => {}, // NOTE: do nothing because already done above
					'renote', msg => msg.renote!.id === note.id && msg.userId === bobInAServer.id && msg.text === text,
				),
			]);
			deepStrictEqual(fired, [true, true]);
		});

		test('Get notification when get a reaction', async () => {
			const text = `@${aliceUsername}@a.test`;
			const fired = await Promise.all([
				isFired(
					'a.test', alice, 'main',
					async () => {
						await sleep(200);
						await bobClient.request('notes/create', { text });
					},
					'notification', msg => msg.type === 'mention' && msg.userId === bobInAServer.id && msg.note.text === text,
				),
				isFired(
					'a.test', alice, 'main',
					async () => {}, // NOTE: do nothing because already done above
					'mention', msg => msg.userId === bobInAServer.id && msg.text === text,
				),
			]);
			deepStrictEqual(fired, [true, true]);
		});
	});
});
