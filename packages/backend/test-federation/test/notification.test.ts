import { describe, test, beforeAll, afterAll } from 'vitest';
import * as Misskey from 'misskey-js';
import { assertNotificationReceived, createAccount, type LoginUser, resolveRemoteNote, resolveRemoteUser, waitForFollowing, waitForFollowRelation } from './utils.js';

describe('Notification', () => {
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

	describe('Follow', () => {
		test('Get notification when follow', async () => {
			await assertNotificationReceived(
				'b.test', bob,
				async () => await bob.client.request('following/create', { userId: aliceInB.id }),
				notification => notification.type === 'followRequestAccepted' && notification.userId === aliceInB.id,
				true,
			);

			// NOTE: 次のテストで再度フォローする。a.test が Undo Follow を処理する前に次の Follow が
			//       届くと「すでにフォロー関係が存在」扱いで Accept だけ返されて follow 通知が発生せず、
			//       Undo が後勝ちした場合はその Accept すら返らなくなる。
			//       b.test 側の followings は同期的に消えるので、a.test への反映まで待つ必要がある
			await bob.client.request('following/delete', { userId: aliceInB.id });
			await waitForFollowRelation(bob, alice, 0);
		});

		test('Get notification when get followed', async () => {
			await assertNotificationReceived(
				'a.test', alice,
				async () => await bob.client.request('following/create', { userId: aliceInB.id }),
				notification => notification.type === 'follow' && notification.userId === bobInA.id,
				true,
			);
		});

		afterAll(async () => {
			// NOTE: follow 通知は a.test 側の処理で発生するため、この時点で b.test が Accept を
			//       受け取っているとは限らない。そのまま解除すると NOT_FOLLOWING になる
			await waitForFollowing(bob, 1);
			await bob.client.request('following/delete', { userId: aliceInB.id });
		});
	});

	describe('Note', () => {
		test('Get notification when get a reaction', async () => {
			const note = (await alice.client.request('notes/create', { text: 'a' })).createdNote;
			const noteInB = await resolveRemoteNote('a.test', note.id, bob);
			const reaction = '😅';
			await assertNotificationReceived(
				'a.test', alice,
				async () => await bob.client.request('notes/reactions/create', { noteId: noteInB.id, reaction }),
				notification =>
					notification.type === 'reaction' && notification.note.id === note.id && notification.userId === bobInA.id && notification.reaction === reaction,
				true,
			);
		});

		test('Get notification when replied', async () => {
			const note = (await alice.client.request('notes/create', { text: 'a' })).createdNote;
			const noteInB = await resolveRemoteNote('a.test', note.id, bob);
			const text = crypto.randomUUID();
			await assertNotificationReceived(
				'a.test', alice,
				async () => await bob.client.request('notes/create', { text, replyId: noteInB.id }),
				notification =>
					notification.type === 'reply' && notification.note.reply!.id === note.id && notification.userId === bobInA.id && notification.note.text === text,
				true,
			);
		});

		test('Get notification when renoted', async () => {
			const note = (await alice.client.request('notes/create', { text: 'a' })).createdNote;
			const noteInB = await resolveRemoteNote('a.test', note.id, bob);
			await assertNotificationReceived(
				'a.test', alice,
				async () => await bob.client.request('notes/create', { renoteId: noteInB.id }),
				notification =>
					notification.type === 'renote' && notification.note.renote!.id === note.id && notification.userId === bobInA.id,
				true,
			);
		});

		test('Get notification when quoted', async () => {
			const note = (await alice.client.request('notes/create', { text: 'a' })).createdNote;
			const noteInB = await resolveRemoteNote('a.test', note.id, bob);
			const text = crypto.randomUUID();
			await assertNotificationReceived(
				'a.test', alice,
				async () => await bob.client.request('notes/create', { text, renoteId: noteInB.id }),
				notification =>
					notification.type === 'quote' && notification.note.renote!.id === note.id && notification.userId === bobInA.id && notification.note.text === text,
				true,
			);
		});

		test('Get notification when mentioned', async () => {
			const text = `@${alice.username}@a.test`;
			await assertNotificationReceived(
				'a.test', alice,
				async () => await bob.client.request('notes/create', { text }),
				notification => notification.type === 'mention' && notification.userId === bobInA.id && notification.note.text === text,
				true,
			);
		});
	});
});
