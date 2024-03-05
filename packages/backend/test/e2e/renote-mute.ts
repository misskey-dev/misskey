/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { api, post, signup, sleep, waitFire } from '../utils.js';
import type * as misskey from 'misskey-js';

describe('Renote Mute', () => {
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
		const res = await api('renote-mute/create', {
			userId: carol.id,
		}, alice);

		assert.strictEqual(res.status, 204);
	});

	test('タイムラインにリノートミュートしているユーザーのリノートが含まれない', async () => {
		const bobNote = await post(bob, { text: 'hi' });
		const carolRenote = await post(carol, { renoteId: bobNote.id });
		const carolNote = await post(carol, { text: 'hi' });

		// redisに追加されるのを待つ
		await sleep(100);

		const res = await api('notes/local-timeline', {}, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(Array.isArray(res.body), true);
		assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), true);
		assert.strictEqual(res.body.some((note: any) => note.id === carolRenote.id), false);
		assert.strictEqual(res.body.some((note: any) => note.id === carolNote.id), true);
	});

	test('タイムラインにリノートミュートしているユーザーの引用が含まれる', async () => {
		const bobNote = await post(bob, { text: 'hi' });
		const carolRenote = await post(carol, { renoteId: bobNote.id, text: 'kore' });
		const carolNote = await post(carol, { text: 'hi' });

		// redisに追加されるのを待つ
		await sleep(100);

		const res = await api('notes/local-timeline', {}, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(Array.isArray(res.body), true);
		assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), true);
		assert.strictEqual(res.body.some((note: any) => note.id === carolRenote.id), true);
		assert.strictEqual(res.body.some((note: any) => note.id === carolNote.id), true);
	});

	test('ストリームにリノートミュートしているユーザーのリノートが流れない', async () => {
		const bobNote = await post(bob, { text: 'hi' });

		const fired = await waitFire(
			alice, 'localTimeline',
			() => api('notes/create', { renoteId: bobNote.id }, carol),
			msg => msg.type === 'note' && msg.body.userId === carol.id,
		);

		assert.strictEqual(fired, false);
	});

	test('ストリームにリノートミュートしているユーザーの引用が流れる', async () => {
		const bobNote = await post(bob, { text: 'hi' });

		const fired = await waitFire(
			alice, 'localTimeline',
			() => api('notes/create', { renoteId: bobNote.id, text: 'kore' }, carol),
			msg => msg.type === 'note' && msg.body.userId === carol.id,
		);

		assert.strictEqual(fired, true);
	});
});
