/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { randomUUID } from 'node:crypto';
import { beforeAll, describe, test } from 'vitest';
import { api, createAppToken, failedApiCall, signup, successfulApiCall } from '../utils.js';
import type * as misskey from 'misskey-js';

describe('Service Worker push subscriptions', () => {
	let alice: misskey.entities.SignupResponse;

	beforeAll(async () => {
		alice = await signup({ username: 'alice' });
	}, 1000 * 60 * 2);

	const createSubscriptionParams = () => ({
		endpoint: `https://push.example.com/${randomUUID()}`,
		auth: randomUUID(),
		publickey: randomUUID(),
	});

	test('ネイティブトークンで登録・参照・更新できる', async () => {
		const params = createSubscriptionParams();

		const registered = await successfulApiCall({
			endpoint: 'sw/register',
			parameters: params,
			user: alice,
		});
		assert.strictEqual(registered.state, 'subscribed');
		assert.strictEqual(registered.userId, alice.id);

		const shown = await successfulApiCall({
			endpoint: 'sw/show-registration',
			parameters: { endpoint: params.endpoint },
			user: alice,
		});
		assert.strictEqual(shown?.endpoint, params.endpoint);

		const updated = await successfulApiCall({
			endpoint: 'sw/update-registration',
			parameters: { endpoint: params.endpoint, sendReadMessage: true },
			user: alice,
		});
		assert.strictEqual(updated.sendReadMessage, true);
	});

	test('write:push-subscriptions と read:notifications 権限を持つアクセストークンで登録・参照・更新できる', async () => {
		const token = await createAppToken(alice, ['write:push-subscriptions', 'read:notifications']);
		const params = createSubscriptionParams();

		const registered = await successfulApiCall({
			endpoint: 'sw/register',
			parameters: params,
			user: { token },
		});
		assert.strictEqual(registered.state, 'subscribed');
		assert.strictEqual(registered.userId, alice.id);

		const shown = await successfulApiCall({
			endpoint: 'sw/show-registration',
			parameters: { endpoint: params.endpoint },
			user: { token },
		});
		assert.strictEqual(shown?.endpoint, params.endpoint);

		const updated = await successfulApiCall({
			endpoint: 'sw/update-registration',
			parameters: { endpoint: params.endpoint, sendReadMessage: true },
			user: { token },
		});
		assert.strictEqual(updated.sendReadMessage, true);
	});

	test('write:push-subscriptions 権限を持たないアクセストークンでは登録できない', async () => {
		const token = await createAppToken(alice, ['read:account']);

		await failedApiCall({
			endpoint: 'sw/register',
			parameters: createSubscriptionParams(),
			user: { token },
		}, {
			status: 403,
			code: 'PERMISSION_DENIED',
			id: '1370e5b7-d4eb-4566-bb1d-7748ee6a1838',
		});
	});

	test('read:notifications 権限を持たないアクセストークンでは登録できない', async () => {
		const token = await createAppToken(alice, ['write:push-subscriptions']);

		await failedApiCall({
			endpoint: 'sw/register',
			parameters: createSubscriptionParams(),
			user: { token },
		}, {
			status: 403,
			code: 'READ_NOTIFICATIONS_PERMISSION_REQUIRED',
			id: '5ca35223-1863-4408-9cb0-40f79ab213c2',
		});
	});

	test('アクセストークンからは他のトークンで登録された購読を参照・更新できない', async () => {
		const token1 = await createAppToken(alice, ['write:push-subscriptions', 'read:notifications']);
		const token2 = await createAppToken(alice, ['write:push-subscriptions', 'read:notifications']);
		const params = createSubscriptionParams();

		await successfulApiCall({
			endpoint: 'sw/register',
			parameters: params,
			user: { token: token1 },
		});

		const shownByOtherToken = await api('sw/show-registration', { endpoint: params.endpoint }, { token: token2 });
		assert.strictEqual(shownByOtherToken.status, 204);

		await failedApiCall({
			endpoint: 'sw/update-registration',
			parameters: { endpoint: params.endpoint, sendReadMessage: true },
			user: { token: token2 },
		}, {
			status: 400,
			code: 'NO_SUCH_REGISTRATION',
			id: ' b09d8066-8064-5613-efb6-0e963b21d012',
		});

		// ネイティブトークンからは参照できる
		const shownByNative = await successfulApiCall({
			endpoint: 'sw/show-registration',
			parameters: { endpoint: params.endpoint },
			user: alice,
		});
		assert.strictEqual(shownByNative?.endpoint, params.endpoint);
	});

	test('アクセストークンを失効させると、そのトークンで登録された購読も削除される', async () => {
		const token = await createAppToken(alice, ['write:push-subscriptions', 'read:notifications']);
		const tokenParams = createSubscriptionParams();
		const nativeParams = createSubscriptionParams();

		await successfulApiCall({
			endpoint: 'sw/register',
			parameters: tokenParams,
			user: { token },
		});
		await successfulApiCall({
			endpoint: 'sw/register',
			parameters: nativeParams,
			user: alice,
		});

		await successfulApiCall({
			endpoint: 'i/revoke-token',
			parameters: { token },
			user: alice,
		});

		const revokedTokenSubscription = await api('sw/show-registration', { endpoint: tokenParams.endpoint }, alice);
		assert.strictEqual(revokedTokenSubscription.status, 204);

		// ネイティブトークンで登録された購読は残る
		const nativeSubscription = await successfulApiCall({
			endpoint: 'sw/show-registration',
			parameters: { endpoint: nativeParams.endpoint },
			user: alice,
		});
		assert.strictEqual(nativeSubscription?.endpoint, nativeParams.endpoint);
	});
});
