/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, test } from 'vitest';
import * as assert from 'assert';
import httpSignature from '@peertube/http-signature';
import { parseRequestSignature, verifyDraftSignature } from '@misskey-dev/node-http-message-signatures';

import { genRsaKeyPair } from '@/misc/gen-key-pair.js';
import { ApRequestCreator } from '@/core/activitypub/ApRequestService.js';
import { assertActivityMatchesUrl, FetchAllowSoftFailMask } from '@/core/activitypub/misc/check-against-url.js';
import { IObject } from '@/core/activitypub/type.js';

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

describe('ap-request', () => {
	test.each(['GET', 'POST'])('RSA %s signatures survive request parsing and queue serialization', async method => {
		const keypair = await genRsaKeyPair();
		const key = { keyId: 'https://example.com/users/alice#main-key', privateKeyPem: keypair.privateKey };
		const args = { key, url: 'https://example.com/inbox?cursor=1', body: '{}', additionalHeaders: {} };
		const signed = method === 'POST'
			? await ApRequestCreator.createSignedPost(args)
			: await ApRequestCreator.createSignedGet(args);
		const parsed = parseRequestSignature({
			...signed.request,
			headers: { ...signed.request.headers, host: 'example.com' },
		});
		assert.strictEqual(parsed.version, 'draft');
		if (parsed.version !== 'draft') throw new Error('Expected draft signature');
		assert.strictEqual(parsed.value.keyId, key.keyId);
		assert.strictEqual(parsed.value.params.algorithm, 'rsa-sha256');
		const queued = JSON.parse(JSON.stringify(parsed.value));
		assert.strictEqual(await verifyDraftSignature(queued, keypair.publicKey), true);
		assert.strictEqual(httpSignature.verifySignature(queued, keypair.publicKey), true);
		queued.signingString += 'changed';
		assert.strictEqual(await verifyDraftSignature(queued, keypair.publicKey), false);
	});

	test('createSignedPost with verify', async () => {
		const keypair = await genRsaKeyPair();
		const key = { keyId: 'x', 'privateKeyPem': keypair.privateKey };
		const url = 'https://example.com/inbox';
		const activity = { a: 1 };
		const body = JSON.stringify(activity);
		const headers = {
			'User-Agent': 'UA',
		};

		const req = await ApRequestCreator.createSignedPost({ key, url, body, additionalHeaders: headers });

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

		const req = await ApRequestCreator.createSignedGet({ key, url, additionalHeaders: headers });

		const parsed = buildParsedSignature(req.signingString, req.signature, 'rsa-sha256');

		const result = httpSignature.verifySignature(parsed, keypair.publicKey);
		assert.deepStrictEqual(result, true);
	});

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
