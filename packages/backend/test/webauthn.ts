/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * WebAuthn (パスキー) のテスト用フィクスチャ。
 * 実物の認証器の代わりに、固定の鍵ペアで登録用 attestation と認証用 assertion を組み立てる。
 */

import * as crypto from 'node:crypto';
import { encode as encodeToCbor } from 'cbor2';
import { loadConfig } from '@/config.js';
import type {
	AuthenticationResponseJSON,
	AuthenticatorAssertionResponseJSON,
	AuthenticatorAttestationResponseJSON,
	PublicKeyCredentialCreationOptionsJSON,
	PublicKeyCredentialRequestOptionsJSON,
	RegistrationResponseJSON,
} from '@simplewebauthn/server';

const config = loadConfig();

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

export const rpIdHash = (): Buffer => {
	return crypto.createHash('sha256')
		.update(Buffer.from(config.host, 'utf-8'))
		.digest();
};

/** `i/2fa/passkey/done` に渡す、認証器が返した体の登録レスポンス */
export const webauthnRegistrationResponse = (param: {
	credentialId: Uint8Array,
	creationOptions: PublicKeyCredentialCreationOptionsJSON,
}): RegistrationResponseJSON => {
	// A COSE encoded public key
	const credentialPublicKey = encodeToCbor(new Map<number, unknown>([
		[-1, coseEc2CrvP256],
		[-2, Uint8Array.from(Buffer.from(coseEc2X, 'hex'))],
		[-3, Uint8Array.from(Buffer.from(coseEc2Y, 'hex'))],
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
		new Uint8Array([0x45]), // flags(1)
		new Uint8Array(4), // signCount(4)
		new Uint8Array(16), // AAGUID(16)
		credentialIdLength,
		param.credentialId,
		credentialPublicKey,
	]);

	const credentialIdBase64url = Buffer.from(param.credentialId).toString('base64url');

	return <RegistrationResponseJSON>{
		id: credentialIdBase64url,
		rawId: credentialIdBase64url,
		response: <AuthenticatorAttestationResponseJSON>{
			clientDataJSON: Buffer.from(JSON.stringify({
				type: 'webauthn.create',
				challenge: param.creationOptions.challenge,
				origin: config.scheme + '://' + config.host,
				androidPackageName: 'org.mozilla.firefox',
			}), 'utf-8').toString('base64url'),
			attestationObject: Buffer.from(encodeToCbor({
				fmt: 'none',
				attStmt: {},
				authData: new Uint8Array(authData),
			})).toString('base64url'),
		},
		clientExtensionResults: {},
		type: 'public-key',
	};
};

/**
 * サーバーが発行した challenge に対する assertion。
 * `flags` の UV (user verified) を立てないと、匿名パスキー経路の検証は必ず失敗する。
 */
export const webauthnAuthenticationResponse = (param: {
	credentialId: Uint8Array,
	requestOptions: PublicKeyCredentialRequestOptionsJSON,
}): AuthenticationResponseJSON => {
	// AuthenticatorAssertionResponse.authenticatorData
	// https://developer.mozilla.org/en-US/docs/Web/API/AuthenticatorAssertionResponse/authenticatorData
	const authenticatorData = Buffer.concat([
		rpIdHash(),
		Buffer.from([0x05]), // flags(1): UP | UV
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

	const credentialIdBase64url = Buffer.from(param.credentialId).toString('base64url');

	return <AuthenticationResponseJSON>{
		id: credentialIdBase64url,
		rawId: credentialIdBase64url,
		response: <AuthenticatorAssertionResponseJSON>{
			clientDataJSON: clientDataJSONBuffer.toString('base64url'),
			authenticatorData: authenticatorData.toString('base64url'),
			signature: signature.toString('base64url'),
		},
		clientExtensionResults: {},
		type: 'public-key',
	};
};
