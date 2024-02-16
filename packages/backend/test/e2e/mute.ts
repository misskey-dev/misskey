/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { api, post, react, signup, waitFire } from '../utils.js';
import type * as misskey from 'misskey-js';

describe('Mute', () => {
	// alice mutes carol
	let alice: misskey.entities.SignupResponse;
	let bob: misskey.entities.SignupResponse;
	let carol: misskey.entities.SignupResponse;

	beforeAll(async () => {
		alice = await signup({ username: 'alice' });
		bob = await signup({ username: 'bob' });
		carol = await signup({ username: 'carol' });
	}, 1000 * 60 * 2);

	test('ミュート作成', async () => {
		const res = await api('/mute/create', {
			userId: carol.id,
		}, alice);

		assert.strictEqual(res.status, 204);
	});

	test('「自分宛ての投稿」にミュートしているユーザーの投稿が含まれない', async () => {
		const bobNote = await post(bob, { text: '@alice hi' });
		const carolNote = await post(carol, { text: '@alice hi' });

		const res = await api('/notes/mentions', {}, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(Array.isArray(res.body), true);
		assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), true);
		assert.strictEqual(res.body.some((note: any) => note.id === carolNote.id), false);
	});

	test('ミュートしているユーザーからメンションされても、hasUnreadMentions が true にならない', async () => {
		// 状態リセット
		await api('/i/read-all-unread-notes', {}, alice);

		await post(carol, { text: '@alice hi' });

		const res = await api('/i', {}, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(res.body.hasUnreadMentions, false);
	});

	test('ミュートしているユーザーからメンションされても、ストリームに unreadMention イベントが流れてこない', async () => {
		// 状態リセット
		await api('/i/read-all-unread-notes', {}, alice);

		const fired = await waitFire(alice, 'main', () => post(carol, { text: '@alice hi' }), msg => msg.type === 'unreadMention');

		assert.strictEqual(fired, false);
	});

	test('ミュートしているユーザーからメンションされても、ストリームに unreadNotification イベントが流れてこない', async () => {
		// 状態リセット
		await api('/i/read-all-unread-notes', {}, alice);
		await api('/notifications/mark-all-as-read', {}, alice);

		const fired = await waitFire(alice, 'main', () => post(carol, { text: '@alice hi' }), msg => msg.type === 'unreadNotification');

		assert.strictEqual(fired, false);
	});

	describe('Timeline', () => {
		test('タイムラインにミュートしているユーザーの投稿が含まれない', async () => {
			const aliceNote = await post(alice, { text: 'hi' });
			const bobNote = await post(bob, { text: 'hi' });
			const carolNote = await post(carol, { text: 'hi' });

			const res = await api('/notes/local-timeline', {}, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(Array.isArray(res.body), true);
			assert.strictEqual(res.body.some((note: any) => note.id === aliceNote.id), true);
			assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), true);
			assert.strictEqual(res.body.some((note: any) => note.id === carolNote.id), false);
		});

		test('タイムラインにミュートしているユーザーの投稿のRenoteが含まれない', async () => {
			const aliceNote = await post(alice, { text: 'hi' });
			const carolNote = await post(carol, { text: 'hi' });
			const bobNote = await post(bob, {
				renoteId: carolNote.id,
			});

			const res = await api('/notes/local-timeline', {}, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(Array.isArray(res.body), true);
			assert.strictEqual(res.body.some((note: any) => note.id === aliceNote.id), true);
			assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
			assert.strictEqual(res.body.some((note: any) => note.id === carolNote.id), false);
		});
	});

	describe('Notification', () => {
		test('通知にミュートしているユーザーの通知が含まれない(リアクション)', async () => {
			const aliceNote = await post(alice, { text: 'hi' });
			await react(bob, aliceNote, 'like');
			await react(carol, aliceNote, 'like');

			const res = await api('/i/notifications', {}, alice);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(Array.isArray(res.body), true);
			assert.strictEqual(res.body.some((notification: any) => notification.userId === bob.id), true);
			assert.strictEqual(res.body.some((notification: any) => notification.userId === carol.id), false);
		});
	});
});
