/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import * as crypto from 'node:crypto';
import cbor from 'cbor';
import * as OTPAuth from 'otpauth';
import { loadConfig } from '@/config.js';
import { api, signup } from '../utils.js';
import type {
	AuthenticationResponseJSON,
	AuthenticatorAssertionResponseJSON,
	AuthenticatorAttestationResponseJSON,
	PublicKeyCredentialCreationOptionsJSON,
	PublicKeyCredentialRequestOptionsJSON,
	RegistrationResponseJSON,
} from '@simplewebauthn/types';
import type * as misskey from 'misskey-js';

describe('2要素認証', () => {
	let alice: misskey.entities.SignupResponse;

	const config = loadConfig();
	const password = 'test';
	const username = 'alice';

	// https://datatracker.ietf.org/doc/html/rfc8152
	// 各値の定義は上記規格に基づく。鍵ペアは適当に生成したやつ
	const coseKtyEc2 = 2;
	const coseKid = 'meriadoc.brandybuck@buckland.example';
	const coseAlgEs256 = -7;
	const coseEc2CrvP256 = 1;
	const coseEc2X = '4932eaacc657565705e4287e7870ce3aad55545d99d35a98a472dc52880cfc8f';
	const coseEc2Y = '5ca68303bf2c0433473e3d5cb8586bc2c8c43a4945a496fce8dbeda8b23ab0b1';

	// private key only for testing
	const pemToSign = '-----BEGIN EC PRIVATE KEY-----\n' +
		'MHcCAQEEIHqe/keuXyolbXzgLOu+YFJjDBGWVgXc3QCXfyqwDPf2oAoGCCqGSM49\n' +
		'AwEHoUQDQgAESTLqrMZXVlcF5Ch+eHDOOq1VVF2Z01qYpHLcUogM/I9cpoMDvywE\n' +
		'M0c+PVy4WGvCyMQ6SUWklvzo2+2osjqwsQ==\n' +
		'-----END EC PRIVATE KEY-----\n';

	const otpToken = (secret: string): string => {
		return OTPAuth.TOTP.generate({
			secret: OTPAuth.Secret.fromBase32(secret),
			digits: 6,
		});
	};

	const rpIdHash = (): Buffer => {
		return crypto.createHash('sha256')
			.update(Buffer.from(config.host, 'utf-8'))
			.digest();
	};

	const keyDoneParam = (param: {
		token: string,
		keyName: string,
		credentialId: Buffer,
		creationOptions: PublicKeyCredentialCreationOptionsJSON,
	}): {
		token: string,
		password: string,
		name: string,
		credential: RegistrationResponseJSON,
	} => {
		// A COSE encoded public key
		const credentialPublicKey = cbor.encode(new Map<number, unknown>([
			[-1, coseEc2CrvP256],
			[-2, Buffer.from(coseEc2X, 'hex')],
			[-3, Buffer.from(coseEc2Y, 'hex')],
			[1, coseKtyEc2],
			[2, coseKid],
			[3, coseAlgEs256],
		]));

		// AuthenticatorAssertionResponse.authenticatorData
		// https://developer.mozilla.org/en-US/docs/Web/API/AuthenticatorAssertionResponse/authenticatorData
		const credentialIdLength = Buffer.allocUnsafe(2);
		credentialIdLength.writeUInt16BE(param.credentialId.length, 0);
		const authData = Buffer.concat([
			rpIdHash(), // rpIdHash(32)
			Buffer.from([0x45]), // flags(1)
			Buffer.from([0x00, 0x00, 0x00, 0x00]), // signCount(4)
			Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]), // AAGUID(16)
			credentialIdLength,
			param.credentialId,
			credentialPublicKey,
		]);

		return {
			password,
			token: param.token,
			name: param.keyName,
			credential: <RegistrationResponseJSON>{
				id: param.credentialId.toString('base64url'),
				rawId: param.credentialId.toString('base64url'),
				response: <AuthenticatorAttestationResponseJSON>{
					clientDataJSON: Buffer.from(JSON.stringify({
						type: 'webauthn.create',
						challenge: param.creationOptions.challenge,
						origin: config.scheme + '://' + config.host,
						androidPackageName: 'org.mozilla.firefox',
					}), 'utf-8').toString('base64url'),
					attestationObject: cbor.encode({
						fmt: 'none',
						attStmt: {},
						authData,
					}).toString('base64url'),
				},
				clientExtensionResults: {},
				type: 'public-key',
			},
		};
	};

	const signinParam = (): {
		username: string,
		password: string,
		'g-recaptcha-response'?: string | null,
		'hcaptcha-response'?: string | null,
	} => {
		return {
			username,
			password,
			'g-recaptcha-response': null,
			'hcaptcha-response': null,
		};
	};

	const signinWithSecurityKeyParam = (param: {
		keyName: string,
		credentialId: Buffer,
		requestOptions: PublicKeyCredentialRequestOptionsJSON,
	}): {
		username: string,
		password: string,
		credential: AuthenticationResponseJSON,
		'g-recaptcha-response'?: string | null,
		'hcaptcha-response'?: string | null,
	} => {
		// AuthenticatorAssertionResponse.authenticatorData
		// https://developer.mozilla.org/en-US/docs/Web/API/AuthenticatorAssertionResponse/authenticatorData
		const authenticatorData = Buffer.concat([
			rpIdHash(),
			Buffer.from([0x05]), // flags(1)
			Buffer.from([0x00, 0x00, 0x00, 0x01]), // signCount(4)
		]);
		const clientDataJSONBuffer = Buffer.from(JSON.stringify({
			type: 'webauthn.get',
			challenge: param.requestOptions.challenge,
			origin: config.scheme + '://' + config.host,
			androidPackageName: 'org.mozilla.firefox',
		}), 'utf-8');
		const hashedclientDataJSON = crypto.createHash('sha256')
			.update(clientDataJSONBuffer)
			.digest();
		const privateKey = crypto.createPrivateKey(pemToSign);
		const signature = crypto.createSign('SHA256')
			.update(Buffer.concat([authenticatorData, hashedclientDataJSON]))
			.sign(privateKey);
		return {
			username,
			password,
			credential: <AuthenticationResponseJSON>{
				id: param.credentialId.toString('base64url'),
				rawId: param.credentialId.toString('base64url'),
				response: <AuthenticatorAssertionResponseJSON>{
					clientDataJSON: clientDataJSONBuffer.toString('base64url'),
					authenticatorData: authenticatorData.toString('base64url'),
					signature: signature.toString('base64url'),
				},
				clientExtensionResults: {},
				type: 'public-key',
			},
			'g-recaptcha-response': null,
			'hcaptcha-response': null,
		};
	};

	beforeAll(async () => {
		alice = await signup({ username, password });
	}, 1000 * 60 * 2);

	test('が設定でき、OTPでログインできる。', async () => {
		const registerResponse = await api('i/2fa/register', {
			password,
		}, alice);
		assert.strictEqual(registerResponse.status, 200);
		assert.notEqual(registerResponse.body.qr, undefined);
		assert.notEqual(registerResponse.body.url, undefined);
		assert.notEqual(registerResponse.body.secret, undefined);
		assert.strictEqual(registerResponse.body.label, username);
		assert.strictEqual(registerResponse.body.issuer, config.host);

		const doneResponse = await api('i/2fa/done', {
			token: otpToken(registerResponse.body.secret),
		}, alice);
		assert.strictEqual(doneResponse.status, 200);

		const usersShowResponse = await api('users/show', {
			username,
		}, alice);
		assert.strictEqual(usersShowResponse.status, 200);
		assert.strictEqual(usersShowResponse.body.twoFactorEnabled, true);

		const signinResponse = await api('signin', {
			...signinParam(),
			token: otpToken(registerResponse.body.secret),
		});
		assert.strictEqual(signinResponse.status, 200);
		assert.notEqual(signinResponse.body.i, undefined);

		// 後片付け
		await api('i/2fa/unregister', {
			password,
			token: otpToken(registerResponse.body.secret),
		}, alice);
	});

	test('が設定でき、セキュリティキーでログインできる。', async () => {
		const registerResponse = await api('i/2fa/register', {
			password,
		}, alice);
		assert.strictEqual(registerResponse.status, 200);

		const doneResponse = await api('i/2fa/done', {
			token: otpToken(registerResponse.body.secret),
		}, alice);
		assert.strictEqual(doneResponse.status, 200);

		const registerKeyResponse = await api('i/2fa/register-key', {
			password,
			token: otpToken(registerResponse.body.secret),
		}, alice);
		assert.strictEqual(registerKeyResponse.status, 200);
		assert.notEqual(registerKeyResponse.body.rp, undefined);
		assert.notEqual(registerKeyResponse.body.challenge, undefined);

		const keyName = 'example-key';
		const credentialId = crypto.randomBytes(0x41);
		const keyDoneResponse = await api('i/2fa/key-done', keyDoneParam({
			token: otpToken(registerResponse.body.secret),
			keyName,
			credentialId,
			creationOptions: registerKeyResponse.body,
		}) as any, alice);
		assert.strictEqual(keyDoneResponse.status, 200);
		assert.strictEqual(keyDoneResponse.body.id, credentialId.toString('base64url'));
		assert.strictEqual(keyDoneResponse.body.name, keyName);

		const usersShowResponse = await api('users/show', {
			username,
		});
		assert.strictEqual(usersShowResponse.status, 200);
		assert.strictEqual(usersShowResponse.body.securityKeys, true);

		const signinResponse = await api('signin', {
			...signinParam(),
		});
		assert.strictEqual(signinResponse.status, 200);
		assert.strictEqual(signinResponse.body.i, undefined);
		assert.notEqual(signinResponse.body.challenge, undefined);
		assert.notEqual(signinResponse.body.allowCredentials, undefined);
		assert.strictEqual(signinResponse.body.allowCredentials[0].id, credentialId.toString('base64url'));

		const signinResponse2 = await api('signin', signinWithSecurityKeyParam({
			keyName,
			credentialId,
			requestOptions: signinResponse.body,
		}));
		assert.strictEqual(signinResponse2.status, 200);
		assert.notEqual(signinResponse2.body.i, undefined);

		// 後片付け
		await api('i/2fa/unregister', {
			password,
			token: otpToken(registerResponse.body.secret),
		}, alice);
	});

	test('が設定でき、セキュリティキーでパスワードレスログインできる。', async () => {
		const registerResponse = await api('i/2fa/register', {
			password,
		}, alice);
		assert.strictEqual(registerResponse.status, 200);

		const doneResponse = await api('i/2fa/done', {
			token: otpToken(registerResponse.body.secret),
		}, alice);
		assert.strictEqual(doneResponse.status, 200);

		const registerKeyResponse = await api('i/2fa/register-key', {
			token: otpToken(registerResponse.body.secret),
			password,
		}, alice);
		assert.strictEqual(registerKeyResponse.status, 200);

		const keyName = 'example-key';
		const credentialId = crypto.randomBytes(0x41);
		const keyDoneResponse = await api('i/2fa/key-done', keyDoneParam({
			token: otpToken(registerResponse.body.secret),
			keyName,
			credentialId,
			creationOptions: registerKeyResponse.body,
		}) as any, alice);
		assert.strictEqual(keyDoneResponse.status, 200);

		const passwordLessResponse = await api('i/2fa/password-less', {
			value: true,
		}, alice);
		assert.strictEqual(passwordLessResponse.status, 204);

		const usersShowResponse = await api('users/show', {
			username,
		});
		assert.strictEqual(usersShowResponse.status, 200);
		assert.strictEqual(usersShowResponse.body.usePasswordLessLogin, true);

		const signinResponse = await api('signin', {
			...signinParam(),
			password: '',
		});
		assert.strictEqual(signinResponse.status, 200);
		assert.strictEqual(signinResponse.body.i, undefined);

		const signinResponse2 = await api('signin', {
			...signinWithSecurityKeyParam({
				keyName,
				credentialId,
				requestOptions: signinResponse.body,
			}),
			password: '',
		});
		assert.strictEqual(signinResponse2.status, 200);
		assert.notEqual(signinResponse2.body.i, undefined);

		// 後片付け
		await api('i/2fa/unregister', {
			password,
			token: otpToken(registerResponse.body.secret),
		}, alice);
	});

	test('が設定でき、設定したセキュリティキーの名前を変更できる。', async () => {
		const registerResponse = await api('i/2fa/register', {
			password,
		}, alice);
		assert.strictEqual(registerResponse.status, 200);

		const doneResponse = await api('i/2fa/done', {
			token: otpToken(registerResponse.body.secret),
		}, alice);
		assert.strictEqual(doneResponse.status, 200);

		const registerKeyResponse = await api('i/2fa/register-key', {
			token: otpToken(registerResponse.body.secret),
			password,
		}, alice);
		assert.strictEqual(registerKeyResponse.status, 200);

		const keyName = 'example-key';
		const credentialId = crypto.randomBytes(0x41);
		const keyDoneResponse = await api('i/2fa/key-done', keyDoneParam({
			token: otpToken(registerResponse.body.secret),
			keyName,
			credentialId,
			creationOptions: registerKeyResponse.body,
		}) as any, alice);
		assert.strictEqual(keyDoneResponse.status, 200);

		const renamedKey = 'other-key';
		const updateKeyResponse = await api('i/2fa/update-key', {
			name: renamedKey,
			credentialId: credentialId.toString('base64url'),
		}, alice);
		assert.strictEqual(updateKeyResponse.status, 200);

		const iResponse = await api('i', {
		}, alice);
		assert.strictEqual(iResponse.status, 200);
		const securityKeys = iResponse.body.securityKeysList.filter((s: { id: string; }) => s.id === credentialId.toString('base64url'));
		assert.strictEqual(securityKeys.length, 1);
		assert.strictEqual(securityKeys[0].name, renamedKey);
		assert.notEqual(securityKeys[0].lastUsed, undefined);

		// 後片付け
		await api('i/2fa/unregister', {
			password,
			token: otpToken(registerResponse.body.secret),
		}, alice);
	});

	test('が設定でき、設定したセキュリティキーを削除できる。', async () => {
		const registerResponse = await api('i/2fa/register', {
			password,
		}, alice);
		assert.strictEqual(registerResponse.status, 200);

		const doneResponse = await api('i/2fa/done', {
			token: otpToken(registerResponse.body.secret),
		}, alice);
		assert.strictEqual(doneResponse.status, 200);

		const registerKeyResponse = await api('i/2fa/register-key', {
			token: otpToken(registerResponse.body.secret),
			password,
		}, alice);
		assert.strictEqual(registerKeyResponse.status, 200);

		const keyName = 'example-key';
		const credentialId = crypto.randomBytes(0x41);
		const keyDoneResponse = await api('i/2fa/key-done', keyDoneParam({
			token: otpToken(registerResponse.body.secret),
			keyName,
			credentialId,
			creationOptions: registerKeyResponse.body,
		}) as any, alice);
		assert.strictEqual(keyDoneResponse.status, 200);

		// テストの実行順によっては複数残ってるので全部消す
		const iResponse = await api('i', {
		}, alice);
		assert.strictEqual(iResponse.status, 200);
		for (const key of iResponse.body.securityKeysList) {
			const removeKeyResponse = await api('i/2fa/remove-key', {
				token: otpToken(registerResponse.body.secret),
				password,
				credentialId: key.id,
			}, alice);
			assert.strictEqual(removeKeyResponse.status, 200);
		}

		const usersShowResponse = await api('users/show', {
			username,
		});
		assert.strictEqual(usersShowResponse.status, 200);
		assert.strictEqual(usersShowResponse.body.securityKeys, false);

		const signinResponse = await api('signin', {
			...signinParam(),
			token: otpToken(registerResponse.body.secret),
		});
		assert.strictEqual(signinResponse.status, 200);
		assert.notEqual(signinResponse.body.i, undefined);

		// 後片付け
		await api('i/2fa/unregister', {
			password,
			token: otpToken(registerResponse.body.secret),
		}, alice);
	});

	test('が設定でき、設定解除できる。（パスワードのみでログインできる。）', async () => {
		const registerResponse = await api('i/2fa/register', {
			password,
		}, alice);
		assert.strictEqual(registerResponse.status, 200);

		const doneResponse = await api('i/2fa/done', {
			token: otpToken(registerResponse.body.secret),
		}, alice);
		assert.strictEqual(doneResponse.status, 200);

		const usersShowResponse = await api('users/show', {
			username,
		});
		assert.strictEqual(usersShowResponse.status, 200);
		assert.strictEqual(usersShowResponse.body.twoFactorEnabled, true);

		const unregisterResponse = await api('i/2fa/unregister', {
			token: otpToken(registerResponse.body.secret),
			password,
		}, alice);
		assert.strictEqual(unregisterResponse.status, 204);

		const signinResponse = await api('signin', {
			...signinParam(),
		});
		assert.strictEqual(signinResponse.status, 200);
		assert.notEqual(signinResponse.body.i, undefined);

		// 後片付け
		await api('i/2fa/unregister', {
			password,
			token: otpToken(registerResponse.body.secret),
		}, alice);
	});
});
