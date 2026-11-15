/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createPublicKey, generateKeyPairSync, verify } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { DataSource } from 'typeorm';
import type * as Redis from 'ioredis';
import { loadConfig } from '@/config.js';
import { createPostgresDataSource } from '@/postgres.js';
import { MiUser, type MiRemoteUser } from '@/models/User.js';
import { MiUserProfile } from '@/models/UserProfile.js';
import { MiUserPublickey } from '@/models/UserPublickey.js';
import { MiUserKeypair } from '@/models/UserKeypair.js';
import type { NotesRepository, UsersRepository, UserPublickeysRepository, UserKeypairsRepository } from '@/models/_.js';
import { UserKeypairService } from '@/core/UserKeypairService.js';
import type { GlobalEventService } from '@/core/GlobalEventService.js';
import type { UserEntityService } from '@/core/entities/UserEntityService.js';
import { ApPersonService } from '@/core/activitypub/models/ApPersonService.js';
import { ApDbResolverService } from '@/core/activitypub/ApDbResolverService.js';
import { extractActorPublicKeys, storeActorPublicKeys } from '@/core/activitypub/misc/actor-public-keys.js';
import { JsonLd } from '@/core/activitypub/JsonLdService.js';
import type { HttpRequestService } from '@/core/HttpRequestService.js';
import type { CacheService } from '@/core/CacheService.js';
import type { ApLoggerService } from '@/core/activitypub/ApLoggerService.js';
import type { UtilityService } from '@/core/UtilityService.js';
import type { Resolver } from '@/core/activitypub/ApResolverService.js';
import type Logger from '@/logger.js';
import { signAsDraftToRequest, parseRequestSignature, verifyDraftSignature } from '@misskey-dev/node-http-message-signatures';
import { actor, actorId, host, multikey } from '../misc/public-multikey.js';

const rsa = generateKeyPairSync('rsa', { modulusLength: 2048 });
const ed = generateKeyPairSync('ed25519');
const rotated = generateKeyPairSync('ed25519');
const privatePem = (pair: typeof rsa) => pair.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();

