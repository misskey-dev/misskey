/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import * as crypto from 'node:crypto';
import * as OTPAuth from 'otpauth';
import { describe, beforeAll, test } from 'vitest';
import { MiUserProfile } from '@/models/_.js';
import {
	api,
	authApi,
	initTestDb,
	signinFlow,
	signup,
	assertSigninFinished,
	assertSigninPending,
	assertPasskeyRequested,
} from '../utils.js';
import { webauthnAuthenticationResponse, webauthnRegistrationResponse } from '../webauthn.js';
import type { AuthApiErrorResponse } from '../utils.js';
import type * as misskey from 'misskey-js';

//#region エラー ID (SigninApiService と対応)
const ERR_INCORRECT_PASSWORD = '932c904e-9460-45b7-9ce6-7ed33be7eb2c';
const ERR_INVALID_SIGNIN_SESSION = '8e385d0a-bee2-43f3-a8cf-3fdd54da7446';
const ERR_PASSWORDLESS_DISABLED = '2d84773e-f7b7-4d0b-8f72-bb69b584c912';
const ERR_SUSPENDED = 'e03a5f46-d309-4865-9b69-56282d94e1eb';
const ERR_UNKNOWN_WEBAUTHN_KEY = '36b96a7d-b547-412d-aeed-2d611cdc8cdc';
//#endregion

/**
 * サインイン (`POST /auth/signin/init` と `POST /auth/signin/continue`)。
 * 2 要素認証の設定と絡む正常系は `2fa.ts` を参照。
 *
 * NOTE: `RateLimiterService` は `NODE_ENV !== 'production'` で自己無効化するため、
 * ここではレートリミットを検証できない。
 */
