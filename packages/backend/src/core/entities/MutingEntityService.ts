/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { MutingsRepository } from '@/models/index.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { Packed } from '@/misc/json-schema.js';
import type { User } from '@/models/entities/User.js';
import type { Muting } from '@/models/entities/Muting.js';
import { bindThis } from '@/decorators.js';
import { UserEntityService } from './UserEntityService.js';

@Injectable()
export class MutingEntityService {
	constructor(
		@Inject(DI.mutingsRepository)
		private mutingsRepository: MutingsRepository,

		private userEntityService: UserEntityService,
	) {
	}

	@bindThis
	public async pack(
		src: Muting['id'] | Muting,
		me: { id: User['id'] } | null | undefined,
	): Promise<Packed<'Muting'>> {
		const muting = typeof src === 'object' ? src : await this.mutingsRepository.findOneByOrFail({ id: src });

		return await awaitAll({
			id: muting.id,
			createdAt: muting.createdAt.toISOString(),
			expiresAt: muting.expiresAt ? muting.expiresAt.toISOString() : null,
			muteeId: muting.muteeId,
			mutee: this.userEntityService.pack(muting.muteeId, me, {
				detail: true,
			}),
		});
	}

	@bindThis
	public async packMany(
		mutings: (Muting['id'] | Muting)[],
		me: { id: User['id'] } | null | undefined,
	) : Promise<Packed<'Muting'>[]> {
		return (await Promise.allSettled(mutings.map(x => this.pack(x, me))))
			.filter(result => result.status === 'fulfilled')
			.map(result => (result as PromiseFulfilledResult<Packed<'Muting'>>).value);
	}
}
