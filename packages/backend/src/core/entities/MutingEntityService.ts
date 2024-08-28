/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { MutingsRepository } from '@/models/_.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { Packed } from '@/misc/json-schema.js';
import type { } from '@/models/Blocking.js';
import type { MiUser } from '@/models/User.js';
import type { MiMuting } from '@/models/Muting.js';
import { bindThis } from '@/decorators.js';
import { IdService } from '@/core/IdService.js';
import { UserEntityService } from './UserEntityService.js';

@Injectable()
export class MutingEntityService {
	constructor(
		@Inject(DI.mutingsRepository)
		private mutingsRepository: MutingsRepository,

		private userEntityService: UserEntityService,
		private idService: IdService,
	) {
	}

	@bindThis
	public async pack(
		src: MiMuting['id'] | MiMuting,
		me?: { id: MiUser['id'] } | null | undefined,
		hints?: {
			packedMutee?: Packed<'UserDetailedNotMe'>,
		},
	): Promise<Packed<'Muting'>> {
		const muting = typeof src === 'object' ? src : await this.mutingsRepository.findOneByOrFail({ id: src });

		return await awaitAll({
			id: muting.id,
			createdAt: this.idService.parse(muting.id).date.toISOString(),
			expiresAt: muting.expiresAt ? muting.expiresAt.toISOString() : null,
			muteeId: muting.muteeId,
			mutee: hints?.packedMutee ?? this.userEntityService.pack(muting.muteeId, me, {
				schema: 'UserDetailedNotMe',
			}),
		});
	}

	@bindThis
	public async packMany(
		mutings: MiMuting[],
		me: { id: MiUser['id'] },
	) {
		const _mutees = mutings.map(({ mutee, muteeId }) => mutee ?? muteeId);
		const _userMap = await this.userEntityService.packMany(_mutees, me, { schema: 'UserDetailedNotMe' })
			.then(users => new Map(users.map(u => [u.id, u])));
		return Promise.all(mutings.map(muting => this.pack(muting, me, { packedMutee: _userMap.get(muting.muteeId) })));
	}
}

