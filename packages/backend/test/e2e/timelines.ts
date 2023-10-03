/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { signup, api, post, react, startServer, waitFire, sleep } from '../utils.js';
import type { INestApplicationContext } from '@nestjs/common';
import type * as misskey from 'misskey-js';

describe('Timelines', () => {
	let app: INestApplicationContext;

	beforeAll(async () => {
		app = await startServer();
	}, 1000 * 60 * 2);

	afterAll(async () => {
		await app.close();
	});

	describe('Home TL', () => {
		test('自分の visibility: followers なノートが含まれる', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			const aliceNote = await post(alice, { text: 'hi', visibility: 'followers' });

			await sleep(100); // redisに追加されるのを待つ

			const res = await api('/notes/timeline', {}, alice);

			assert.strictEqual(res.body.some((note: any) => note.id === aliceNote.id), true);
			assert.strictEqual(res.body.find((note: any) => note.id === aliceNote.id).text, 'hi');
		});

		test('フォローしているユーザーのノートが含まれる', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			await api('/following/create', { userId: bob.id }, alice);
			const bobNote = await post(bob, { text: 'hi' });
			const carolNote = await post(carol, { text: 'hi' });

			await sleep(100); // redisに追加されるのを待つ

			const res = await api('/notes/timeline', {}, alice);

			assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), true);
			assert.strictEqual(res.body.some((note: any) => note.id === carolNote.id), false);
		});

		test('フォローしているユーザーの visibility: followers なノートが含まれる', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			await api('/following/create', { userId: bob.id }, alice);
			const bobNote = await post(bob, { text: 'hi', visibility: 'followers' });
			const carolNote = await post(carol, { text: 'hi' });

			await sleep(100); // redisに追加されるのを待つ

			const res = await api('/notes/timeline', {}, alice);

			assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), true);
			assert.strictEqual(res.body.find((note: any) => note.id === bobNote.id).text, 'hi');
			assert.strictEqual(res.body.some((note: any) => note.id === carolNote.id), false);
		});

		test('withReplies: false でフォローしているユーザーの他人への返信が含まれない', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			await api('/following/create', { userId: bob.id }, alice);
			const carolNote = await post(carol, { text: 'hi' });
			const bobNote = await post(bob, { text: 'hi', replyId: carolNote.id });

			await sleep(100); // redisに追加されるのを待つ

			const res = await api('/notes/timeline', {}, alice);

			assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
			assert.strictEqual(res.body.some((note: any) => note.id === carolNote.id), false);
		});

		test('withReplies: true でフォローしているユーザーの他人への返信が含まれる', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			await api('/following/create', { userId: bob.id }, alice);
			await api('/following/update', { userId: bob.id, withReplies: true }, alice);
			const carolNote = await post(carol, { text: 'hi' });
			const bobNote = await post(bob, { text: 'hi', replyId: carolNote.id });

			await sleep(100); // redisに追加されるのを待つ

			const res = await api('/notes/timeline', {}, alice);

			assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), true);
			assert.strictEqual(res.body.some((note: any) => note.id === carolNote.id), false);
		});

		test('withReplies: true でフォローしているユーザーの他人へのDM返信が含まれない', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			await api('/following/create', { userId: bob.id }, alice);
			await api('/following/update', { userId: bob.id, withReplies: true }, alice);
			const carolNote = await post(carol, { text: 'hi' });
			const bobNote = await post(bob, { text: 'hi', replyId: carolNote.id, visibility: 'specified', visibleUserIds: [carolNote.id] });

			await sleep(100); // redisに追加されるのを待つ

			const res = await api('/notes/timeline', {}, alice);

			assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
			assert.strictEqual(res.body.some((note: any) => note.id === carolNote.id), false);
		});

		test('withReplies: true でフォローしているユーザーの他人の visibility: followers な投稿への返信が含まれない', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			await api('/following/create', { userId: bob.id }, alice);
			await api('/following/update', { userId: bob.id, withReplies: true }, alice);
			const carolNote = await post(carol, { text: 'hi', visibility: 'followers' });
			const bobNote = await post(bob, { text: 'hi', replyId: carolNote.id });

			await sleep(100); // redisに追加されるのを待つ

			const res = await api('/notes/timeline', {}, alice);

			assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
			assert.strictEqual(res.body.some((note: any) => note.id === carolNote.id), false);
		});

		test('withReplies: false でフォローしているユーザーのそのユーザー自身への返信が含まれる', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			await api('/following/create', { userId: bob.id }, alice);
			const bobNote1 = await post(bob, { text: 'hi' });
			const bobNote2 = await post(bob, { text: 'hi', replyId: bobNote1.id });

			await sleep(100); // redisに追加されるのを待つ

			const res = await api('/notes/timeline', {}, alice);

			assert.strictEqual(res.body.some((note: any) => note.id === bobNote1.id), true);
			assert.strictEqual(res.body.some((note: any) => note.id === bobNote2.id), true);
		});

		test('自分の他人への返信が含まれる', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			const bobNote = await post(bob, { text: 'hi' });
			const aliceNote = await post(alice, { text: 'hi', replyId: bobNote.id });

			await sleep(100); // redisに追加されるのを待つ

			const res = await api('/notes/timeline', {}, alice);

			assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
			assert.strictEqual(res.body.some((note: any) => note.id === aliceNote.id), true);
		});

		test('フォローしているユーザーの他人の投稿のリノートが含まれる', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			await api('/following/create', { userId: bob.id }, alice);
			const carolNote = await post(carol, { text: 'hi' });
			const bobNote = await post(bob, { renoteId: carolNote.id });

			await sleep(100); // redisに追加されるのを待つ

			const res = await api('/notes/timeline', {}, alice);

			assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), true);
			assert.strictEqual(res.body.some((note: any) => note.id === carolNote.id), false);
		});

		test('[withRenotes: false] フォローしているユーザーの他人の投稿のリノートが含まれない', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			await api('/following/create', { userId: bob.id }, alice);
			const carolNote = await post(carol, { text: 'hi' });
			const bobNote = await post(bob, { renoteId: carolNote.id });

			await sleep(100); // redisに追加されるのを待つ

			const res = await api('/notes/timeline', {
				withRenotes: false,
			}, alice);

			assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
			assert.strictEqual(res.body.some((note: any) => note.id === carolNote.id), false);
		});

		test('[withRenotes: false] フォローしているユーザーの他人の投稿の引用が含まれる', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			await api('/following/create', { userId: bob.id }, alice);
			const carolNote = await post(carol, { text: 'hi' });
			const bobNote = await post(bob, { text: 'hi', renoteId: carolNote.id });

			await sleep(100); // redisに追加されるのを待つ

			const res = await api('/notes/timeline', {
				withRenotes: false,
			}, alice);

			assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), true);
			assert.strictEqual(res.body.some((note: any) => note.id === carolNote.id), false);
		});

		test('フォローしているユーザーが行ったミュートしているユーザーのリノートが含まれない', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			await api('/following/create', { userId: bob.id }, alice);
			await api('/mute/create', { userId: carol.id }, alice);
			const carolNote = await post(carol, { text: 'hi' });
			const bobNote = await post(bob, { text: 'hi', renoteId: carolNote.id });

			await sleep(100); // redisに追加されるのを待つ

			const res = await api('/notes/timeline', {}, alice);

			assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
			assert.strictEqual(res.body.some((note: any) => note.id === carolNote.id), false);
		});

		test('withReplies: true でフォローしているユーザーが行ったミュートしているユーザーの投稿への返信が含まれない', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			await api('/following/create', { userId: bob.id }, alice);
			await api('/following/update', { userId: bob.id, withReplies: true }, alice);
			await api('/mute/create', { userId: carol.id }, alice);
			const carolNote = await post(carol, { text: 'hi' });
			const bobNote = await post(bob, { text: 'hi', replyId: carolNote.id });

			await sleep(100); // redisに追加されるのを待つ

			const res = await api('/notes/timeline', {}, alice);

			assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
			assert.strictEqual(res.body.some((note: any) => note.id === carolNote.id), false);
		});

		test('フォローしているリモートユーザーのノートが含まれる', async () => {
			const [alice, bob] = await Promise.all([signup(), signup({ host: 'example.com' })]);

			await api('/following/create', { userId: bob.id }, alice);
			const bobNote = await post(bob, { text: 'hi' });

			await sleep(100); // redisに追加されるのを待つ

			const res = await api('/notes/timeline', {}, alice);

			assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), true);
		});

		test('フォローしているリモートユーザーの visibility: home なノートが含まれる', async () => {
			const [alice, bob] = await Promise.all([signup(), signup({ host: 'example.com' })]);

			await api('/following/create', { userId: bob.id }, alice);
			const bobNote = await post(bob, { text: 'hi', visibility: 'home' });

			await sleep(100); // redisに追加されるのを待つ

			const res = await api('/notes/timeline', {}, alice);

			assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), true);
		});
	});

	describe('Local TL', () => {
		test('visibility: home なノートが含まれない', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			const carolNote = await post(carol, { text: 'hi', visibility: 'home' });
			const bobNote = await post(bob, { text: 'hi' });

			await sleep(100); // redisに追加されるのを待つ

			const res = await api('/notes/local-timeline', {}, alice);

			assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), true);
			assert.strictEqual(res.body.some((note: any) => note.id === carolNote.id), false);
		});

		test('リモートユーザーのノートが含まれない', async () => {
			const [alice, bob] = await Promise.all([signup(), signup({ host: 'example.com' })]);

			const bobNote = await post(bob, { text: 'hi' });

			await sleep(100); // redisに追加されるのを待つ

			const res = await api('/notes/local-timeline', {}, alice);

			assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
		});

		test('フォローしているユーザーの visibility: home なノートが含まれる', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			await api('/following/create', {
				userId: carol.id,
			}, alice);
			const carolNote = await post(carol, { text: 'hi', visibility: 'home' });
			const bobNote = await post(bob, { text: 'hi' });

			await sleep(100); // redisに追加されるのを待つ

			const res = await api('/notes/local-timeline', {}, alice);

			assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), true);
			assert.strictEqual(res.body.some((note: any) => note.id === carolNote.id), true);
		});

		test('ミュートしているユーザーのノートが含まれない', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			await api('/mute/create', { userId: carol.id }, alice);
			const carolNote = await post(carol, { text: 'hi' });
			const bobNote = await post(bob, { text: 'hi' });

			await sleep(100); // redisに追加されるのを待つ

			const res = await api('/notes/local-timeline', {}, alice);

			assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), true);
			assert.strictEqual(res.body.some((note: any) => note.id === carolNote.id), false);
		});

		test('フォローしているユーザーが行ったミュートしているユーザーのリノートが含まれない', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			await api('/following/create', { userId: bob.id }, alice);
			await api('/mute/create', { userId: carol.id }, alice);
			const carolNote = await post(carol, { text: 'hi' });
			const bobNote = await post(bob, { text: 'hi', renoteId: carolNote.id });

			await sleep(100); // redisに追加されるのを待つ

			const res = await api('/notes/local-timeline', {}, alice);

			assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
			assert.strictEqual(res.body.some((note: any) => note.id === carolNote.id), false);
		});

		test('withReplies: true でフォローしているユーザーが行ったミュートしているユーザーの投稿への返信が含まれない', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			await api('/following/create', { userId: bob.id }, alice);
			await api('/following/update', { userId: bob.id, withReplies: true }, alice);
			await api('/mute/create', { userId: carol.id }, alice);
			const carolNote = await post(carol, { text: 'hi' });
			const bobNote = await post(bob, { text: 'hi', replyId: carolNote.id });

			await sleep(100); // redisに追加されるのを待つ

			const res = await api('/notes/local-timeline', {}, alice);

			assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
			assert.strictEqual(res.body.some((note: any) => note.id === carolNote.id), false);
		});
	});

	describe('Social TL', () => {
		test('ローカルユーザーのノートが含まれる', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			const bobNote = await post(bob, { text: 'hi' });

			await sleep(100); // redisに追加されるのを待つ

			const res = await api('/notes/hybrid-timeline', {}, alice);

			assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), true);
		});

		test('ローカルユーザーの visibility: home なノートが含まれない', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			const bobNote = await post(bob, { text: 'hi', visibility: 'home' });

			await sleep(100); // redisに追加されるのを待つ

			const res = await api('/notes/hybrid-timeline', {}, alice);

			assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
		});

		test('フォローしているローカルユーザーの visibility: home なノートが含まれる', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			await api('/following/create', { userId: bob.id }, alice);
			const bobNote = await post(bob, { text: 'hi', visibility: 'home' });

			await sleep(100); // redisに追加されるのを待つ

			const res = await api('/notes/hybrid-timeline', {}, alice);

			assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), true);
		});

		test('リモートユーザーのノートが含まれない', async () => {
			const [alice, bob] = await Promise.all([signup(), signup({ host: 'example.com' })]);

			const bobNote = await post(bob, { text: 'hi' });

			await sleep(100); // redisに追加されるのを待つ

			const res = await api('/notes/local-timeline', {}, alice);

			assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
		});

		test('フォローしているリモートユーザーのノートが含まれる', async () => {
			const [alice, bob] = await Promise.all([signup(), signup({ host: 'example.com' })]);

			await api('/following/create', { userId: bob.id }, alice);
			const bobNote = await post(bob, { text: 'hi' });

			await sleep(100); // redisに追加されるのを待つ

			const res = await api('/notes/hybrid-timeline', {}, alice);

			assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), true);
		});

		test('フォローしているリモートユーザーの visibility: home なノートが含まれる', async () => {
			const [alice, bob] = await Promise.all([signup(), signup({ host: 'example.com' })]);

			await api('/following/create', { userId: bob.id }, alice);
			const bobNote = await post(bob, { text: 'hi', visibility: 'home' });

			await sleep(100); // redisに追加されるのを待つ

			const res = await api('/notes/hybrid-timeline', {}, alice);

			assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), true);
		});
	});

	// TODO: リノートミュート済みユーザーのテスト
	// TODO: withFilesのテスト
});