describe('actor Multikey database and verification path', () => {
	let db: DataSource;
	const config = loadConfig();
	const subscriber = new EventEmitter();
	const publisher = vi.fn((type: string, body: unknown) => subscriber.emit('message', 'internal', JSON.stringify({ channel: 'internal', message: { type, body } })));
	let resolver: ApDbResolverService;
	let person: ApPersonService;
	const keys = () => db.getRepository(MiUserPublickey);
	const users = () => db.getRepository(MiUser);

	beforeAll(async () => {
		// The normal test configuration is a disposable DB; local overrides isolate this fixture.
		const dbConfig = process.env.MULTIKEY_TEST_DB_PORT == null ? config.db : {
			...config.db, port: Number(process.env.MULTIKEY_TEST_DB_PORT), db: 'test-multikey',
		};
		db = createPostgresDataSource({ ...config, db: dbConfig });
		await db.initialize();
		const utility = mock<UtilityService>();
		utility.punyHost.mockImplementation(host);
		utility.toPuny.mockImplementation(value => value);
		utility.isUriLocal.mockReturnValue(false);
		const logger = mock<Logger>();
		const logging = mock<ApLoggerService>();
		logging.logger = logger;
		logger.createSubLogger.mockReturnValue(logger);
		person = Object.assign(Object.create(ApPersonService.prototype), {
			db, config, meta: {}, utilityService: utility, logger,
			usersRepository: users(), userProfilesRepository: db.getRepository(MiUserProfile),
			idService: { gen: () => 'multikey-alice' },
			apNoteService: { extractEmojis: vi.fn().mockResolvedValue([]) },
			cacheService: { uriPersonCache: { set: vi.fn() } },
			usersChart: { update: vi.fn() }, hashtagService: { updateUsertags: vi.fn() },
			globalEventService: { publishInternalEvent: publisher },
			followingsRepository: { update: vi.fn().mockResolvedValue(undefined) },
		});
		for (const [name, value] of Object.entries({
			fetchPerson: async (uri: string) => await users().findOneBy({ uri }) as MiRemoteUser | null,
			isPublicCollection: vi.fn().mockResolvedValue(true),
			resolveAvatarAndBanner: vi.fn().mockResolvedValue({ avatarId: null, bannerId: null }),
			updateFeatured: vi.fn().mockResolvedValue(undefined),
		})) Object.defineProperty(person, name, { value, configurable: true });
		const resolution = mock<ApPersonService>();
		resolution.resolvePerson.mockImplementation(async uri => await users().findOneByOrFail({ uri }) as MiRemoteUser);
		resolver = new ApDbResolverService(config, users() as UsersRepository, mock<NotesRepository>(), keys() as UserPublickeysRepository, subscriber as unknown as Redis.Redis, mock<CacheService>(), resolution, logging, utility);
	});

	afterEach(async () => {
		await users().deleteAll();
		resolver.refreshCacheByUserId('multikey-alice');
		publisher.mockClear();
	});
	afterAll(async () => { resolver?.dispose(); if (db?.isInitialized) await db.destroy(); });

	async function create(entries = [multikey(ed.publicKey)]) {
		return await person.createPerson(actorId, { resolve: async () => actor({ assertionMethod: entries }) } as unknown as Resolver);
	}

	async function update(extra: Parameters<typeof actor>[0]) {
		await person.updatePerson(actorId, {} as Resolver, actor(extra));
	}

	async function verifies(pair: typeof rsa, keyId = actorId + '#key') {
		const request = { method: 'POST', url: 'https://recipient.example:8443/inbox?token=1', headers: { host: 'recipient.example:8443', date: new Date().toUTCString() } };
		await signAsDraftToRequest(request, { keyId, privateKeyPem: privatePem(pair) }, ['(request-target)', 'host', 'date']);
		const parsed = parseRequestSignature(request);
		if (parsed.version !== 'draft') throw new Error('Expected draft signature');
		const auth = await resolver.getAuthUserFromApId(actorId, keyId);
		return auth?.key == null ? false : await verifyDraftSignature(JSON.parse(JSON.stringify(parsed.value)), auth.key.keyPem);
	}

	test.each([rsa, ed])('creates, stores, resolves, and verifies an embedded public key', async pair => {
		await create([multikey(pair.publicKey)]);
		expect(await verifies(pair)).toBe(true);
		const stored = await keys().findOneByOrFail({ keyId: actorId + '#key' });
		expect(stored.keyPem).toContain('BEGIN PUBLIC KEY');
		expect(await resolver.getAuthUserFromApId(actorId, 'https://other.example/key')).toBeNull();
		const otherAlgorithm = pair === rsa ? ed : rsa;
		expect(await verifies(otherAlgorithm)).toBe(false);
	});

	test('commits rotations before the update event and invalidates cached material', async () => {
		await create();
		expect(await verifies(ed)).toBe(true);
		let observed: Promise<MiUserPublickey> | undefined;
		publisher.mockImplementationOnce((type, body) => {
			observed = keys().findOneByOrFail({ keyId: actorId + '#key' });
			return subscriber.emit('message', 'internal', JSON.stringify({ channel: 'internal', message: { type, body } }));
		});
		await update({ assertionMethod: [multikey(rotated.publicKey)] });
		expect((await observed)?.keyPem).toBe(rotated.publicKey.export({ type: 'spki', format: 'pem' }).toString());
		expect(await verifies(rotated)).toBe(true);
		expect(await verifies(ed)).toBe(false);
		await update({ assertionMethod: [multikey(ed.publicKey, actorId + '#new')] });
		expect(await verifies(ed, actorId + '#new')).toBe(true);
		expect(await verifies(rotated)).toBe(false);
		expect(publisher).toHaveBeenCalledTimes(2);
	});

	test('preserves omitted and malformed-only keys, but explicit empty removes keys', async () => {
		await create();
		await update({});
		await update({ assertionMethod: [{ ...multikey(ed.publicKey), publicKeyMultibase: 'invalid' }] });
		expect(await verifies(ed)).toBe(true);
		await update({ assertionMethod: [] });
		expect(await keys().count()).toBe(0);
		expect(await verifies(ed)).toBe(false);
	});

	test('empty assertionMethod retains current legacy material and JSON-LD RSA verification', async () => {
		await create();
		const publicKeyPem = rsa.publicKey.export({ type: 'spki', format: 'pem' }).toString();
		await update({ assertionMethod: [], publicKey: { type: 'Key', id: actorId + '#rsa', owner: actorId, publicKeyPem } });
		expect(await verifies(rsa, actorId + '#rsa')).toBe(true);
		expect(await verifies(ed)).toBe(false);
		const ld = new JsonLd(mock<HttpRequestService>());
		vi.spyOn(ld, 'createVerifyData').mockResolvedValue('unchanged signature base');
		const signed = await ld.signRsaSignature2017({ id: actorId + '/object' }, privatePem(rsa), actorId + '#rsa');
		const auth = await resolver.getAuthUserFromApId(actorId, actorId + '#rsa');
		expect(await ld.verifyRsaSignature2017(signed, auth!.key!.keyPem)).toBe(true);
	});

	test('rejects a conflicting ID while retaining unrelated valid keys', async () => {
		await create();
		await update({ assertionMethod: [multikey(ed.publicKey), multikey(rotated.publicKey), multikey(rsa.publicKey, actorId + '#good')] });
		expect(await verifies(ed)).toBe(false);
		expect(await verifies(rsa, actorId + '#good')).toBe(true);
	});

	test('foreign actors cannot overwrite an occupied keyId, even with concurrent inserts', async () => {
		await create();
		await users().insert({ id: 'multikey-bob', username: 'bob', usernameLower: 'bob', host: 'remote.example', uri: actorId + '-bob' });
		const first = extractActorPublicKeys(actor({ assertionMethod: [multikey(ed.publicKey, actorId + '#race')] }), host)!;
		const bobId = actorId + '-bob';
		const second = extractActorPublicKeys(actor({ id: bobId, assertionMethod: [{ ...multikey(rotated.publicKey, actorId + '#race'), controller: bobId }] }), host)!;
		await Promise.all([
			db.transaction(manager => storeActorPublicKeys(manager, 'multikey-alice', { ...first, replace: false })),
			db.transaction(manager => storeActorPublicKeys(manager, 'multikey-bob', { ...second, replace: false })),
		]);
		const occupied = await keys().findOneByOrFail({ keyId: actorId + '#race' });
		const original = { userId: occupied.userId, keyPem: occupied.keyPem };
		const foreign = occupied.userId === 'multikey-alice' ? 'multikey-bob' : 'multikey-alice';
		await db.transaction(manager => storeActorPublicKeys(manager, foreign, { ...second, replace: false }));
		expect(await keys().findOneByOrFail({ keyId: actorId + '#race' })).toMatchObject(original);
	});

	test('readers see the old key set until the complete replacement commits', async () => {
		await create();
		const runner = db.createQueryRunner();
		await runner.connect();
		await runner.startTransaction();
		try {
			await storeActorPublicKeys(runner.manager, 'multikey-alice', extractActorPublicKeys(actor({ assertionMethod: [multikey(rotated.publicKey, actorId + '#new')] }), host)!);
			expect((await keys().find()).map(key => key.keyId)).toEqual([actorId + '#key']);
			await runner.commitTransaction();
			expect((await keys().find()).map(key => key.keyId)).toEqual([actorId + '#new']);
		} finally {
			if (runner.isTransactionActive) await runner.rollbackTransaction();
			await runner.release();
		}
	});

	test('malformed entries do not revoke existing keys when another valid key is added', async () => {
		await create();
		await update({ assertionMethod: [multikey(rsa.publicKey, actorId + '#rsa'), { ...multikey(rotated.publicKey), controller: actorId + '-other' }] });
		expect(await verifies(ed)).toBe(true);
		expect(await verifies(rsa, actorId + '#rsa')).toBe(true);
	});

	test('does not treat a standalone Multikey document as an Actor', async () => {
		await expect(person.createPerson(actorId, { resolve: async () => multikey(ed.publicKey) } as unknown as Resolver)).rejects.toThrow('invalid Actor type');
		expect(await keys().count()).toBe(0);
	});

	test('upgrades legacy PKCS#1 storage without regenerating RSA or existing Ed25519 keys', async () => {
		await create();
		const repository = db.getRepository(MiUserKeypair);
		const old = {
			userId: 'multikey-alice', publicKey: rsa.publicKey.export({ type: 'spki', format: 'pem' }).toString(),
			privateKey: rsa.privateKey.export({ type: 'pkcs1', format: 'pem' }).toString(),
			ed25519PublicKey: ed.publicKey.export({ type: 'spki', format: 'pem' }).toString(),
			ed25519PrivateKey: privatePem(ed),
		};
		await repository.insert(old);
		const redis = mock<Redis.Redis>();
		redis.get.mockImplementation(async key => key.includes('userKeypair:v2') ? null : JSON.stringify(old));
		const entities = mock<UserEntityService>();
		entities.genLocalUserUri.mockReturnValue(actorId);
		const service = new UserKeypairService(redis, mock<Redis.Redis>(), repository as UserKeypairsRepository, mock<GlobalEventService>(), entities);
		try {
			const loaded = await service.getUserKeypair(old.userId);
			const saved = await repository.findOneByOrFail({ userId: old.userId });
			expect(saved.privateKey).toContain('BEGIN PRIVATE KEY');
			expect(saved.publicKey).toBe(old.publicKey);
			expect(createPublicKey(saved.privateKey).export({ type: 'spki', format: 'pem' }).toString()).toBe(old.publicKey);
			expect(saved.ed25519PublicKey).toBe(old.ed25519PublicKey);
			expect(saved.ed25519PrivateKey).toBe(old.ed25519PrivateKey);
			expect(redis.get).toHaveBeenCalledWith(expect.stringContaining('userKeypair:v2'));
			for (const [level, pair] of [['01', rsa], ['11', rsa], ['02', ed], ['unknown', rsa]] as const) {
				const key = await service.getLocalUserPrivateKey(loaded, level);
				const request = { method: 'GET', url: 'https://recipient.example/inbox', headers: { host: 'recipient.example' } };
				const signed = await signAsDraftToRequest(request, key, ['(request-target)', 'host']);
				expect(key.keyId).toBe(actorId + (level === '02' ? '#ed25519-key' : '#main-key'));
				expect(verify(level === '02' ? null : 'sha256', Buffer.from(signed.signingString), pair.publicKey, Buffer.from(signed.signature, 'base64'))).toBe(true);
			}
		} finally {
			service.dispose();
		}
	});

	test('rolls back a partial refresh and emits no success event on failure', async () => {
		await create();
		const query = vi.spyOn(db, 'transaction').mockRejectedValueOnce(new Error('write failed'));
		await expect(update({ assertionMethod: [multikey(rotated.publicKey)] })).rejects.toThrow('write failed');
		expect(publisher).not.toHaveBeenCalled();
		query.mockRestore();
		expect(await verifies(ed)).toBe(true);
		await expect(db.transaction(async manager => {
			await storeActorPublicKeys(manager, 'multikey-alice', extractActorPublicKeys(actor({ assertionMethod: [] }), host)!);
			throw new Error('abort');
		})).rejects.toThrow('abort');
		expect(await verifies(ed)).toBe(true);
	});
});
