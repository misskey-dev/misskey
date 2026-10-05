/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { generateKeyPairSync, verify, type KeyObject } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { signAsDraftToRequest } from '@misskey-dev/node-http-message-signatures';
import { createSlaccSigningKey } from '@misskey-dev/node-http-message-signatures/node/slacc';
import type { CustomSigningKey } from '@misskey-dev/node-http-message-signatures';
import type * as Redis from 'ioredis';
import { UserKeypairService } from '@/core/UserKeypairService.js';
import type { GlobalEventService } from '@/core/GlobalEventService.js';
import type { UserEntityService } from '@/core/entities/UserEntityService.js';
import { MiUserKeypair } from '@/models/UserKeypair.js';
import type { UserKeypairsRepository } from '@/models/_.js';

vi.mock('@misskey-dev/node-http-message-signatures/node/slacc', async importOriginal => {
	const actual = await importOriginal<typeof import('@misskey-dev/node-http-message-signatures/node/slacc')>();
	return { ...actual, createSlaccSigningKey: vi.fn(actual.createSlaccSigningKey) };
});

const rsa = generateKeyPairSync('rsa', { modulusLength: 2048 });
const rotatedRsa = generateKeyPairSync('rsa', { modulusLength: 2048 });
const ed = generateKeyPairSync('ed25519');
const rotatedEd = generateKeyPairSync('ed25519');
const pem = (pair: { privateKey: KeyObject }) => pair.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
const publicPem = (pair: { publicKey: KeyObject }) => pair.publicKey.export({ type: 'spki', format: 'pem' }).toString();

async function sign(key: CustomSigningKey) {
	return await signAsDraftToRequest({
		method: 'GET', url: 'https://example.com:8443/outbox?cursor=1', headers: { host: 'example.com:8443' },
	}, key, ['(request-target)', 'host']);
}

