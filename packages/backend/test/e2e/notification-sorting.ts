/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { api, post, signup } from '../utils.js';
import type * as misskey from 'misskey-js';

describe('Notification Sorting', () => {
	let alice: misskey.entities.SignupResponse;
	let bob: misskey.entities.SignupResponse;

	beforeAll(async () => {
		alice = await signup({ username: 'alice' });
		bob = await signup({ username: 'bob' });
	}, 1000 * 60 * 2);

	test('notifications are sorted correctly when oldest first is requested', async () => {
		// Create some notifications by having Bob mention Alice
		const note1 = await post(bob, { text: '@alice first mention' });
		await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
		const note2 = await post(bob, { text: '@alice second mention' });
		await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
		const note3 = await post(bob, { text: '@alice third mention' });

		// Test newest first (default)
		const newestFirstRes = await api('i/notifications', {
			includeTypes: ['mention'],
			limit: 10,
		}, alice);

		assert.strictEqual(newestFirstRes.status, 200);
		const newestFirst = newestFirstRes.body.filter(n => n.type === 'mention');
		assert.strictEqual(newestFirst.length >= 3, true);
		
		// Verify newest first order (note3 should be first)
		const newestFirstIds = newestFirst.map(n => n.note.id);
		const note3Index = newestFirstIds.indexOf(note3.id);
		const note1Index = newestFirstIds.indexOf(note1.id);
		assert.strictEqual(note3Index < note1Index, true);

		// Test oldest first with sinceId: '0'
		const oldestFirstRes = await api('i/notifications', {
			includeTypes: ['mention'],
			sinceId: '0',
			limit: 10,
		}, alice);

		assert.strictEqual(oldestFirstRes.status, 200);
		const oldestFirst = oldestFirstRes.body.filter(n => n.type === 'mention');
		assert.strictEqual(oldestFirst.length >= 3, true);
		
		// Verify oldest first order (note1 should be first)
		const oldestFirstIds = oldestFirst.map(n => n.note.id);
		const note1IndexOldest = oldestFirstIds.indexOf(note1.id);
		const note3IndexOldest = oldestFirstIds.indexOf(note3.id);
		assert.strictEqual(note1IndexOldest < note3IndexOldest, true);
	});
});