describe('サインイン', () => {
	const password = 'test';
	let alice: misskey.entities.SignupResponse;

	const init = async (): Promise<misskey.entities.SigninInitResponse> => {
		const res = await authApi<misskey.entities.SigninInitResponse>('signin/init', {});
		assert.strictEqual(res.status, 200);
		return res.body;
	};

	/** 型引数だけが違う 2 つの `continue`。成功を期待する側 */
	const cont = async (body: object) => {
		return await authApi<misskey.entities.SigninContinueResponse>('signin/continue', body);
	};

	/** 失敗を期待する側 (`/auth` のエラーは `{ error: { id } }`) */
	const contExpectingError = async (body: object) => {
		return await authApi<AuthApiErrorResponse>('signin/continue', body);
	};

	beforeAll(async () => {
		alice = await signup({ username: 'alice', password });
	}, 1000 * 60 * 2);

	describe('基本', () => {
		test('正しい情報でサインインできる', async () => {
			const res = await signinFlow({ username: alice.username, password });

			assert.strictEqual(res.id, alice.id);
			assert.notEqual(res.i, undefined);
		});

		test('間違ったパスワードでサインインできない', async () => {
			const { sessionId } = await init();

			const usernameRes = await cont({ sessionId, username: alice.username });
			assert.strictEqual(usernameRes.status, 200);

			const res = await contExpectingError({ sessionId, password: 'bar' });
			assert.strictEqual(res.status, 403);
			assert.strictEqual(res.body.error.id, ERR_INCORRECT_PASSWORD);

			// パスワードの打ち間違いはセッションを壊さない。同じセッションでやり直せる
			const retried = await cont({ sessionId, password });
			assert.strictEqual(retried.status, 200);
			assertSigninFinished(retried.body);
		});

		test('クエリをインジェクションできない', async () => {
			const { sessionId } = await init();

			const usernameRes = await cont({ sessionId, username: alice.username });
			assert.strictEqual(usernameRes.status, 200);

			const res = await contExpectingError({
				sessionId,
				// password は文字列でなければならない
				password: { $gt: '' },
			});
			assert.strictEqual(res.status, 400);
		});
	});

	describe('セッションの状態遷移', () => {
		test('存在しない sessionId では続行できない', async () => {
			// セッションは TTL 600 秒で Redis から消える。期限切れ後は「存在しない sessionId」と
			// 区別がつかないので、ここでは発行されていない sessionId で同じ経路を突く
			const res = await contExpectingError({
				sessionId: crypto.randomBytes(24).toString('base64url'),
				username: alice.username,
			});

			assert.strictEqual(res.status, 401);
			assert.strictEqual(res.body.error.id, ERR_INVALID_SIGNIN_SESSION);
		});

		test('sessionId を省略しても続行できない', async () => {
			const res = await contExpectingError({ username: alice.username });

			assert.strictEqual(res.status, 401);
			assert.strictEqual(res.body.error.id, ERR_INVALID_SIGNIN_SESSION);
		});

		test('パスワードを通す前に TOTP のステップへ飛べず、セッションも破棄される', async () => {
			const { sessionId } = await init();

			const usernameRes = await cont({ sessionId, username: alice.username });
			assert.strictEqual(usernameRes.status, 200);

			// 受理できる手段を決めるのはサーバー側のポリシーであって、クライアントが送る順序ではない
			const skipped = await contExpectingError({ sessionId, token: '000000' });
			assert.strictEqual(skipped.status, 400);

			// ポリシー違反はセッションごと破棄する (やり直しはさせない)
			const afterwards = await contExpectingError({ sessionId, password });
			assert.strictEqual(afterwards.status, 401);
			assert.strictEqual(afterwards.body.error.id, ERR_INVALID_SIGNIN_SESSION);
		});

		test('1 つのリクエストに 2 つの手段を入れられず、セッションも破棄される', async () => {
			const { sessionId } = await init();

			// 1 リクエスト = 1 ステップ。ユーザー名とパスワードを同時に送ると、
			// どちらが検証されたのか曖昧なままセッションが進んでしまうので受理しない
			const res = await contExpectingError({ sessionId, username: alice.username, password });
			assert.strictEqual(res.status, 400);

			const afterwards = await contExpectingError({ sessionId, username: alice.username });
			assert.strictEqual(afterwards.status, 401);
			assert.strictEqual(afterwards.body.error.id, ERR_INVALID_SIGNIN_SESSION);
		});

		test('サインインが完了した sessionId は再利用できない', async () => {
			const { sessionId } = await init();

			const usernameRes = await cont({ sessionId, username: alice.username });
			assert.strictEqual(usernameRes.status, 200);

			const passwordRes = await cont({ sessionId, password });
			assert.strictEqual(passwordRes.status, 200);
			assertSigninFinished(passwordRes.body);

			// 使い終わったセッションは削除済み。トークンを 2 枚目以降発行させない
			const replayed = await contExpectingError({ sessionId, username: alice.username });
			assert.strictEqual(replayed.status, 401);
			assert.strictEqual(replayed.body.error.id, ERR_INVALID_SIGNIN_SESSION);
		});
	});

	describe('匿名パスキー', () => {
		test('パスワードレスログインを有効にしていないユーザーは入れない', async () => {
			// パスキーは登録するが、`usePasswordLessLogin` は既定の false のままにする
			const registerKeyResponse = await api('i/2fa/passkey/register', { password }, alice);
			assert.strictEqual(registerKeyResponse.status, 200);

			const credentialId = crypto.randomBytes(0x41);
			const keyDoneResponse = await api('i/2fa/passkey/done', {
				password,
				name: 'passwordless-disabled',
				credential: webauthnRegistrationResponse({
					credentialId,
					creationOptions: registerKeyResponse.body,
				}),
			}, alice);
			assert.strictEqual(keyDoneResponse.status, 200);

			const iResponse = await api('i', {}, alice);
			assert.strictEqual(iResponse.status, 200);
			assert.strictEqual(iResponse.body.usePasswordLessLogin, false);

			const { sessionId, passkeyOptions } = await init();

			// パスキーを検証できてもパスワードレスが無効なら入れない。ユーザーだけ確定して
			// 先へ進めると、captcha を検証するユーザー名のステップを通らない迂回路になる
			const res = await contExpectingError({
				sessionId,
				passkeyCredential: webauthnAuthenticationResponse({ credentialId, requestOptions: passkeyOptions }),
			});
			assert.strictEqual(res.status, 403);
			assert.strictEqual(res.body.error.id, ERR_PASSWORDLESS_DISABLED);

			// 中途半端に認証済みのセッションを残さない
			const afterwards = await contExpectingError({ sessionId, password });
			assert.strictEqual(afterwards.status, 401);
			assert.strictEqual(afterwards.body.error.id, ERR_INVALID_SIGNIN_SESSION);

			// 後片付け
			const removeKeyResponse = await api('i/2fa/passkey/remove', {
				password,
				credentialId: credentialId.toString('base64url'),
			}, alice);
			assert.strictEqual(removeKeyResponse.status, 200);
		});

		test('登録されていないパスキーは弾かれ、セッションも破棄される', async () => {
			const { sessionId, passkeyOptions } = await init();

			const res = await contExpectingError({
				sessionId,
				passkeyCredential: webauthnAuthenticationResponse({
					credentialId: crypto.randomBytes(0x41),
					requestOptions: passkeyOptions,
				}),
			});
			assert.strictEqual(res.status, 403);
			// WebAuthnService が投げた ID をそのまま伝える (クライアントはこれで文言を出し分ける)
			assert.strictEqual(res.body.error.id, ERR_UNKNOWN_WEBAUTHN_KEY);

			// challenge は単回使用なので、このセッションではもうパスキーを出し直せない
			const afterwards = await contExpectingError({ sessionId, username: alice.username });
			assert.strictEqual(afterwards.status, 401);
			assert.strictEqual(afterwards.body.error.id, ERR_INVALID_SIGNIN_SESSION);
		});
	});

	describe('第 2 要素が複数あるとき', () => {
		let bob: misskey.entities.SignupResponse;
		let totpSecret: string;
		const credentialId = crypto.randomBytes(0x41);

		const otpToken = (secret: string): string => {
			return OTPAuth.TOTP.generate({
				secret: OTPAuth.Secret.fromBase32(secret),
				digits: 6,
			});
		};

		beforeAll(async () => {
			bob = await signup({ username: 'bob', password });

			// TOTP を有効にする前に登録しておくと、パスキー側のリクエストに token が要らない
			const registerKeyResponse = await api('i/2fa/passkey/register', { password }, bob);
			assert.strictEqual(registerKeyResponse.status, 200);

			const keyDoneResponse = await api('i/2fa/passkey/done', {
				password,
				name: 'both-factors',
				credential: webauthnRegistrationResponse({
					credentialId,
					creationOptions: registerKeyResponse.body,
				}),
			}, bob);
			assert.strictEqual(keyDoneResponse.status, 200);

			const totpRegisterResponse = await api('i/2fa/totp/register', { password }, bob);
			assert.strictEqual(totpRegisterResponse.status, 200);
			totpSecret = totpRegisterResponse.body.secret;

			const totpDoneResponse = await api('i/2fa/totp/done', { token: otpToken(totpSecret) }, bob);
			assert.strictEqual(totpDoneResponse.status, 200);
		}, 1000 * 60 * 2);

		/** ユーザー名 → パスワードまで進め、第 2 要素を要求している応答を返す */
		const untilSecondFactor = async () => {
			const { sessionId } = await init();

			const usernameRes = await cont({ sessionId, username: bob.username });
			assert.strictEqual(usernameRes.status, 200);

			const passwordRes = await cont({ sessionId, password });
			assert.strictEqual(passwordRes.status, 200);
			assertSigninPending(passwordRes.body);
			assert.strictEqual(passwordRes.body.next, 'totpOrPasskey');

			return { sessionId, body: passwordRes.body };
		};

		// 案内は 1 つに畳まれるが、受理する手段は畳まれない。どちらを送っても完了する
		test('TOTP で完了できる', async () => {
			const { sessionId } = await untilSecondFactor();

			const res = await cont({ sessionId, token: otpToken(totpSecret) });
			assert.strictEqual(res.status, 200);
			assertSigninFinished(res.body);
			assert.strictEqual(res.body.id, bob.id);
		});

		test('パスキーで完了できる', async () => {
			const { sessionId, body } = await untilSecondFactor();
			const requestOptions = assertPasskeyRequested(body);

			const res = await cont({
				sessionId,
				passkeyCredential: webauthnAuthenticationResponse({ credentialId, requestOptions }),
			});
			assert.strictEqual(res.status, 200);
			assertSigninFinished(res.body);
			assert.strictEqual(res.body.id, bob.id);
		});
	});

	describe('パスワードが設定されていないアカウント', () => {
		let carol: misskey.entities.SignupResponse;

		beforeAll(async () => {
			carol = await signup({ username: 'carol', password });

			// パスワードを持たないローカルアカウントを作る API が無いので、DB から直接消す
			const connection = await initTestDb(true);
			await connection.getRepository(MiUserProfile).update({ userId: carol.id }, { password: null });
			await connection.destroy();
		}, 1000 * 60 * 2);

		// パスワード未設定であることを、パスワードの誤りと区別できるシグナルにしない
		// (応答時間を揃えるダミー bcrypt 比較そのものはここでは検証できない)
		test('パスワードの誤りと同じエラーになり、セッションも維持される', async () => {
			const { sessionId } = await init();

			const usernameRes = await cont({ sessionId, username: carol.username });
			assert.strictEqual(usernameRes.status, 200);
			assertSigninPending(usernameRes.body);
			assert.strictEqual(usernameRes.body.next, 'password');

			const res = await contExpectingError({ sessionId, password });
			assert.strictEqual(res.status, 403);
			assert.strictEqual(res.body.error.id, ERR_INCORRECT_PASSWORD);

			const retried = await contExpectingError({ sessionId, password: 'bar' });
			assert.strictEqual(retried.status, 403);
			assert.strictEqual(retried.body.error.id, ERR_INCORRECT_PASSWORD);
		});
	});

	describe('凍結', () => {
		let dave: misskey.entities.SignupResponse;

		beforeAll(async () => {
			dave = await signup({ username: 'dave', password });
		}, 1000 * 60 * 2);

		test('ステップを通過した後に凍結されると、完了させてもらえない', async () => {
			const { sessionId } = await init();

			const usernameRes = await cont({ sessionId, username: dave.username });
			assert.strictEqual(usernameRes.status, 200);

			// alice は最初にサインアップしたユーザーなので管理者
			const suspendRes = await api('admin/suspend-user', { userId: dave.id }, alice);
			assert.strictEqual(suspendRes.status, 204);

			// セッションの寿命は 600 秒あるので、進行中に凍結されうる。
			// ユーザー名のステップで見た状態のまま完了させてはいけない
			const res = await contExpectingError({ sessionId, password });
			assert.strictEqual(res.status, 403);
			assert.strictEqual(res.body.error.id, ERR_SUSPENDED);
		});
	});
});
