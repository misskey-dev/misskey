/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { generateKeyPairSync, sign, verify } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type * as Redis from 'ioredis';
import type { Config } from '@/config.js';
import type { MiRemoteUser, MiUser } from '@/models/User.js';
import { MiUserPublickey } from '@/models/UserPublickey.js';
import type { NotesRepository, UserPublickeysRepository, UsersRepository } from '@/models/_.js';
import { ApDbResolverService } from '@/core/activitypub/ApDbResolverService.js';
import { ApPersonService } from '@/core/activitypub/models/ApPersonService.js';
import type { ApLoggerService } from '@/core/activitypub/ApLoggerService.js';
import type { CacheService } from '@/core/CacheService.js';
import type { UtilityService } from '@/core/UtilityService.js';
import type Logger from '@/logger.js';

const actorUri = 'https://remote.example/users/alice';
const keyId = actorUri + '#main-key';
const rsa = generateKeyPairSync('rsa', { modulusLength: 2048 });
const publicKeyPem = rsa.publicKey.export({ type: 'spki', format: 'pem' }).toString();
const resolvers: ApDbResolverService[] = [];

afterEach(() => { for (const resolver of resolvers.splice(0)) resolver.dispose(); });

function fixture(ownerChanges: Partial<MiUser> = {}, cachedDeleted = true) {
	const owner = { id: 'renewed-alice', uri: actorUri, host: 'remote.example', isDeleted: false, lastFetchedAt: new Date(), ...ownerChanges } as MiRemoteUser;
	const cachedActor = cachedDeleted ? { ...owner, id: 'deleted-alice', uri: actorUri, isDeleted: true } : owner;
	const key = new MiUserPublickey({ userId: owner.id, keyId, keyPem: publicKeyPem });
	const users = mock<UsersRepository>();
	users.findOneBy.mockImplementation(async where => {
		if (Array.isArray(where)) return null;
		if (where.id === cachedActor.id && where.uri == null && where.isDeleted == null) return cachedActor;
		return owner.id === where.id && owner.uri === where.uri && owner.isDeleted === where.isDeleted ? owner : null;
	});
	const keys = mock<UserPublickeysRepository>();
	keys.findOneBy.mockResolvedValue(key);
	keys.find.mockResolvedValue([key]);
	const person = mock<ApPersonService>();
	person.resolvePerson.mockResolvedValue(cachedActor);
	const cache = mock<CacheService>();
	cache.findUserById.mockResolvedValue(owner);
	cache.uriPersonCache = { delete: vi.fn() } as unknown as CacheService['uriPersonCache'];
	const utility = mock<UtilityService>();
	utility.punyHost.mockImplementation(uri => new URL(uri).host);
	const logger = mock<Logger>();
	logger.createSubLogger.mockReturnValue(logger);
	const logging = mock<ApLoggerService>();
	logging.logger = logger;
	const resolver = new ApDbResolverService({} as Config, users, mock<NotesRepository>(), keys, new EventEmitter() as unknown as Redis.Redis, cache, person, logging, utility);
	resolvers.push(resolver);
	return { resolver, owner, cachedActor, users, keys, person, cache };
}

