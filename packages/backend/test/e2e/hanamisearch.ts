/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import type * as misskey from 'misskey-js';
import { api, signup } from '../utils.js';

describe('HanamiSearch', () => {
	let root: misskey.entities.SignupResponse;
	let alice: misskey.entities.SignupResponse;

	const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

	beforeAll(async () => {
		root = await signup({ username: 'root' });
		alice = await signup({ username: 'alice' });
	}, 1000 * 60 * 2);

	test('検索結果に凍結されたユーザーの投稿が含まれない', async () => {
		const user = await signup({ username: 'search_suspended_user' });
		const suspendedText = 'search_suspended_note';
		const visibleText = `${suspendedText} visible`;

		await api('notes/create', { text: suspendedText }, user);
		await api('notes/create', { text: visibleText }, alice);
		await api('admin/suspend-user', { userId: user.id }, root);
		// indexに反映されるまで待つ(indexが終わったことを確認できないので時間を目分量で決める)
		await wait(10000);

		const res = await api('notes/hanamisearch-v1', {
			query: suspendedText,
		}, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(Array.isArray(res.body), true);
		assert.strictEqual(res.body.some(note => note.userId === user.id), false);
		assert.strictEqual(res.body.some(note => note.text === visibleText), true);
	});

	test('検索結果の先頭候補がフィルタで除外されても次の候補を返す', async () => {
		const viewer = await signup({ username: 'search_filter_viewer' });
		const mutee = await signup({ username: 'search_filter_mutee' });
		const query = 'search_filtered_empty_page';
		const visibleText = `${query} visible`;
		const mutedText = `${query} muted`;

		await api('notes/create', { text: visibleText }, alice);
		await api('notes/create', { text: mutedText }, mutee);
		await api('mute/create', { userId: mutee.id }, viewer);
		// indexに反映されるまで待つ(indexが終わったことを確認できないので時間を目分量で決める)
		await wait(10000);

		const res = await api('notes/hanamisearch-v1', {
			query,
			limit: 1,
		}, viewer);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(Array.isArray(res.body), true);
		assert.strictEqual(res.body.length, 1);
		assert.strictEqual(res.body[0].text, visibleText);
	});
});
