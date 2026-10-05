/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { generateKeyPairSync } from 'node:crypto';
import { describe, expect, test } from 'vitest';
import { extractActorPublicKeys } from '@/core/activitypub/misc/actor-public-keys.js';
import { actor, actorId, base58btc, host, multikey } from '../misc/public-multikey.js';

const rsa = generateKeyPairSync('rsa', { modulusLength: 2048 });
const ed = generateKeyPairSync('ed25519');
const key = multikey(ed.publicKey);
const legacy = { type: 'Key' as const, id: key.id, owner: actorId, publicKeyPem: ed.publicKey.export({ format: 'pem', type: 'spki' }).toString() };

describe('embedded actor Multikey extraction', () => {
	test.each([rsa, ed])('normalizes a public Multikey to the existing SPKI PEM path', pair => {
		const result = extractActorPublicKeys(actor({ assertionMethod: [multikey(pair.publicKey)] }), host);
		expect(result).toMatchObject({ replace: true, rejectedKeyIds: [], keys: [{ keyId: key.id, keyPem: pair.publicKey.export({ format: 'pem', type: 'spki' }).toString() }] });
	});

	test('deduplicates equivalent PEM and Multikey without losing legacy-only keys', () => {
		const other = { ...legacy, id: actorId + '#other' };
		const result = extractActorPublicKeys(actor({ publicKey: [legacy, other], assertionMethod: [key, key] }), host);
		expect(result?.keys.map(x => x.keyId).sort()).toEqual([key.id, other.id].sort());
		expect(result?.replace).toBe(true);
	});

	test('deduplicates legacy PKCS#1 RSA and its canonical Multikey equivalent', () => {
		const publicKey = { ...legacy, publicKeyPem: rsa.publicKey.export({ format: 'pem', type: 'pkcs1' }).toString() };
		const result = extractActorPublicKeys(actor({ publicKey, assertionMethod: [multikey(rsa.publicKey)] }), host);
		expect(result?.keys).toEqual([{ keyId: key.id, keyPem: rsa.publicKey.export({ type: 'spki', format: 'pem' }).toString() }]);
	});

	test.each([false, true])('rejects a conflicting ID regardless of entry order: reversed=%s', reverse => {
		const entries = [key, multikey(rsa.publicKey), { ...key, id: actorId + '#good' }, key];
		const result = extractActorPublicKeys(actor({ assertionMethod: reverse ? entries.reverse() : entries }), host);
		expect(result?.keys.map(x => x.keyId)).toEqual([actorId + '#good']);
		expect(result?.rejectedKeyIds).toEqual([key.id]);
	});

	test('distinguishes absent, explicit empty, malformed-only, and unresolved entries', () => {
		expect(extractActorPublicKeys(actor(), host)).toBeUndefined();
		expect(extractActorPublicKeys(actor({ assertionMethod: [] }), host)).toEqual({ keys: [], replace: true, rejectedKeyIds: [] });
		for (const assertionMethod of [[{ ...key, publicKeyMultibase: 'invalid' }], [key.id], 'invalid']) {
			expect(extractActorPublicKeys(actor({ assertionMethod } as never), host)).toMatchObject({ keys: [], replace: false });
		}
		expect(extractActorPublicKeys(actor({ publicKey: legacy, assertionMethod: [] }), host)?.keys).toHaveLength(1);
	});

	test.each([
		{ controller: actorId + '-other' }, { controller: 'https://other.example/users/alice' },
		{ id: 'https://other.example/key' }, { id: 'urn:key:alice' }, { id: '#relative' },
		{ id: 'https://user:pass@remote.example/key' }, { id: actorId + 'x'.repeat(256) },
		{ type: 'Key' }, { secretKeyMultibase: key.publicKeyMultibase }, { revoked: '2020-01-01' },
		{ publicKeyMultibase: 'z' + '1'.repeat(8192) }, { publicKeyMultibase: 'z0invalid' },
		{ publicKeyMultibase: base58btc(Uint8Array.from([0xed, 1, 1])) },
		{ publicKeyMultibase: base58btc(Uint8Array.from([0x80, 0x26, ...new Uint8Array(32)])) },
		{ publicKeyMultibase: base58btc(Uint8Array.from([0xee, 1, ...new Uint8Array(32)])) },
		{ publicKeyMultibase: base58btc(Uint8Array.from([0xed, 0x81, 0, ...new Uint8Array(32)])) },
		{ publicKeyMultibase: base58btc(Uint8Array.from([0x85, 0x24, 0x30, 0])) },
	])('ignores an invalid public entry without interpreting it as revocation: %j', changes => {
		expect(extractActorPublicKeys(actor({ assertionMethod: [{ ...key, ...changes }] } as never), host)).toMatchObject({ keys: [], replace: false });
	});

	test('bounds entry counts and PEM storage before writing', () => {
		expect(() => extractActorPublicKeys(actor({ assertionMethod: Array(17).fill(key) }), host)).toThrow('too many');
		expect(extractActorPublicKeys(actor({ publicKey: { ...legacy, publicKeyPem: 'x'.repeat(4097) } }), host)).toMatchObject({ keys: [], replace: false });
	});
});
