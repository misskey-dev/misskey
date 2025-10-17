/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as assert from 'assert';

import { assertActivityMatchesUrl, FetchAllowSoftFailMask } from '@/core/activitypub/misc/check-against-url.js';
import { IObject } from '@/core/activitypub/type.js';
import { verifyDraftSignature, parseRequestSignature, genRsaKeyPair, genEd25519KeyPair, importPrivateKey } from '@misskey-dev/node-http-message-signatures';
import { createSignedGet, createSignedPost } from '@/core/activitypub/ApRequestService.js';

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

function cartesianProduct<T, U>(a: T[], b: U[]): [T, U][] {
	return a.flatMap(a => b.map(b => [a, b] as [T, U]));
}

async function getKeyPair(level: string) {
	if (level === '00') {
		return await genRsaKeyPair();
	} else if (level === '01') {
		return await genEd25519KeyPair();
	}
	throw new Error('Invalid level');
}

describe('ap-request post', () => {
	const url = 'https://example.com/inbox';
	const activity = { a: 1 };
	const body = JSON.stringify(activity);
	const headers = {
		'User-Agent': 'UA',
	};

	describe.each(['00', '01'])('createSignedPost with verify', (level) => {
		test('pem', async () => {
			const keypair = await getKeyPair(level);
			const key = { keyId: 'x', 'privateKeyPem': keypair.privateKey };

			const req = await createSignedPost({ level, key, url, body, additionalHeaders: headers });

			const parsed = parseRequestSignature(req.request);
			expect(parsed.version).toBe('draft');
			expect(Array.isArray(parsed.value)).toBe(false);
			const verify = await verifyDraftSignature(parsed.value as any, keypair.publicKey);
			assert.deepStrictEqual(verify, true);
		});
		test('imported', async () => {
			const keypair = await getKeyPair(level);
			const key = { keyId: 'x', 'privateKey': await importPrivateKey(keypair.privateKey) };

			const req = await createSignedPost({ level, key, url, body, additionalHeaders: headers });

			const parsed = parseRequestSignature(req.request);
			expect(parsed.version).toBe('draft');
			expect(Array.isArray(parsed.value)).toBe(false);
			const verify = await verifyDraftSignature(parsed.value as any, keypair.publicKey);
			assert.deepStrictEqual(verify, true);
		});
	});
});

describe('ap-request get', () => {
	describe.each(['00', '01'])('createSignedGet with verify', (level) => {
		test('pass', async () => {
			const keypair = await getKeyPair(level);
			const key = { keyId: 'x', 'privateKeyPem': keypair.privateKey };
			const url = 'https://example.com/outbox';
			const headers = {
				'User-Agent': 'UA',
			};

			const req = await createSignedGet({ level, key, url, additionalHeaders: headers });

			const parsed = parseRequestSignature(req.request);
			expect(parsed.version).toBe('draft');
			expect(Array.isArray(parsed.value)).toBe(false);
			const verify = await verifyDraftSignature(parsed.value as any, keypair.publicKey);
			assert.deepStrictEqual(verify, true);
		});
	});
});

