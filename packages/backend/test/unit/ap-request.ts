/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as assert from 'assert';
import httpSignature from '@peertube/http-signature';

import { genRsaKeyPair } from '@/misc/gen-key-pair.js';
import { ApRequestCreator } from '@/core/activitypub/ApRequestService.js';

export const buildParsedSignature = (signingString: string, signature: string, algorithm: string) => {
	return {
		scheme: 'Signature',
		params: {
			keyId: 'KeyID',	// dummy, not used for verify
			algorithm: algorithm,
			headers: ['(request-target)', 'date', 'host', 'digest'],	// dummy, not used for verify
			signature: signature,
		},
		signingString: signingString,
		algorithm: algorithm.toUpperCase(),
		keyId: 'KeyID',	// dummy, not used for verify
	};
};

describe('ap-request', () => {
	test('createSignedPost with verify', async () => {
		const keypair = await genRsaKeyPair();
		const key = { keyId: 'x', 'privateKeyPem': keypair.privateKey };
		const url = 'https://example.com/inbox';
		const activity = { a: 1 };
		const body = JSON.stringify(activity);
		const headers = {
			'User-Agent': 'UA',
		};

		const req = ApRequestCreator.createSignedPost({ key, url, body, additionalHeaders: headers });

		const parsed = buildParsedSignature(req.signingString, req.signature, 'rsa-sha256');

		const result = httpSignature.verifySignature(parsed, keypair.publicKey);
		assert.deepStrictEqual(result, true);
	});

	test('createSignedGet with verify', async () => {
		const keypair = await genRsaKeyPair();
		const key = { keyId: 'x', 'privateKeyPem': keypair.privateKey };
		const url = 'https://example.com/outbox';
		const headers = {
			'User-Agent': 'UA',
		};

		const req = ApRequestCreator.createSignedGet({ key, url, additionalHeaders: headers });

		const parsed = buildParsedSignature(req.signingString, req.signature, 'rsa-sha256');

		const result = httpSignature.verifySignature(parsed, keypair.publicKey);
		assert.deepStrictEqual(result, true);
	});
});
