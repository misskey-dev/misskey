/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as crypto from 'node:crypto';
import * as util from 'node:util';

const generateKeyPair = util.promisify(crypto.generateKeyPair);

export async function genRsaKeyPair(modulusLength = 4096) {
	return await generateKeyPair('rsa', {
		modulusLength,
		publicKeyEncoding: {
			type: 'spki',
			format: 'pem',
		},
		privateKeyEncoding: {
			type: 'pkcs8',
			format: 'pem',
			cipher: undefined,
			passphrase: undefined,
		},
	});
}

export async function genEd25519KeyPair() {
	return await generateKeyPair('ed25519', {
		publicKeyEncoding: {
			type: 'spki',
			format: 'pem',
		},
		privateKeyEncoding: {
			type: 'pkcs8',
			format: 'pem',
			cipher: undefined,
			passphrase: undefined,
		},
	});
}

export async function genRSAAndEd25519KeyPair(rsaModulusLength = 4096) {
	const rsa = await genRsaKeyPair(rsaModulusLength);
	const ed25519 = await genEd25519KeyPair();
	return {
		publicKey: rsa.publicKey,
		privateKey: rsa.privateKey,
		ed25519PublicKey: ed25519.publicKey,
		ed25519PrivateKey: ed25519.privateKey,
	};
}
