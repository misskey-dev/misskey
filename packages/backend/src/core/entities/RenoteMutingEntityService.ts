/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { RenoteMutingsRepository } from '@/models/_.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { Packed } from '@/misc/json-schema.js';
import type { } from '@/models/Blocking.js';
import type { MiUser } from '@/models/User.js';
import type { MiRenoteMuting } from '@/models/RenoteMuting.js';
import { bindThis } from '@/decorators.js';
import { IdService } from '@/core/IdService.js';
import { UserEntityService } from './UserEntityService.js';

@Injectable()
export class RenoteMutingEntityService {
	constructor(
		@Inject(DI.renoteMutingsRepository)
		private renoteMutingsRepository: RenoteMutingsRepository,

		private userEntityService: UserEntityService,
		private idService: IdService,
	) {
	}

	@bindThis
	public async pack(
		src: MiRenoteMuting['id'] | MiRenoteMuting,
		me?: { id: MiUser['id'] } | null | undefined,
		hints?: {
			packedMutee?: Packed<'UserDetailedNotMe'>
		},
	): Promise<Packed<'RenoteMuting'>> {
		const muting = typeof src === 'object' ? src : await this.renoteMutingsRepository.findOneByOrFail({ id: src });

		return await awaitAll({
			id: muting.id,
			createdAt: this.idService.parse(muting.id).date.toISOString(),
			muteeId: muting.muteeId,
			mutee: hints?.packedMutee ?? this.userEntityService.pack(muting.muteeId, me, {
				schema: 'UserDetailedNotMe',
			}),
		});
	}

	@bindThis
	public async packMany(
		mutings: MiRenoteMuting[],
		me: { id: MiUser['id'] },
	) {
		const _users = mutings.map(({ mutee, muteeId }) => mutee ?? muteeId);
		const _userMap = await this.userEntityService.packMany(_users, me, { schema: 'UserDetailedNotMe' })
			.then(users => new Map(users.map(u => [u.id, u])));
		return Promise.all(mutings.map(muting => this.pack(muting, me, { packedMutee: _userMap.get(muting.muteeId) })));
	}
}

