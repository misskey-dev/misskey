import { deepStrictEqual, strictEqual } from 'assert';
import * as Misskey from 'misskey-js';
import { createAccount, isFired, type LoginUser, resolveRemoteNote, resolveRemoteUser, sleep } from './utils.js';

// TODO: these tests only checks streaming, so API endpoints are not tested
describe('Notification', () => {
	describe('Non-mute', () => {
		let alice: LoginUser, bob: LoginUser;
		let bobInAServer: Misskey.entities.UserDetailedNotMe, aliceInBServer: Misskey.entities.UserDetailedNotMe;

		beforeAll(async () => {
			[alice, bob] = await Promise.all([
				createAccount('a.test'),
				createAccount('b.test'),
			]);

			[bobInAServer, aliceInBServer] = await Promise.all([
				resolveRemoteUser('b.test', bob.id, alice),
				resolveRemoteUser('a.test', alice.id, bob),
			]);
		});

		describe('Follow', () => {
			test('Get notification when follow/followed', async () => {
				const fired = await Promise.all([
					isFired(
						'b.test', bob, 'main',
						async () => await bob.client.request('following/create', { userId: aliceInBServer.id }),
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
					const notifications = await bob.client.request('i/notifications', {});
					const notification = notifications[0];
					strictEqual(notification.type, 'followRequestAccepted');
					strictEqual(notification.userId, aliceInBServer.id);
				}

				{
					const notifications = await alice.client.request('i/notifications', {});
					const notification = notifications[0];
					strictEqual(notification.type, 'follow');
					strictEqual(notification.userId, bobInAServer.id);
				}
			});

			afterAll(async () => await bob.client.request('following/delete', { userId: aliceInBServer.id }));
		});

		describe('Note', () => {
			test('Get notification when get a reaction', async () => {
				const note = (await alice.client.request('notes/create', { text: 'a' })).createdNote;
				const noteInBServer = await resolveRemoteNote('a.test', note.id, bob);
				const reaction = '😅';
				const fired = await isFired(
					'a.test', alice, 'main',
					async () => await bob.client.request('notes/reactions/create', { noteId: noteInBServer.id, reaction }),
					'notification', msg => {
						return msg.type === 'reaction' && msg.note.id === note.id && msg.userId === bobInAServer.id && msg.reaction === reaction;
					},
				);
				strictEqual(fired, true);
			});

			test('Get notification when replied', async () => {
				const note = (await alice.client.request('notes/create', { text: 'a' })).createdNote;
				const noteInBServer = await resolveRemoteNote('a.test', note.id, bob);
				const text = crypto.randomUUID();
				const fired = await Promise.all([
					isFired(
						'a.test', alice, 'main',
						async () => {
							await sleep();
							await bob.client.request('notes/create', { text, replyId: noteInBServer.id });
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
				const note = (await alice.client.request('notes/create', { text: 'a' })).createdNote;
				const noteInBServer = await resolveRemoteNote('a.test', note.id, bob);
				const fired = await Promise.all([
					isFired(
						'a.test', alice, 'main',
						async () => {
							await sleep();
							await bob.client.request('notes/create', { renoteId: noteInBServer.id });
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
				const note = (await alice.client.request('notes/create', { text: 'a' })).createdNote;
				const noteInBServer = await resolveRemoteNote('a.test', note.id, bob);
				const text = crypto.randomUUID();
				const fired = await Promise.all([
					isFired(
						'a.test', alice, 'main',
						async () => {
							await sleep();
							await bob.client.request('notes/create', { text, renoteId: noteInBServer.id });
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

			test('Get notification when mentioned', async () => {
				const text = `@${alice.username}@a.test`;
				const fired = await Promise.all([
					isFired(
						'a.test', alice, 'main',
						async () => {
							await sleep();
							await bob.client.request('notes/create', { text });
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

	describe('Mute', () => {
		let alice: LoginUser, bob: LoginUser;
		let bobInAServer: Misskey.entities.UserDetailedNotMe, aliceInBServer: Misskey.entities.UserDetailedNotMe;

		beforeAll(async () => {
			[alice, bob] = await Promise.all([
				createAccount('a.test'),
				createAccount('b.test'),
			]);

			[bobInAServer, aliceInBServer] = await Promise.all([
				resolveRemoteUser('b.test', bob.id, alice),
				resolveRemoteUser('a.test', alice.id, bob),
			]);

			await Promise.all([
				alice.client.request('mute/create', { userId: bobInAServer.id }),
				bob.client.request('mute/create', { userId: aliceInBServer.id }),
			]);
			await sleep();
		});

		describe('Follow', () => {
			// NOTE: you cannot mute follow/followed notification
			test('Get notification when follow/followed', async () => {
				const fired = await Promise.all([
					isFired(
						'b.test', bob, 'main',
						async () => {
							await sleep();
							await bob.client.request('following/create', { userId: aliceInBServer.id });
						},
						'follow', msg => msg.id === aliceInBServer.id,
					),
					isFired(
						'a.test', alice, 'main',
						async () => {}, // NOTE: do nothing because done in above
						'followed', msg => msg.id === bobInAServer.id,
					),
				]);
				deepStrictEqual(fired, [true, true]);
			});

			afterAll(async () => await bob.client.request('following/delete', { userId: aliceInBServer.id }));
		});

		describe('Note', () => {
			test('Get no notification when get a reaction', async () => {
				const note = (await alice.client.request('notes/create', { text: 'a' })).createdNote;
				const noteInBServer = await resolveRemoteNote('a.test', note.id, bob);
				const reaction = '😅';
				const fired = await isFired(
					'a.test', alice, 'main',
					async () => await bob.client.request('notes/reactions/create', { noteId: noteInBServer.id, reaction }),
					'notification', msg => {
						return msg.type === 'reaction' && msg.note.id === note.id && msg.userId === bobInAServer.id && msg.reaction === reaction;
					},
				);
				strictEqual(fired, false);
			});

			test('Get no notification when replied', async () => {
				const note = (await alice.client.request('notes/create', { text: 'a' })).createdNote;
				const noteInBServer = await resolveRemoteNote('a.test', note.id, bob);
				const text = crypto.randomUUID();
				const fired = await isFired(
					'a.test', alice, 'main',
					async () => await bob.client.request('notes/create', { text, replyId: noteInBServer.id }),
					'notification', msg => {
						return msg.type === 'reply' && msg.note.reply!.id === note.id && msg.userId === bobInAServer.id && msg.note.text === text;
					},
				);
				deepStrictEqual(fired, false);
			});

			test('Get no notification when renoted', async () => {
				const note = (await alice.client.request('notes/create', { text: 'a' })).createdNote;
				const noteInBServer = await resolveRemoteNote('a.test', note.id, bob);
				const fired = await isFired(
					'a.test', alice, 'main',
					async () => await bob.client.request('notes/create', { renoteId: noteInBServer.id }),
					'notification', msg => {
						return msg.type === 'renote' && msg.note.renote!.id === note.id && msg.userId === bobInAServer.id;
					},
				);
				deepStrictEqual(fired, false);
			});

			test('Get no notification when quoted', async () => {
				const note = (await alice.client.request('notes/create', { text: 'a' })).createdNote;
				const noteInBServer = await resolveRemoteNote('a.test', note.id, bob);
				const text = crypto.randomUUID();
				const fired = await isFired(
					'a.test', alice, 'main',
					async () => await bob.client.request('notes/create', { text, renoteId: noteInBServer.id }),
					'notification', msg => {
						return msg.type === 'quote' && msg.note.renote!.id === note.id && msg.userId === bobInAServer.id && msg.note.text === text;
					},
				);
				deepStrictEqual(fired, false);
			});

			test('Get no notification when mentioned', async () => {
				const text = `@${alice.username}@a.test`;
				const fired = await isFired(
					'a.test', alice, 'main',
					async () => await bob.client.request('notes/create', { text }),
					'notification', msg => msg.type === 'mention' && msg.userId === bobInAServer.id && msg.note.text === text,
				);
				deepStrictEqual(fired, false);
			});
		});
	});
});
