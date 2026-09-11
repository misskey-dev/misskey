/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import * as crypto from 'node:crypto';
import { inspect } from 'node:util';
import * as OTPAuth from 'otpauth';
import { loadConfig } from '@/config.js';
import {
	api,
	authApi,
	signup,
	sendEnvUpdateRequest,
	assertSigninFinished,
	assertSigninPending,
	assertPasskeyRequested,
} from '../utils.js';
import { webauthnAuthenticationResponse, webauthnRegistrationResponse } from '../webauthn.js';
import type {
	PublicKeyCredentialCreationOptionsJSON,
	PublicKeyCredentialRequestOptionsJSON,
	RegistrationResponseJSON,
} from '@simplewebauthn/server';
import type * as misskey from 'misskey-js';
import { describe, beforeAll, beforeEach, test } from 'vitest';

describe('2要素認証', () => {
	let alice: misskey.entities.SignupResponse;

	const config = loadConfig();
	const password = 'test';
	const username = 'alice';

	const otpToken = (secret: string): string => {
		return OTPAuth.TOTP.generate({
			secret: OTPAuth.Secret.fromBase32(secret),
			digits: 6,
		});
	};

	const keyDoneParam = (param: {
		/** TOTP を設定していないユーザーでは不要 (`i/2fa/passkey/done` 側も nullable) */
		token?: string,
		keyName: string,
		credentialId: Uint8Array,
		creationOptions: PublicKeyCredentialCreationOptionsJSON,
	}): {
		token?: string,
		password: string,
		name: string,
		credential: RegistrationResponseJSON,
	} => {
		return {
			password,
			token: param.token,
			name: param.keyName,
			credential: webauthnRegistrationResponse({
				credentialId: param.credentialId,
				creationOptions: param.creationOptions,
			}),
		};
	};

	//#region サインイン
	const signinInit = async (): Promise<misskey.entities.SigninInitResponse> => {
		const res = await authApi<misskey.entities.SigninInitResponse>('signin/init', {});
		assert.strictEqual(res.status, 200, inspect(res.body));
		return res.body;
	};

	const signinContinue = async (sessionId: string, body: object) => {
		return await authApi<misskey.entities.SigninContinueResponse>('signin/continue', { sessionId, ...body });
	};

	/**
	 * ユーザー名 → パスワード → (`token` を渡したときは) TOTP と進める。
	 * 第 2 要素を要求されたり失敗したりしたら、その時点の応答と `sessionId` をそのまま返す。
	 */
	const signinWithPassword = async (param?: {
		token?: string,
	}): Promise<{ sessionId: string, status: number, body: misskey.entities.SigninContinueResponse }> => {
		const { sessionId } = await signinInit();

		let res = await signinContinue(sessionId, { username });
		if (res.status !== 200 || res.body.finished) return { sessionId, ...res };

		res = await signinContinue(sessionId, { password });
		if (res.status !== 200 || res.body.finished || param?.token === undefined) return { sessionId, ...res };

		res = await signinContinue(sessionId, { token: param.token });
		return { sessionId, ...res };
	};

	/** サーバーが要求してきたパスキーの challenge に assertion を返す */
	const signinContinueWithPasskey = async (sessionId: string, param: {
		credentialId: Uint8Array,
		requestOptions: PublicKeyCredentialRequestOptionsJSON,
	}) => {
		return await signinContinue(sessionId, {
			passkeyCredential: webauthnAuthenticationResponse(param),
		});
	};

	/**
	 * パスワードレスログイン。ユーザー名すら送らず、`init` が発行する匿名 challenge に
	 * assertion を返すだけで完了する (ブラウザの Conditional Mediation と同じ経路)。
	 */
	const signinPasswordLess = async (credentialId: Uint8Array) => {
		const init = await signinInit();
		assert.notEqual(init.passkeyOptions.challenge, undefined);

		return await signinContinueWithPasskey(init.sessionId, {
			credentialId,
			requestOptions: init.passkeyOptions,
		});
	};

	//#endregion

	beforeAll(async () => {
		alice = await signup({ username, password });
	}, 1000 * 60 * 2);

	beforeEach(async () => {
		await sendEnvUpdateRequest({ key: 'MISSKEY_TEST_CHECK_DUPLICATED_TOTP', value: '' });
	});

	test('が設定でき、OTPでログインできる。', async () => {
		const registerResponse = await api('i/2fa/totp/register', {
			password,
		}, alice);
		assert.strictEqual(registerResponse.status, 200);
		assert.notEqual(registerResponse.body.qr, undefined);
		assert.notEqual(registerResponse.body.url, undefined);
		assert.notEqual(registerResponse.body.secret, undefined);
		assert.strictEqual(registerResponse.body.label, username);
		assert.strictEqual(registerResponse.body.issuer, config.host);

		const doneResponse = await api('i/2fa/totp/done', {
			token: otpToken(registerResponse.body.secret),
		}, alice);
		assert.strictEqual(doneResponse.status, 200);

		const signinWithoutTokenResponse = await signinWithPassword();
		assert.strictEqual(signinWithoutTokenResponse.status, 200);
		assertSigninPending(signinWithoutTokenResponse.body);
		assert.strictEqual(signinWithoutTokenResponse.body.next, 'totp');

		const signinResponse = await signinWithPassword({
			token: otpToken(registerResponse.body.secret),
		});
		assert.strictEqual(signinResponse.status, 200);
		assertSigninFinished(signinResponse.body);
		assert.notEqual(signinResponse.body.i, undefined);

		// 後片付け
		await api('i/2fa/totp/remove', {
			password,
			token: otpToken(registerResponse.body.secret),
		}, alice);
	});

	test('が設定でき、セキュリティキーでログインできる。', async () => {
		const registerResponse = await api('i/2fa/totp/register', {
			password,
		}, alice);
		assert.strictEqual(registerResponse.status, 200);

		const doneResponse = await api('i/2fa/totp/done', {
			token: otpToken(registerResponse.body.secret),
		}, alice);
		assert.strictEqual(doneResponse.status, 200);

		const registerKeyResponse = await api('i/2fa/passkey/register', {
			password,
			token: otpToken(registerResponse.body.secret),
		}, alice);
		assert.strictEqual(registerKeyResponse.status, 200);
		assert.notEqual(registerKeyResponse.body.rp, undefined);
		assert.notEqual(registerKeyResponse.body.challenge, undefined);

		const keyName = 'example-key';
		const credentialId = crypto.randomBytes(0x41);
		const keyDoneResponse = await api('i/2fa/passkey/done', keyDoneParam({
			token: otpToken(registerResponse.body.secret),
			keyName,
			credentialId,
			creationOptions: registerKeyResponse.body,
		} as any) as any, alice);
		assert.strictEqual(keyDoneResponse.status, 200);
		assert.strictEqual(keyDoneResponse.body.id, credentialId.toString('base64url'));
		assert.strictEqual(keyDoneResponse.body.name, keyName);

		const signinResponse = await signinWithPassword();
		assert.strictEqual(signinResponse.status, 200);
		assertSigninPending(signinResponse.body);
		// TOTP とパスキーのどちらでも第 2 要素を満たせるので、サーバーは両方を案内する
		assert.strictEqual(signinResponse.body.next, 'totpOrPasskey');
		const requestOptions = assertPasskeyRequested(signinResponse.body);
		assert.notEqual(requestOptions.challenge, undefined);
		assert.notEqual(requestOptions.allowCredentials, undefined);
		assert.strictEqual(requestOptions.allowCredentials && requestOptions.allowCredentials[0]?.id, credentialId.toString('base64url'));

		const signinResponse2 = await signinContinueWithPasskey(signinResponse.sessionId, {
			credentialId,
			requestOptions,
		});
		assert.strictEqual(signinResponse2.status, 200);
		assertSigninFinished(signinResponse2.body);
		assert.notEqual(signinResponse2.body.i, undefined);

		// 後片付け
		await api('i/2fa/totp/remove', {
			password,
			token: otpToken(registerResponse.body.secret),
		}, alice);
	});

	test('が設定でき、セキュリティキーでパスワードレスログインできる。', async () => {
		const registerResponse = await api('i/2fa/totp/register', {
			password,
		}, alice);
		assert.strictEqual(registerResponse.status, 200);

		const doneResponse = await api('i/2fa/totp/done', {
			token: otpToken(registerResponse.body.secret),
		}, alice);
		assert.strictEqual(doneResponse.status, 200);

		const registerKeyResponse = await api('i/2fa/passkey/register', {
			token: otpToken(registerResponse.body.secret),
			password,
		}, alice);
		assert.strictEqual(registerKeyResponse.status, 200);

		const keyName = 'example-key';
		const credentialId = crypto.randomBytes(0x41);
		const keyDoneResponse = await api('i/2fa/passkey/done', keyDoneParam({
			token: otpToken(registerResponse.body.secret),
			keyName,
			credentialId,
			creationOptions: registerKeyResponse.body,
		} as any) as any, alice);
		assert.strictEqual(keyDoneResponse.status, 200);

		const passwordLessResponse = await api('i/2fa/passkey/password-less', {
			value: true,
		}, alice);
		assert.strictEqual(passwordLessResponse.status, 204);

		const iResponse = await api('i', {}, alice);
		assert.strictEqual(iResponse.status, 200);
		assert.strictEqual(iResponse.body.usePasswordLessLogin, true);

		// ユーザー名もパスワードも送らず、init が発行した匿名 challenge だけで完了する
		const signinResponse = await signinPasswordLess(credentialId);
		assert.strictEqual(signinResponse.status, 200);
		assertSigninFinished(signinResponse.body);
		assert.notEqual(signinResponse.body.i, undefined);

		// 後片付け
		await api('i/2fa/totp/remove', {
			password,
			token: otpToken(registerResponse.body.secret),
		}, alice);
	});

	test('が設定でき、設定したセキュリティキーの名前を変更できる。', async () => {
		const registerResponse = await api('i/2fa/totp/register', {
			password,
		}, alice);
		assert.strictEqual(registerResponse.status, 200);

		const doneResponse = await api('i/2fa/totp/done', {
			token: otpToken(registerResponse.body.secret),
		}, alice);
		assert.strictEqual(doneResponse.status, 200);

		const registerKeyResponse = await api('i/2fa/passkey/register', {
			token: otpToken(registerResponse.body.secret),
			password,
		}, alice);
		assert.strictEqual(registerKeyResponse.status, 200);

		const keyName = 'example-key';
		const credentialId = crypto.randomBytes(0x41);
		const keyDoneResponse = await api('i/2fa/passkey/done', keyDoneParam({
			token: otpToken(registerResponse.body.secret),
			keyName,
			credentialId,
			creationOptions: registerKeyResponse.body,
		} as any) as any, alice);
		assert.strictEqual(keyDoneResponse.status, 200);

		const renamedKey = 'other-key';
		const updateKeyResponse = await api('i/2fa/passkey/update', {
			name: renamedKey,
			credentialId: credentialId.toString('base64url'),
		}, alice);
		assert.strictEqual(updateKeyResponse.status, 200);

		const iResponse = await api('i', {
		}, alice);
		assert.strictEqual(iResponse.status, 200);
		assert.ok(iResponse.body.securityKeysList);
		const securityKeys = iResponse.body.securityKeysList.filter((s: { id: string; }) => s.id === credentialId.toString('base64url'));
		assert.strictEqual(securityKeys.length, 1);
		assert.strictEqual(securityKeys[0].name, renamedKey);
		assert.notEqual(securityKeys[0].lastUsed, undefined);

		// 後片付け
		await api('i/2fa/totp/remove', {
			password,
			token: otpToken(registerResponse.body.secret),
		}, alice);
	});

	test('が設定でき、設定したセキュリティキーを削除できる。', async () => {
		const registerResponse = await api('i/2fa/totp/register', {
			password,
		}, alice);
		assert.strictEqual(registerResponse.status, 200);

		const doneResponse = await api('i/2fa/totp/done', {
			token: otpToken(registerResponse.body.secret),
		}, alice);
		assert.strictEqual(doneResponse.status, 200);

		const registerKeyResponse = await api('i/2fa/passkey/register', {
			token: otpToken(registerResponse.body.secret),
			password,
		}, alice);
		assert.strictEqual(registerKeyResponse.status, 200);

		const keyName = 'example-key';
		const credentialId = crypto.randomBytes(0x41);
		const keyDoneResponse = await api('i/2fa/passkey/done', keyDoneParam({
			token: otpToken(registerResponse.body.secret),
			keyName,
			credentialId,
			creationOptions: registerKeyResponse.body,
		} as any) as any, alice);
		assert.strictEqual(keyDoneResponse.status, 200);

		// テストの実行順によっては複数残ってるので全部消す
		const beforeIResponse = await api('i', {
		}, alice);
		assert.strictEqual(beforeIResponse.status, 200);
		assert.ok(beforeIResponse.body.securityKeysList);
		for (const key of beforeIResponse.body.securityKeysList) {
			const removeKeyResponse = await api('i/2fa/passkey/remove', {
				token: otpToken(registerResponse.body.secret),
				password,
				credentialId: key.id,
			}, alice);
			assert.strictEqual(removeKeyResponse.status, 200);
		}

		const afterIResponse = await api('i', {}, alice);
		assert.strictEqual(afterIResponse.status, 200);
		assert.strictEqual(afterIResponse.body.securityKeys, false);

		const signinResponse = await signinWithPassword({
			token: otpToken(registerResponse.body.secret),
		});
		assert.strictEqual(signinResponse.status, 200);
		assertSigninFinished(signinResponse.body);
		assert.notEqual(signinResponse.body.i, undefined);

		// 後片付け
		await api('i/2fa/totp/remove', {
			password,
			token: otpToken(registerResponse.body.secret),
		}, alice);
	});

	test('が設定でき、設定解除できる。（パスワードのみでログインできる。）', async () => {
		const registerResponse = await api('i/2fa/totp/register', {
			password,
		}, alice);
		assert.strictEqual(registerResponse.status, 200);

		const doneResponse = await api('i/2fa/totp/done', {
			token: otpToken(registerResponse.body.secret),
		}, alice);
		assert.strictEqual(doneResponse.status, 200);

		const iResponse = await api('i', {}, alice);
		assert.strictEqual(iResponse.status, 200);
		assert.strictEqual(iResponse.body.twoFactorEnabled, true);

		const unregisterResponse = await api('i/2fa/totp/remove', {
			token: otpToken(registerResponse.body.secret),
			password,
		}, alice);
		assert.strictEqual(unregisterResponse.status, 204);

		const signinResponse = await signinWithPassword();
		assert.strictEqual(signinResponse.status, 200);
		assertSigninFinished(signinResponse.body);
		assert.notEqual(signinResponse.body.i, undefined);

		// 後片付け
		await api('i/2fa/totp/remove', {
			password,
			token: otpToken(registerResponse.body.secret),
		}, alice);
	});

	test('のTOTPトークンは一度使うと同じトークンは再利用できない。', async () => {
		await sendEnvUpdateRequest({ key: 'MISSKEY_TEST_CHECK_DUPLICATED_TOTP', value: '1' });

		const registerResponse = await api('i/2fa/totp/register', {
			password,
		}, alice);
		assert.strictEqual(registerResponse.status, 200);

		const sharedOtpToken = otpToken(registerResponse.body.secret);
		const doneResponse = await api('i/2fa/totp/done', {
			token: sharedOtpToken,
		}, alice);
		assert.strictEqual(doneResponse.status, 200);

		const signinResponse = await signinWithPassword({ token: sharedOtpToken });
		assert.strictEqual(signinResponse.status, 403);

		await sendEnvUpdateRequest({ key: 'MISSKEY_TEST_CHECK_DUPLICATED_TOTP', value: '' });

		// 後片付け
		await api('i/2fa/totp/remove', {
			password,
			token: otpToken(registerResponse.body.secret),
		}, alice);
	});

	describe('を設定していないユーザーでも、', () => {
		/** 鍵を登録し、その credentialId を返す */
		const registerPasskeyWithoutTotp = async (keyName: string): Promise<Buffer> => {
			const registerKeyResponse = await api('i/2fa/passkey/register', {
				password,
			}, alice);
			assert.strictEqual(registerKeyResponse.status, 200);
			assert.notEqual(registerKeyResponse.body.rp, undefined);
			assert.notEqual(registerKeyResponse.body.challenge, undefined);

			const credentialId = crypto.randomBytes(0x41);
			const keyDoneResponse = await api('i/2fa/passkey/done', keyDoneParam({
				keyName,
				credentialId,
				creationOptions: registerKeyResponse.body,
			} as any) as any, alice);
			assert.strictEqual(keyDoneResponse.status, 200);
			assert.strictEqual(keyDoneResponse.body.id, credentialId.toString('base64url'));
			assert.strictEqual(keyDoneResponse.body.name, keyName);

			return credentialId;
		};

		beforeEach(async () => {
			// TOTP が残っていても secret が無く解除できないので、assert で検知する
			const iResponse = await api('i', {}, alice);
			assert.strictEqual(iResponse.status, 200);
			assert.strictEqual(iResponse.body.twoFactorEnabled, false, 'TOTP が有効なままでは「TOTP なし」を検証できない');

			// 鍵 0 個の状態から始める
			for (const key of iResponse.body.securityKeysList ?? []) {
				const removeKeyResponse = await api('i/2fa/passkey/remove', {
					password,
					credentialId: key.id,
				}, alice);
				assert.strictEqual(removeKeyResponse.status, 200);
			}
		});

		test('パスキーを登録でき、一覧に現れる。', async () => {
			const keyName = 'passkey-without-totp';
			const credentialId = await registerPasskeyWithoutTotp(keyName);

			const iResponse = await api('i', {}, alice);
			assert.strictEqual(iResponse.status, 200);
			assert.strictEqual(iResponse.body.twoFactorEnabled, false);
			assert.strictEqual(iResponse.body.securityKeys, true);
			assert.ok(iResponse.body.securityKeysList);
			assert.strictEqual(iResponse.body.securityKeysList.length, 1);
			assert.strictEqual(iResponse.body.securityKeysList[0].id, credentialId.toString('base64url'));
			assert.strictEqual(iResponse.body.securityKeysList[0].name, keyName);

			// 後片付け
			const removeKeyResponse = await api('i/2fa/passkey/remove', {
				password,
				credentialId: credentialId.toString('base64url'),
			}, alice);
			assert.strictEqual(removeKeyResponse.status, 200);

			const afterIResponse = await api('i', {}, alice);
			assert.strictEqual(afterIResponse.status, 200);
			assert.strictEqual(afterIResponse.body.securityKeys, false);
		});

		test('パスキーでパスワードレスログインを有効にできる。', async () => {
			const credentialId = await registerPasskeyWithoutTotp('passwordless-without-totp');

			const passwordLessResponse = await api('i/2fa/passkey/password-less', {
				value: true,
			}, alice);
			assert.strictEqual(passwordLessResponse.status, 204);

			const iResponse = await api('i', {}, alice);
			assert.strictEqual(iResponse.status, 200);
			assert.strictEqual(iResponse.body.twoFactorEnabled, false);
			assert.strictEqual(iResponse.body.usePasswordLessLogin, true);

			// 後片付け
			// (`i/2fa/passkey/remove` は最後の鍵を消すと usePasswordLessLogin も落とす)
			const removeKeyResponse = await api('i/2fa/passkey/remove', {
				password,
				credentialId: credentialId.toString('base64url'),
			}, alice);
			assert.strictEqual(removeKeyResponse.status, 200);

			const afterIResponse = await api('i', {}, alice);
			assert.strictEqual(afterIResponse.status, 200);
			assert.strictEqual(afterIResponse.body.usePasswordLessLogin, false);
		});
	});
});
