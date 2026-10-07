/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { setTimeout } from 'node:timers/promises';
import * as OTPAuth from 'otpauth';
import { describe, beforeAll, test, expect } from 'vitest';
import { api, failedApiCall, initTestDb, signup, successfulApiCall } from '../utils.js';
import type * as misskey from 'misskey-js';
import { MiUser } from '@/models/_.js';

describe('アカウントの認証', () => {
	let alice: misskey.entities.SignupResponse; // 2FA有効
	let bob: misskey.entities.SignupResponse; // 2FA無効
	let aliceTwoFactorSecret: string;

	const otpToken = (secret: string): string => {
		return OTPAuth.TOTP.generate({
			secret: OTPAuth.Secret.fromBase32(secret),
			digits: 6,
		});
	};

	beforeAll(async () => {
		alice = await signup({ username: 'alice' });
		bob = await signup({ username: 'bob' });

		const registration = await successfulApiCall({
			endpoint: 'i/2fa/register',
			parameters: { password: 'test' },
			user: alice,
		});
		aliceTwoFactorSecret = registration.secret;

		await successfulApiCall({
			endpoint: 'i/2fa/done',
			parameters: { token: otpToken(aliceTwoFactorSecret) },
			user: alice,
		});
	}, 1000 * 60 * 2);

	describe('i/regenerate-token', () => {
		test.each([
			{ label: '二要素認証が無効', getUser: () => bob, getToken: () => undefined },
			{ label: '二要素認証が有効', getUser: () => alice, getToken: () => otpToken(aliceTwoFactorSecret) },
		])('$label の場合、ログイントークンを再生成できる', async ({ getUser, getToken }) => {
			const user = getUser();

			await successfulApiCall({
				endpoint: 'i/regenerate-token',
				parameters: { password: 'test', token: getToken() },
				user,
			}, {
				status: 204,
			});

			const connection = await initTestDb(true);
			let newToken: string;
			try {
				const freshUser = await connection.getRepository(MiUser).findOneByOrFail({ id: user.id });
				assert.ok(freshUser.token);
				newToken = freshUser.token;
				assert.notStrictEqual(newToken, user.token);
			} finally {
				await connection.destroy();
			}

			const me = await successfulApiCall({
				endpoint: 'i',
				parameters: {},
				user: { token: newToken },
			});
			assert.strictEqual(me.id, user.id);

			// トークンキャッシュの無効化イベントが反映されるまで待つ。
			await expect.poll(async () => (await api('i', {}, user)).status, { timeout: 2000, interval: 25 }).toBe(401);
			await failedApiCall({
				endpoint: 'i',
				parameters: {},
				user,
			}, {
				status: 401,
				code: 'AUTHENTICATION_FAILED',
				id: 'b0a7f5f8-dc2f-4171-b91f-de88ad238e14',
			});
			user.token = newToken;
		});

		test('間違ったパスワードではログイントークンを失効させない', async () => {
			await failedApiCall({
				endpoint: 'i/regenerate-token',
				parameters: { password: 'incorrect-password' },
				user: bob,
			}, {
				status: 500,
				code: 'INTERNAL_ERROR',
				id: '5d37dbcb-891e-41ca-a3d6-e690c97775ac',
			});

			// キャッシュ無効化の反映に猶予を置いてから、既存トークンが有効なことを確認する。
			await setTimeout(2000);
			const me = await api('i', {}, bob);
			assert.strictEqual(me.status, 200);
			assert.strictEqual(me.body.id, bob.id);
		});

		test('二要素認証が有効な場合、コードなしではログイントークンを再生成できない', async () => {
			await failedApiCall({
				endpoint: 'i/regenerate-token',
				parameters: { password: 'test' },
				user: alice,
			}, {
				status: 500,
				code: 'INTERNAL_ERROR',
				id: '5d37dbcb-891e-41ca-a3d6-e690c97775ac',
			});

			// キャッシュ無効化の反映に猶予を置いてから、既存トークンが有効なことを確認する。
			await setTimeout(2000);
			const me = await api('i', {}, alice);
			assert.strictEqual(me.status, 200);
			assert.strictEqual(me.body.id, alice.id);
		});
	});
});
