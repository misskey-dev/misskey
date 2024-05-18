/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { api, post, react, signup } from '../utils.js';
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

		// Mute: alice ==> carol
		await api('mute/create', {
			userId: carol.id,
		}, alice);
	}, 1000 * 60 * 2);

	test('ミュートしているユーザーのリアクションが減算される', async () => {
		const aliceNote = await post(alice, { text: 'hi' });
		await react(bob, aliceNote, 'like');
		await react(carol, aliceNote, 'like');

		const res = await api('notes/local-timeline', {}, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(Array.isArray(res.body), true);
		assert.strictEqual(res.body.some((note: any) => note.reactions.like), 1);
	});

	test('ミュートしているユーザーのリアクションが含まれない', async () => {
		const aliceNote = await post(alice, { text: 'hi' });
		await react(bob, aliceNote, 'like');
		await react(carol, aliceNote, 'unlike');

		const res = await api('notes/local-timeline', {}, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(Array.isArray(res.body), true);
		assert.strictEqual(res.body.some((note: any) => note.reactions.like), 1);
		assert.strictEqual(res.body.some((note: any) => note.reactions.unlike), undefined);
	});

	test('リアクション詳細にミュートしているユーザーのリアクションが含まれない', async () => {
		const aliceNote = await post(alice, { text: 'hi' });
		await react(bob, aliceNote, 'like');
		await react(carol, aliceNote, 'like');

		const res = await api('notes/reactions', {
			noteId: aliceNote.id,
		}, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(Array.isArray(res.body), true);
		assert.strictEqual(res.body.some((reaction: any) => reaction.userId === bob.id), true);
		assert.strictEqual(res.body.some((reaction: any) => reaction.userId === carol.id), false);
	});
});
