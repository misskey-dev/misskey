/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { signup, api, post, react, startServer, waitFire } from '../utils.js';
import type { INestApplicationContext } from '@nestjs/common';
import type * as misskey from 'misskey-js';

describe('Renote Mute', () => {
	let app: INestApplicationContext;

	// alice mutes carol
	let alice: misskey.entities.MeSignup;
	let bob: misskey.entities.MeSignup;
	let carol: misskey.entities.MeSignup;

	beforeAll(async () => {
		app = await startServer();
		alice = await signup({ username: 'alice' });
		bob = await signup({ username: 'bob' });
		carol = await signup({ username: 'carol' });
	}, 1000 * 60 * 2);

	afterAll(async () => {
		await app.close();
	});

	test('ミュート作成', async () => {
		const res = await api('/renote-mute/create', {
			userId: carol.id,
		}, alice);

		assert.strictEqual(res.status, 204);
	});

	test('タイムラインにリノートミュートしているユーザーのリノートが含まれない', async () => {
		const bobNote = await post(bob, { text: 'hi' });
		const carolRenote = await post(carol, { renoteId: bobNote.id });
		const carolNote = await post(carol, { text: 'hi' });

		const res = await api('/notes/local-timeline', {}, alice);

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

		const res = await api('/notes/local-timeline', {}, alice);

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
