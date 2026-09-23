/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test, vi } from 'vitest';
import { ApInboxService } from '@/core/activitypub/ApInboxService.js';
import { ApPersonService } from '@/core/activitypub/models/ApPersonService.js';
import type { MiRemoteUser } from '@/models/User.js';
import type { IActivity, IActor } from '@/core/activitypub/type.js';

const uri = 'https://remote.example/users/actor';

describe('suspended ActivityPub actors', () => {
	test.each(['isSuspended', 'isRemoteSuspended'] as const)('only actor updates pass the %s gate', async flag => {
		const actor = { uri, [flag]: true } as unknown as MiRemoteUser;
		const updatePerson = vi.fn().mockResolvedValue(undefined);
		const updateQuestion = vi.fn().mockResolvedValue(undefined);
		const service: ApInboxService = Object.assign(Object.create(ApInboxService.prototype), {
			logger: { debug: vi.fn(), error: vi.fn() },
			userEntityService: { isSuspendedEither: (user: MiRemoteUser) => user.isSuspended || user.isRemoteSuspended },
			apPersonService: { updatePerson },
			apQuestionService: { updateQuestion },
		});
		for (const type of ['Follow', 'Like', 'Block', 'Undo', 'Create', 'Delete', 'Accept', 'Reject', 'Announce', 'Move']) {
			expect(await service.performOneActivity(actor, { type, actor: uri } as IActivity)).toBe('skip: suspended actor');
		}
		const person = { type: 'Person', id: uri, suspended: false };
		const resolver = { resolve: vi.fn().mockResolvedValue(person) };
		expect(await service.performOneActivity(actor, { type: 'Update', actor: uri, object: person } as IActivity, resolver as any)).toBe('ok: Person updated');
		expect(updatePerson).toHaveBeenCalledWith(uri, resolver, person);
		resolver.resolve.mockResolvedValue({ type: 'Question', id: uri, suspended: false });
		expect(await service.performOneActivity(actor, { type: 'Update', actor: uri, object: uri } as IActivity, resolver as any)).toBe('skip: suspended actor');
		expect(updateQuestion).not.toHaveBeenCalled();
	});
});

describe('remote suspension metadata', () => {
	test.each([undefined, false, true])('Update Person suspended=%s preserves the state contract', async suspended => {
		let current = { id: 'remote-user', uri, host: 'remote.example', isRemoteSuspended: true, isSuspended: false, movedToUri: null, movedAt: null } as MiRemoteUser;
		const update = vi.fn().mockImplementation(async (_criteria, changes) => {
			current = { ...current, ...changes };
			return { affected: 1 };
		});
		const suspendFromRemote = vi.fn().mockImplementation(async () => { current.isRemoteSuspended = true; });
		const unsuspendFromRemote = vi.fn().mockImplementation(async () => { current.isRemoteSuspended = false; });
		const set = vi.fn();
		const service: ApPersonService = Object.assign(Object.create(ApPersonService.prototype), {
			utilityService: { isUriLocal: () => false },
			logger: { info: vi.fn(), error: vi.fn() },
			apNoteService: { extractEmojis: vi.fn().mockResolvedValue([]) },
			usersRepository: { update, findOneByOrFail: vi.fn().mockImplementation(async () => current) },
			userProfilesRepository: { update: vi.fn().mockResolvedValue(undefined) },
			followingsRepository: { update: vi.fn().mockResolvedValue(undefined) },
			userSuspendService: { suspendFromRemote, unsuspendFromRemote },
			globalEventService: { publishInternalEvent: vi.fn() },
			hashtagService: { updateUsertags: vi.fn() },
			cacheService: { uriPersonCache: { set } },
		});
		vi.spyOn(service, 'fetchPerson').mockImplementation(async () => ({ ...current }));
		vi.spyOn(service as any, 'validateActor').mockImplementation(object => object);
		vi.spyOn(service as any, 'isPublicCollection').mockResolvedValue(true);
		vi.spyOn(service as any, 'resolveAvatarAndBanner').mockResolvedValue({});
		vi.spyOn(service, 'updateFeatured').mockResolvedValue(undefined);
		await service.updatePerson(uri, {} as any, { type: 'Person', id: uri, name: 'Actor', suspended } as IActor);
		expect(update.mock.calls[0][1]).not.toHaveProperty('isRemoteSuspended');
		expect(current.isRemoteSuspended).toBe(suspended !== false);
		expect(unsuspendFromRemote).toHaveBeenCalledTimes(suspended === false ? 1 : 0);
		expect(suspendFromRemote).toHaveBeenCalledTimes(suspended === true ? 1 : 0);
		expect(set).toHaveBeenCalledWith(uri, expect.objectContaining({ isRemoteSuspended: suspended !== false }));
	});
});
