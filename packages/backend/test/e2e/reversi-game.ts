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

	test('matches when alice invites bob', async () => {
		const response: { body: ReversiMatchResponse } = await api('reversi/match', { userId: bob.id }, alice);

		assert.strictEqual(response.body.user1.id, alice.id);
		assert.strictEqual(response.body.user2.id, bob.id);
	});
});
