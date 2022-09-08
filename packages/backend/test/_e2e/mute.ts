process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import * as childProcess from 'child_process';
import { signup, request, post, react, startServer, shutdownServer, waitFire } from '../utils.js';

describe('Mute', () => {
	let p: childProcess.ChildProcess;

	// alice mutes carol
	let alice: any;
	let bob: any;
	let carol: any;

	beforeAll(async () => {
		p = await startServer();
		alice = await signup({ username: 'alice' });
		bob = await signup({ username: 'bob' });
		carol = await signup({ username: 'carol' });
	}, 1000 * 30);

	afterAll(async () => {
		await shutdownServer(p);
	});

	it('ミュート作成', async () => {
		const res = await request('/mute/create', {
			userId: carol.id,
		}, alice);

		assert.strictEqual(res.status, 204);
	});

	it('「自分宛ての投稿」にミュートしているユーザーの投稿が含まれない', async () => {
		const bobNote = await post(bob, { text: '@alice hi' });
		const carolNote = await post(carol, { text: '@alice hi' });

		const res = await request('/notes/mentions', {}, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(Array.isArray(res.body), true);
		assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), true);
		assert.strictEqual(res.body.some((note: any) => note.id === carolNote.id), false);
	});

	it('ミュートしているユーザーからメンションされても、hasUnreadMentions が true にならない', async () => {
		// 状態リセット
		await request('/i/read-all-unread-notes', {}, alice);

		await post(carol, { text: '@alice hi' });

		const res = await request('/i', {}, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(res.body.hasUnreadMentions, false);
	});

	it('ミュートしているユーザーからメンションされても、ストリームに unreadMention イベントが流れてこない', async () => {
		// 状態リセット
		await request('/i/read-all-unread-notes', {}, alice);

		const fired = await waitFire(alice, 'main', () => post(carol, { text: '@alice hi' }), msg => msg.type === 'unreadMention');

		assert.strictEqual(fired, false);
	});

	it('ミュートしているユーザーからメンションされても、ストリームに unreadNotification イベントが流れてこない', async () => {
		// 状態リセット
		await request('/i/read-all-unread-notes', {}, alice);
		await request('/notifications/mark-all-as-read', {}, alice);

		const fired = await waitFire(alice, 'main', () => post(carol, { text: '@alice hi' }), msg => msg.type === 'unreadNotification');

		assert.strictEqual(fired, false);
	});

	describe('Timeline', () => {
		it('タイムラインにミュートしているユーザーの投稿が含まれない', async () => {
			const aliceNote = await post(alice);
			const bobNote = await post(bob);
			const carolNote = await post(carol);

			const res = await request('/notes/local-timeline', {}, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(Array.isArray(res.body), true);
			assert.strictEqual(res.body.some((note: any) => note.id === aliceNote.id), true);
			assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), true);
			assert.strictEqual(res.body.some((note: any) => note.id === carolNote.id), false);
		});

		it('タイムラインにミュートしているユーザーの投稿のRenoteが含まれない', async () => {
			const aliceNote = await post(alice);
			const carolNote = await post(carol);
			const bobNote = await post(bob, {
				renoteId: carolNote.id,
			});

			const res = await request('/notes/local-timeline', {}, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(Array.isArray(res.body), true);
			assert.strictEqual(res.body.some((note: any) => note.id === aliceNote.id), true);
			assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
			assert.strictEqual(res.body.some((note: any) => note.id === carolNote.id), false);
		});
	});

	describe('Notification', () => {
		it('通知にミュートしているユーザーの通知が含まれない(リアクション)', async () => {
			const aliceNote = await post(alice);
			await react(bob, aliceNote, 'like');
			await react(carol, aliceNote, 'like');

			const res = await request('/i/notifications', {}, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(Array.isArray(res.body), true);
			assert.strictEqual(res.body.some((notification: any) => notification.userId === bob.id), true);
			assert.strictEqual(res.body.some((notification: any) => notification.userId === carol.id), false);
		});
	});
});
