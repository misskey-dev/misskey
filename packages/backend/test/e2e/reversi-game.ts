/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { ReversiMatchResponse } from 'misskey-js/entities.js';
import { api, signup } from '../utils.js';
import type * as misskey from 'misskey-js';

describe('ReversiGame', () => {
	let alice: misskey.entities.SignupResponse;
	let bob: misskey.entities.SignupResponse;

	beforeAll(async () => {
		alice = await signup({ username: 'alice' });
		bob = await signup({ username: 'bob' });
	}, 1000 * 60 * 2);

	test('matches when alice invites bob and bob accepts', async () => {
		const response1 = await api('reversi/match', { userId: bob.id }, alice);
		assert.strictEqual(response1.status, 204);
		assert.strictEqual(response1.body, null);
		const response2 = await api('reversi/match', { userId: alice.id }, bob);
		assert.strictEqual(response2.status, 200);
		assert.notStrictEqual(response2.body, null);
		const body = response2.body as ReversiMatchResponse;
		assert.strictEqual(body.user1.id, alice.id);
		assert.strictEqual(body.user2.id, bob.id);
	});
});