describe('assertActivityMatchesUrl', () => {
	test('rejects non matching domain', () => {
		assert.doesNotThrow(() => assertActivityMatchesUrl(
			'https://alice.example.com/abc',
			{ id: 'https://alice.example.com/abc' } as IObject,
			'https://alice.example.com/abc',
			FetchAllowSoftFailMask.Strict,
		), 'validation should pass base case');
		assert.throws(() => assertActivityMatchesUrl(
			'https://alice.example.com/abc',
			{ id: 'https://bob.example.com/abc' } as IObject,
			'https://alice.example.com/abc',
			FetchAllowSoftFailMask.Any,
		), 'validation should fail no matter what if the response URL is inconsistent with the object ID');

		assert.doesNotThrow(() => assertActivityMatchesUrl(
			'https://alice.example.com/abc#test',
			{ id: 'https://alice.example.com/abc' } as IObject,
			'https://alice.example.com/abc',
			FetchAllowSoftFailMask.Strict,
		), 'validation should pass with hash in request URL');

		// fix issues like threads
		// https://github.com/misskey-dev/misskey/issues/15039
		const withOrWithoutWWW = [
			'https://alice.example.com/abc',
			'https://www.alice.example.com/abc',
		];

		cartesianProduct(
			cartesianProduct(
				withOrWithoutWWW,
				withOrWithoutWWW,
			),
			withOrWithoutWWW,
		).forEach(([[a, b], c]) => {
			assert.doesNotThrow(() => assertActivityMatchesUrl(
				a,
				{ id: b } as IObject,
				c,
				FetchAllowSoftFailMask.Strict,
			), 'validation should pass with or without www. subdomain');
		});
	});

	test('cross origin lookup', () => {
		assert.doesNotThrow(() => assertActivityMatchesUrl(
			'https://alice.example.com/abc',
			{ id: 'https://bob.example.com/abc' } as IObject,
			'https://bob.example.com/abc',
			FetchAllowSoftFailMask.CrossOrigin | FetchAllowSoftFailMask.NonCanonicalId,
		), 'validation should pass if the response is otherwise consistent and cross-origin is allowed');
		assert.throws(() => assertActivityMatchesUrl(
			'https://alice.example.com/abc',
			{ id: 'https://bob.example.com/abc' } as IObject,
			'https://bob.example.com/abc',
			FetchAllowSoftFailMask.Strict,
		), 'validation should fail if the response is otherwise consistent and cross-origin is not allowed');
	});

	test('rejects non-canonical ID', () => {
		assert.throws(() => assertActivityMatchesUrl(
			'https://alice.example.com/@alice',
			{ id: 'https://alice.example.com/users/alice' } as IObject,
			'https://alice.example.com/users/alice',
			FetchAllowSoftFailMask.Strict,
		), 'throws if the response ID did not exactly match the expected ID');
		assert.doesNotThrow(() => assertActivityMatchesUrl(
			'https://alice.example.com/@alice',
			{ id: 'https://alice.example.com/users/alice' } as IObject,
			'https://alice.example.com/users/alice',
			FetchAllowSoftFailMask.NonCanonicalId,
		), 'does not throw if non-canonical ID is allowed');
	});

	test('origin relaxed alignment', () => {
		assert.doesNotThrow(() => assertActivityMatchesUrl(
			'https://alice.example.com/abc',
			{ id: 'https://ap.alice.example.com/abc' } as IObject,
			'https://ap.alice.example.com/abc',
			FetchAllowSoftFailMask.MisalignedOrigin | FetchAllowSoftFailMask.NonCanonicalId,
		), 'validation should pass if response is a subdomain of the expected origin');
		assert.throws(() => assertActivityMatchesUrl(
			'https://alice.multi-tenant.example.com/abc',
			{ id: 'https://alice.multi-tenant.example.com/abc' } as IObject,
			'https://bob.multi-tenant.example.com/abc',
			FetchAllowSoftFailMask.MisalignedOrigin | FetchAllowSoftFailMask.NonCanonicalId,
		), 'validation should fail if response is a disjoint domain of the expected origin');
		assert.throws(() => assertActivityMatchesUrl(
			'https://alice.example.com/abc',
			{ id: 'https://ap.alice.example.com/abc' } as IObject,
			'https://ap.alice.example.com/abc',
			FetchAllowSoftFailMask.Strict,
		), 'throws if relaxed origin is forbidden');
	});

	test('resist HTTP downgrade', () => {
		assert.throws(() => assertActivityMatchesUrl(
			'https://alice.example.com/abc',
			{ id: 'https://alice.example.com/abc' } as IObject,
			'http://alice.example.com/abc',
			FetchAllowSoftFailMask.Strict,
		), 'throws if HTTP downgrade is detected');
	});
});
