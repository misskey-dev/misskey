/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createPublicKey, generateKeyPairSync, sign } from 'node:crypto';
import { describe, expect, test, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { decodePublicMultikey } from '@misskey-dev/node-http-message-signatures';
import { encodeActorPublicMultikey, extractActorPublicKeys } from '@/core/activitypub/misc/actor-public-keys.js';
import { ApRendererService } from '@/core/activitypub/ApRendererService.js';
import { JsonLd } from '@/core/activitypub/JsonLdService.js';
import type { HttpRequestService } from '@/core/HttpRequestService.js';
import type { MiLocalUser } from '@/models/User.js';
import type { IActor } from '@/core/activitypub/type.js';
import { actorId, host } from '../misc/public-multikey.js';
import { multikeyVectors } from '../misc/multikey-vectors.js';

const rsa = generateKeyPairSync('rsa', { modulusLength: 2048 });
const ed = generateKeyPairSync('ed25519');
const publicPem = rsa.publicKey.export({ type: 'spki', format: 'pem' }).toString();

describe('standard Actor Multikey publication', () => {
	test.each(multikeyVectors)('matches the independent FEP-521a $type public vector', vector => {
		const key = vector.type === 'rsa'
			? createPublicKey({ key: Buffer.from(vector.publicHex, 'hex'), type: 'pkcs1', format: 'der' })
			: createPublicKey({ key: { kty: 'OKP', crv: 'Ed25519', x: Buffer.from(vector.publicHex, 'hex').toString('base64url') }, format: 'jwk' });
		const pem = key.export({ type: 'spki', format: 'pem' }).toString();
		expect(encodeActorPublicMultikey(pem)).toBe(vector.multibase);
		expect(Buffer.from(decodePublicMultikey(vector.multibase))).toEqual(key.export({ type: 'spki', format: 'der' }));
	});

	test('publishes the existing RSA key and ID without generating or exposing private material', async () => {
		const keypair = { publicKey: publicPem, privateKey: rsa.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString() };
		const getUserKeypair = vi.fn().mockResolvedValue(keypair);
		const renderer: ApRendererService = Object.assign(Object.create(ApRendererService.prototype), {
			config: { url: 'https://remote.example' }, meta: {},
			userEntityService: { genLocalUserUri: () => actorId, getIdenticonUrl: () => 'https://remote.example/identicon' },
			userKeypairService: { getUserKeypair },
			userProfilesRepository: { findOneByOrFail: async () => ({ fields: [], description: null }) },
		});
		Object.defineProperty(renderer, 'getEmojis', { value: async () => [] });
		const user = { id: 'alice', username: 'alice', emojis: [], tags: [], avatarId: null, bannerId: null } as unknown as MiLocalUser;
		const rendered = renderer.addContext(await renderer.renderPerson(user)) as IActor;
		expect(rendered.assertionMethod).toEqual([{ id: actorId + '#main-key', type: 'Multikey', controller: actorId, publicKeyMultibase: encodeActorPublicMultikey(publicPem) }]);
		expect(rendered.publicKey).toMatchObject({ id: actorId + '#main-key', owner: actorId, publicKeyPem: publicPem });
		expect(rendered).not.toHaveProperty('additionalPublicKeys');
		expect(JSON.stringify(rendered)).not.toContain('PRIVATE KEY');
		expect(getUserKeypair).toHaveBeenCalledTimes(1);
		expect(extractActorPublicKeys(rendered, host)?.keys).toEqual([{ keyId: actorId + '#main-key', keyPem: publicPem }]);
	});

	test('publishes both existing keys through assertionMethod with stable IDs', async () => {
		const keypair = { publicKey: publicPem, ed25519PublicKey: ed.publicKey.export({ type: 'spki', format: 'pem' }).toString(), privateKey: rsa.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString() };
		const getUserKeypair = vi.fn().mockResolvedValue(keypair);
		const renderer: ApRendererService = Object.assign(Object.create(ApRendererService.prototype), {
			config: { url: 'https://remote.example' }, meta: {},
			userEntityService: { genLocalUserUri: () => actorId, getIdenticonUrl: () => 'https://remote.example/identicon' },
			userKeypairService: { getUserKeypair },
			userProfilesRepository: { findOneByOrFail: async () => ({ fields: [], description: null }) },
		});
		Object.defineProperty(renderer, 'getEmojis', { value: async () => [] });
		const user = { id: 'alice', username: 'alice', emojis: [], tags: [], avatarId: null, bannerId: null } as unknown as MiLocalUser;
		const rendered = renderer.addContext(await renderer.renderPerson(user)) as IActor;
		expect(rendered.assertionMethod).toEqual([
			{ id: actorId + '#main-key', type: 'Multikey', controller: actorId, publicKeyMultibase: encodeActorPublicMultikey(publicPem) },
			{ id: actorId + '#ed25519-key', type: 'Multikey', controller: actorId, publicKeyMultibase: encodeActorPublicMultikey(keypair.ed25519PublicKey) },
		]);
		expect(rendered.publicKey).toMatchObject({ id: actorId + '#main-key', owner: actorId, publicKeyPem: publicPem });
		expect(rendered).not.toHaveProperty('additionalPublicKeys');
		expect(JSON.stringify(rendered)).not.toContain('PRIVATE KEY');
		expect(getUserKeypair).toHaveBeenCalledTimes(1);
		expect(extractActorPublicKeys(rendered, host)?.keys).toEqual([
			{ keyId: actorId + '#main-key', keyPem: publicPem },
			{ keyId: actorId + '#ed25519-key', keyPem: keypair.ed25519PublicKey },
		]);
	});

	test('preloads the official context and preserves Multikey controller and typed material', async () => {
		const ld = new JsonLd(mock<HttpRequestService>());
		ld.freeze();
		const keyId = actorId + '#key';
		const material = encodeActorPublicMultikey(publicPem);
		const document = {
			'@context': ['https://www.w3.org/ns/activitystreams', 'https://www.w3.org/ns/cid/v1'],
			id: actorId, type: 'Person', assertionMethod: [{ id: keyId, type: 'Multikey', controller: actorId, publicKeyMultibase: material }],
		};
		const canonical = await ld.normalize(document);
		expect(canonical).toContain(`<${actorId}> <https://w3id.org/security#assertionMethod> <${keyId}> .`);
		expect(canonical).toContain(`<${keyId}> <https://w3id.org/security#controller> <${actorId}> .`);
		expect(canonical).toContain(`<${keyId}> <https://w3id.org/security#publicKeyMultibase> "${material}"^^<https://w3id.org/security#multibase> .`);
		const compacted = await ld.compact(document);
		expect(compacted).toMatchObject({ assertionMethod: [{ id: keyId, type: 'Multikey', controller: actorId, publicKeyMultibase: material }] });
	});

	test('retains canonical bytes and RSA verification for a historical signed document', async () => {
		const legacyId = actorId + '#ed25519-key';
		const edPem = ed.publicKey.export({ type: 'spki', format: 'pem' }).toString();
		const document = {
			'@context': ['https://www.w3.org/ns/activitystreams', 'https://w3id.org/security/v1', { Key: 'sec:Key' }],
			id: actorId, type: 'Person',
			publicKey: { id: actorId + '#main-key', type: 'Key', owner: actorId, publicKeyPem: publicPem },
			additionalPublicKeys: [{ id: legacyId, type: 'Key', owner: actorId, publicKeyPem: edPem }],
		};
		// Independent expected RDF graph of the old representation (no blank nodes).
		const rdfType = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
		const expected = [
			`<${actorId}> <${rdfType}> <https://www.w3.org/ns/activitystreams#Person> .`,
			...[[actorId + '#main-key', publicPem], [legacyId, edPem]].flatMap(([id, pem]) => [
				`<${actorId}> <https://w3id.org/security#publicKey> <${id}> .`,
				`<${id}> <${rdfType}> <https://w3id.org/security#Key> .`,
				`<${id}> <https://w3id.org/security#owner> <${actorId}> .`,
				`<${id}> <https://w3id.org/security#publicKeyPem> ${JSON.stringify(pem)} .`,
			]),
		].sort().join('\n') + '\n';
		const ld = new JsonLd(mock<HttpRequestService>());
		ld.freeze();
		expect(await ld.normalize(document)).toBe(expected);
		const options = { type: 'RsaSignature2017', creator: actorId + '#main-key', created: '2026-10-04T00:00:00.000Z', nonce: 'historical-fixture' };
		const signatureValue = sign('sha256', Buffer.from(await ld.createVerifyData(document, options)), rsa.privateKey).toString('base64');
		const queued = JSON.parse(JSON.stringify({ ...document, signature: { ...options, signatureValue } }));
		expect(await ld.verifyRsaSignature2017(queued, publicPem)).toBe(true);
		delete queued.additionalPublicKeys;
		expect(await ld.verifyRsaSignature2017(queued, publicPem)).toBe(false);
	});
});
