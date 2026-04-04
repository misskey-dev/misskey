/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { api, post, react, signup, waitFire } from '../utils.js';
import type * as misskey from 'misskey-js';

describe('Timeline-only Mute', () => {
	// alice timeline-only mutes carol
	let alice: misskey.entities.SignupResponse;
	let bob: misskey.entities.SignupResponse;
	let carol: misskey.entities.SignupResponse;

	beforeAll(async () => {
		alice = await signup({ username: 'alice' });
		bob = await signup({ username: 'bob' });
		carol = await signup({ username: 'carol' });

		// Timeline-only mute: alice ==> carol
		await api('mute/create', {
			userId: carol.id,
			mutingType: 'timelineOnly',
		}, alice);
	}, 1000 * 60 * 2);

	test('タイムラインオンリーミュート作成', async () => {
		const res = await api('mute/create', {
			userId: bob.id,
			mutingType: 'timelineOnly',
		}, alice);

		assert.strictEqual(res.status, 204);

		// Clean up side effects so tests can run independently
		await api('mute/delete', {
			userId: bob.id,
		}, alice);
	});

	describe('Timeline', () => {
		test('タイムラインにtimelineOnlyミュートしているユーザーの投稿が含まれない', async () => {
			const aliceNote = await post(alice, { text: 'hi' });
			const bobNote = await post(bob, { text: 'hi' });
			const carolNote = await post(carol, { text: 'hi' });

			const res = await api('notes/local-timeline', {}, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(Array.isArray(res.body), true);
			assert.strictEqual(res.body.some(note => note.id === aliceNote.id), true);
			assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
			assert.strictEqual(res.body.some(note => note.id === carolNote.id), false);
		});
	});

	describe('Notification', () => {
		test('timelineOnlyミュートしているユーザーからの通知は届く(リアクション)', async () => {
			const aliceNote = await post(alice, { text: 'hi' });
			await react(bob, aliceNote, 'like');
			await react(carol, aliceNote, 'like');

			const res = await api('i/notifications', {}, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(Array.isArray(res.body), true);
			assert.strictEqual(res.body.some(notification => 'userId' in notification && notification.userId === bob.id), true);
			// carol is timelineOnly muted, so notifications should still come through
			assert.strictEqual(res.body.some(notification => 'userId' in notification && notification.userId === carol.id), true);
		});

		test('timelineOnlyミュートしているユーザーからのリプライ通知は届く', async () => {
			const aliceNote = await post(alice, { text: 'hi' });
			await post(bob, { text: '@alice hi', replyId: aliceNote.id });
			await post(carol, { text: '@alice hi', replyId: aliceNote.id });

			const res = await api('i/notifications', {}, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(Array.isArray(res.body), true);

			assert.strictEqual(res.body.some(notification => 'userId' in notification && notification.userId === bob.id), true);
			// carol is timelineOnly muted, so reply notifications should still come through
			assert.strictEqual(res.body.some(notification => 'userId' in notification && notification.userId === carol.id), true);
		});

		test('timelineOnlyミュートしているユーザーからのメンション通知は届く', async () => {
			await post(alice, { text: 'hi' });
			await post(bob, { text: '@alice hi' });
			await post(carol, { text: '@alice hi' });

			const res = await api('i/notifications', {}, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(Array.isArray(res.body), true);

			assert.strictEqual(res.body.some(notification => 'userId' in notification && notification.userId === bob.id), true);
			// carol is timelineOnly muted, so mention notifications should still come through
			assert.strictEqual(res.body.some(notification => 'userId' in notification && notification.userId === carol.id), true);
		});

		test('timelineOnlyミュートしているユーザーからの引用リノート通知は届く', async () => {
			const aliceNote = await post(alice, { text: 'hi' });
			await post(bob, { text: 'hi', renoteId: aliceNote.id });
			await post(carol, { text: 'hi', renoteId: aliceNote.id });

			const res = await api('i/notifications', {}, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(Array.isArray(res.body), true);

			assert.strictEqual(res.body.some(notification => 'userId' in notification && notification.userId === bob.id), true);
			// carol is timelineOnly muted, so quote notifications should still come through
			assert.strictEqual(res.body.some(notification => 'userId' in notification && notification.userId === carol.id), true);
		});

		test('timelineOnlyミュートしているユーザーからメンションされても、ストリームに unreadNotification イベントが流れてくる', async () => {
			// Reset state
			await api('notifications/mark-all-as-read', {}, alice);

			const fired = await waitFire(alice, 'main', () => post(carol, { text: '@alice hi' }), msg => msg.type === 'unreadNotification');

			// carol is timelineOnly muted, so notification stream should fire
			assert.strictEqual(fired, true);
		});
	});
});
