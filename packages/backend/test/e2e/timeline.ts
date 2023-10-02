/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { signup, api, post, react, startServer, waitFire, sleep } from '../utils.js';
import type { INestApplicationContext } from '@nestjs/common';
import type * as misskey from 'misskey-js';

describe('Renote Mute', () => {
	let app: INestApplicationContext;

	beforeAll(async () => {
		app = await startServer();
	}, 1000 * 60 * 2);

	afterAll(async () => {
		await app.close();
	});

	test('タイムラインに自分の visibility: followers なノートが含まれる', async () => {
		const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

		const aliceNote = await post(alice, { text: 'hi', visibility: 'followers'  });

		// redisに追加されるのを待つ
		await sleep(100);

		const res = await api('/notes/timeline', {}, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(Array.isArray(res.body), true);
		assert.strictEqual(res.body.some((note: any) => note.id === aliceNote.id), true);
		assert.strictEqual(res.body.find((note: any) => note.id === aliceNote.id).text, 'hi');
	});

	test('タイムラインにフォローしているユーザーのノートが含まれる', async () => {
		const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

		await api('/following/create', {
			userId: bob.id,
		}, alice);
		const bobNote = await post(bob, { text: 'hi' });
		const carolNote = await post(carol, { text: 'hi' });

		// redisに追加されるのを待つ
		await sleep(100);

		const res = await api('/notes/timeline', {}, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(Array.isArray(res.body), true);
		assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), true);
		assert.strictEqual(res.body.some((note: any) => note.id === carolNote.id), false);
	});

	test('タイムラインにフォローしているユーザーの visibility: followers なノートが含まれる', async () => {
		const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

		await api('/following/create', {
			userId: bob.id,
		}, alice);
		const bobNote = await post(bob, { text: 'hi', visibility: 'followers' });
		const carolNote = await post(carol, { text: 'hi' });

		// redisに追加されるのを待つ
		await sleep(100);

		const res = await api('/notes/timeline', {}, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(Array.isArray(res.body), true);
		assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), true);
		assert.strictEqual(res.body.find((note: any) => note.id === bobNote.id).text, 'hi');
		assert.strictEqual(res.body.some((note: any) => note.id === carolNote.id), false);
	});

	test('タイムラインに withReplies: false でフォローしているユーザーの他人への返信が含まれない', async () => {
		const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

		await api('/following/create', {
			userId: bob.id,
		}, alice);
		const carolNote = await post(carol, { text: 'hi' });
		const bobNote = await post(bob, { text: 'hi', replyId: carolNote.id });

		// redisに追加されるのを待つ
		await sleep(100);

		const res = await api('/notes/timeline', {}, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(Array.isArray(res.body), true);
		assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
		assert.strictEqual(res.body.some((note: any) => note.id === carolNote.id), false);
	});

	test('タイムラインに withReplies: true でフォローしているユーザーの他人への返信が含まれる', async () => {
		const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

		await api('/following/create', {
			userId: bob.id,
		}, alice);
		await api('/following/update', {
			userId: bob.id,
			withReplies: true,
		}, alice);
		const carolNote = await post(carol, { text: 'hi' });
		const bobNote = await post(bob, { text: 'hi', replyId: carolNote.id });

		// redisに追加されるのを待つ
		await sleep(100);

		const res = await api('/notes/timeline', {}, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(Array.isArray(res.body), true);
		assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), true);
		assert.strictEqual(res.body.some((note: any) => note.id === carolNote.id), false);
	});

	test('タイムラインに withReplies: true でフォローしているユーザーの他人へのDM返信が含まれない', async () => {
		const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

		await api('/following/create', {
			userId: bob.id,
		}, alice);
		await api('/following/update', {
			userId: bob.id,
			withReplies: true,
		}, alice);
		const carolNote = await post(carol, { text: 'hi' });
		const bobNote = await post(bob, { text: 'hi', replyId: carolNote.id, visibility: 'specified', visibleUserIds: [carolNote.id] });

		// redisに追加されるのを待つ
		await sleep(100);

		const res = await api('/notes/timeline', {}, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(Array.isArray(res.body), true);
		assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
		assert.strictEqual(res.body.some((note: any) => note.id === carolNote.id), false);
	});

	test('タイムラインに withReplies: true でフォローしているユーザーの他人の visibility: followers な投稿への返信が含まれない', async () => {
		const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

		await api('/following/create', {
			userId: bob.id,
		}, alice);
		await api('/following/update', {
			userId: bob.id,
			withReplies: true,
		}, alice);
		const carolNote = await post(carol, { text: 'hi', visibility: 'followers' });
		const bobNote = await post(bob, { text: 'hi', replyId: carolNote.id });

		// redisに追加されるのを待つ
		await sleep(100);

		const res = await api('/notes/timeline', {}, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(Array.isArray(res.body), true);
		assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
		assert.strictEqual(res.body.some((note: any) => note.id === carolNote.id), false);
	});

	test('タイムラインに withReplies: false でフォローしているユーザーのそのユーザー自身への返信が含まれる', async () => {
		const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

		await api('/following/create', {
			userId: bob.id,
		}, alice);
		const bobNote1 = await post(bob, { text: 'hi' });
		const bobNote2 = await post(bob, { text: 'hi', replyId: bobNote1.id });

		// redisに追加されるのを待つ
		await sleep(100);

		const res = await api('/notes/timeline', {}, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(Array.isArray(res.body), true);
		assert.strictEqual(res.body.some((note: any) => note.id === bobNote1.id), true);
		assert.strictEqual(res.body.some((note: any) => note.id === bobNote2.id), true);
	});

	test('タイムラインに自分の他人への返信が含まれる', async () => {
		const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

		const bobNote = await post(bob, { text: 'hi' });
		const aliceNote = await post(bob, { text: 'hi', replyId: bobNote.id });

		// redisに追加されるのを待つ
		await sleep(100);

		const res = await api('/notes/timeline', {}, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(Array.isArray(res.body), true);
		assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
		assert.strictEqual(res.body.some((note: any) => note.id === aliceNote.id), true);
	});

	test('タイムラインにフォローしているユーザーの他人の投稿のリノートが含まれる', async () => {
		const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

		await api('/following/create', {
			userId: bob.id,
		}, alice);
		const carolNote = await post(carol, { text: 'hi' });
		const bobNote = await post(bob, { renoteId: carolNote.id });

		// redisに追加されるのを待つ
		await sleep(100);

		const res = await api('/notes/timeline', {}, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(Array.isArray(res.body), true);
		assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), true);
		assert.strictEqual(res.body.some((note: any) => note.id === carolNote.id), false);
	});

	test('withRenotes: false なタイムラインにフォローしているユーザーの他人の投稿のリノートが含まれない', async () => {
		const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

		await api('/following/create', {
			userId: bob.id,
		}, alice);
		const carolNote = await post(carol, { text: 'hi' });
		const bobNote = await post(bob, { renoteId: carolNote.id });

		// redisに追加されるのを待つ
		await sleep(100);

		const res = await api('/notes/timeline', {
			withRenotes: false,
		}, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(Array.isArray(res.body), true);
		assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
		assert.strictEqual(res.body.some((note: any) => note.id === carolNote.id), false);
	});

	test('withRenotes: false なタイムラインにフォローしているユーザーの他人の投稿の引用が含まれる', async () => {
		const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

		await api('/following/create', {
			userId: bob.id,
		}, alice);
		const carolNote = await post(carol, { text: 'hi' });
		const bobNote = await post(bob, { text: 'hi',  renoteId: carolNote.id });

		// redisに追加されるのを待つ
		await sleep(100);

		const res = await api('/notes/timeline', {
			withRenotes: false,
		}, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(Array.isArray(res.body), true);
		assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), true);
		assert.strictEqual(res.body.some((note: any) => note.id === carolNote.id), false);
	});

	// TODO: ミュート済みユーザーのテスト
	// TODO: リノートミュート済みユーザーのテスト
	// TODO: withFilesのテスト
});