describe('native actor signing key cache', () => {
	let service: UserKeypairService;
	let entity: MiUserKeypair;
	let subscriber: ReturnType<typeof mock<Redis.Redis>>;

	beforeEach(() => {
		vi.mocked(createSlaccSigningKey).mockClear();
		entity = new MiUserKeypair({ userId: 'alice', privateKey: pem(rsa), publicKey: publicPem(rsa), ed25519PrivateKey: pem(ed), ed25519PublicKey: publicPem(ed) });
		const repository = mock<UserKeypairsRepository>();
		repository.findOneByOrFail.mockImplementation(async () => entity);
		const users = mock<UserEntityService>();
		users.genLocalUserUri.mockReturnValue('https://example.com/users/alice');
		subscriber = mock<Redis.Redis>();
		service = new UserKeypairService(mock<Redis.Redis>(), subscriber, repository, mock<GlobalEventService>(), users);
	});

	afterEach(() => service.dispose());

	test('shares one real native handle across concurrent callers and repeated signatures', async () => {
		const keys = await Promise.all(Array.from({ length: 16 }, () => service.getLocalUserPrivateKey('alice')));
		expect(keys.every(key => key === keys[0])).toBe(true);
		for (let i = 0; i < 3; i++) {
			const signed = await sign(keys[0]);
			expect(verify('sha256', Buffer.from(signed.signingString), rsa.publicKey, Buffer.from(signed.signature, 'base64'))).toBe(true);
		}
		expect(createSlaccSigningKey).toHaveBeenCalledTimes(1);
	});

	test('binds cache identity to changed key material and key ID', async () => {
		const first = await service.getLocalUserPrivateKey({ keyId: 'key', privateKeyPem: pem(rsa) });
		const rotated = await service.getLocalUserPrivateKey({ keyId: 'key', privateKeyPem: pem(rotatedRsa) });
		expect(rotated).not.toBe(first);
		const signed = await sign(rotated);
		expect(verify('sha256', Buffer.from(signed.signingString), rotatedRsa.publicKey, Buffer.from(signed.signature, 'base64'))).toBe(true);
		expect(verify('sha256', Buffer.from(signed.signingString), rsa.publicKey, Buffer.from(signed.signature, 'base64'))).toBe(false);
		const differentId = await service.getLocalUserPrivateKey({ keyId: 'other-key', privateKeyPem: pem(rotatedRsa) });
		expect(differentId).not.toBe(rotated);
		expect(differentId.keyId).toBe('other-key');
		expect(createSlaccSigningKey).toHaveBeenCalledTimes(3);
	});

	test('rotates Ed25519 material and falls back to RSA when no Ed25519 pair exists', async () => {
		const first = await service.getLocalUserPrivateKey('alice', 'ed25519');
		entity.ed25519PrivateKey = pem(rotatedEd);
		entity.ed25519PublicKey = publicPem(rotatedEd);
		const rotated = await service.getLocalUserPrivateKey(entity, '02');
		expect(rotated).not.toBe(first);
		const signed = await sign(rotated);
		expect(verify(null, Buffer.from(signed.signingString), rotatedEd.publicKey, Buffer.from(signed.signature, 'base64'))).toBe(true);
		entity.ed25519PrivateKey = null;
		entity.ed25519PublicKey = null;
		const fallback = await service.getLocalUserPrivateKey(entity, '02');
		expect(fallback.keyId).toBe('https://example.com/users/alice#main-key');
		const rsaSigned = await sign(fallback);
		expect(verify('sha256', Buffer.from(rsaSigned.signingString), rsa.publicKey, Buffer.from(rsaSigned.signature, 'base64'))).toBe(true);
	});

	test('refresh and update events invalidate both handles while queued keys stay plain PEM', async () => {
		const firstRsa = await service.getLocalUserPrivateKey('alice');
		const firstEd = await service.getLocalUserPrivateKey('alice', 'ed25519');
		await service.refresh('alice');
		const refreshedRsa = await service.getLocalUserPrivateKey('alice');
		const refreshedEd = await service.getLocalUserPrivateKey('alice', 'ed25519');
		expect(refreshedRsa).not.toBe(firstRsa);
		expect(refreshedEd).not.toBe(firstEd);
		const listener = subscriber.on.mock.calls.find(([event]) => event === 'message')?.[1] as (channel: string, message: string) => Promise<void>;
		await listener('internal', JSON.stringify({ channel: 'internal', message: { type: 'userKeypairUpdated', body: { userId: 'alice' } } }));
		const eventRsa = await service.getLocalUserPrivateKey('alice');
		expect(eventRsa).not.toBe(refreshedRsa);
		expect(await service.getLocalUserPrivateKey('alice', 'ed25519')).not.toBe(refreshedEd);
		const queued = await service.getLocalUserPrivateKeyPem('alice');
		expect(Object.keys(queued).sort()).toEqual(['keyId', 'privateKeyPem']);
		expect(await service.getLocalUserPrivateKey(JSON.parse(JSON.stringify(queued)))).toBe(eventRsa);
		expect(createSlaccSigningKey).toHaveBeenCalledTimes(6);
	});

	test('does not cache failed native construction or unsupported actor keys', async () => {
		const weak = generateKeyPairSync('rsa', { modulusLength: 1024 });
		await expect(service.getLocalUserPrivateKey({ keyId: 'key', privateKeyPem: pem(weak) })).rejects.toThrow();
		const valid = await service.getLocalUserPrivateKey({ keyId: 'key', privateKeyPem: pem(rsa) });
		expect(await service.getLocalUserPrivateKey({ keyId: 'key', privateKeyPem: pem(rsa) })).toBe(valid);
		expect(createSlaccSigningKey).toHaveBeenCalledTimes(2);
		const ec = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
		await expect(service.getLocalUserPrivateKey({ keyId: 'ec', privateKeyPem: pem(ec) })).rejects.toThrow('Unsupported actor signing key');
	});
});