describe('AP authentication with a cached deleted actor', () => {
	test('authenticates the live key owner instead of the stale deleted URI-cache identity', async () => {
		const { resolver, owner, cachedActor, users, person } = fixture();
		const auth = await resolver.getAuthUserFromApId(actorUri, keyId);
		expect(auth?.user?.id).toBe(owner.id);
		expect(auth?.user?.id).not.toBe(cachedActor.id);
		expect(auth?.key?.keyPem).toBe(publicKeyPem);
		expect(users.findOneBy).toHaveBeenCalledWith({ id: owner.id, uri: actorUri, isDeleted: false });
		const signingString = '(request-target): post /inbox\nhost: recipient.example';
		const signature = sign('RSA-SHA256', Buffer.from(signingString), rsa.privateKey);
		expect(verify('RSA-SHA256', Buffer.from(signingString), auth!.key!.keyPem, signature)).toBe(true);
		expect(verify('RSA-SHA256', Buffer.from(signingString + 'changed'), auth!.key!.keyPem, signature)).toBe(false);
		expect(cachedActor.isDeleted).toBe(true);
		expect(person.resolvePerson).toHaveBeenCalledTimes(1);
	});

	test('re-resolves a cached deleted actor only after its database identity was physically removed', async () => {
		const { resolver, owner, cachedActor, users, keys, person, cache } = fixture();
		keys.findOneBy.mockResolvedValue(null); // The deleted owner's key was removed by ON DELETE CASCADE.
		users.findOneBy.mockResolvedValue(null);
		person.resolvePerson.mockResolvedValueOnce(cachedActor).mockResolvedValueOnce(owner);
		const auth = await resolver.getAuthUserFromApId(actorUri, keyId);
		expect(users.findOneBy).toHaveBeenCalledWith({ id: cachedActor.id });
		expect(cache.uriPersonCache.delete).toHaveBeenCalledWith(actorUri);
		expect(person.resolvePerson).toHaveBeenCalledTimes(2);
		expect(auth?.user?.id).toBe(owner.id);
		expect(auth?.key?.keyPem).toBe(publicKeyPem);
		expect(cachedActor.isDeleted).toBe(true);
	});

	test('does not clear a deleted identity that still exists in the database', async () => {
		const { resolver, person, cache } = fixture({ isDeleted: true });
		expect(await resolver.getAuthUserFromApId(actorUri, keyId)).toEqual({ user: null, key: null });
		expect(cache.uriPersonCache.delete).not.toHaveBeenCalled();
		expect(person.resolvePerson).toHaveBeenCalledTimes(1);
	});

	test('still rejects a deleted actor returned after re-resolution', async () => {
		const { resolver, users, keys, person } = fixture();
		keys.findOneBy.mockResolvedValue(null);
		users.findOneBy.mockResolvedValue(null);
		expect(await resolver.getAuthUserFromApId(actorUri, keyId)).toEqual({ user: null, key: null });
		expect(person.resolvePerson).toHaveBeenCalledTimes(2);
		expect(keys.find).not.toHaveBeenCalled();
	});

	test('does not authenticate a key owner that is still deleted', async () => {
		const { resolver, keys } = fixture({ isDeleted: true });
		expect(await resolver.getAuthUserFromApId(actorUri, keyId)).toEqual({ user: null, key: null });
		expect(keys.find).not.toHaveBeenCalled();
	});

	test('does not borrow a different actor identity from a key on the same host', async () => {
		const { resolver, keys } = fixture({ uri: 'https://remote.example/users/bob' });
		expect(await resolver.getAuthUserFromApId(actorUri, keyId)).toEqual({ user: null, key: null });
		expect(keys.find).not.toHaveBeenCalled();
	});

	test('does not accept a local key owner for a remote actor', async () => {
		const { resolver, keys } = fixture({ host: null });
		expect(await resolver.getAuthUserFromApId(actorUri, keyId)).toEqual({ user: null, key: null });
		expect(keys.find).not.toHaveBeenCalled();
	});

	test('does not authenticate a deleted actor when the requested key is absent', async () => {
		const { resolver, keys, users, cachedActor, person } = fixture();
		keys.findOneBy.mockResolvedValue(null);
		expect(await resolver.getAuthUserFromApId(actorUri, keyId)).toEqual({ user: null, key: null });
		expect(users.findOneBy).toHaveBeenCalledWith({ id: cachedActor.id });
		expect(person.resolvePerson).toHaveBeenCalledTimes(1);
		expect(keys.find).not.toHaveBeenCalled();
	});

	test('does not authenticate a deleted actor without a requested key', async () => {
		const { resolver, keys } = fixture();
		expect(await resolver.getAuthUserFromApId(actorUri)).toEqual({ user: null, key: null });
		expect(keys.findOneBy).not.toHaveBeenCalled();
	});

	test('keeps the ordinary live-actor key lookup', async () => {
		const { resolver, owner, keys } = fixture({}, false);
		expect((await resolver.getAuthUserFromApId(actorUri, keyId))?.user?.id).toBe(owner.id);
		expect(keys.findOneBy).not.toHaveBeenCalled();
	});

	test('rejects a key on another host before resolving any identity', async () => {
		const { resolver, person, keys } = fixture();
		expect(await resolver.getAuthUserFromApId(actorUri, 'https://foreign.example/key')).toBeNull();
		expect(person.resolvePerson).not.toHaveBeenCalled();
		expect(keys.findOneBy).not.toHaveBeenCalled();
	});
});
