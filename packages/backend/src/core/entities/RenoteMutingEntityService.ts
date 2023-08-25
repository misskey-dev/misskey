/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { RenoteMutingsRepository } from '@/models/index.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { Packed } from '@/misc/json-schema.js';
import type { MiUser } from '@/models/entities/User.js';
import type { MiRenoteMuting } from '@/models/entities/RenoteMuting.js';
import { bindThis } from '@/decorators.js';
import { UserEntityService } from './UserEntityService.js';

@Injectable()
export class RenoteMutingEntityService {
	constructor(
		@Inject(DI.renoteMutingsRepository)
		private renoteMutingsRepository: RenoteMutingsRepository,

		private userEntityService: UserEntityService,
	) {
	}

	@bindThis
	public async pack(
		src: MiRenoteMuting['id'] | MiRenoteMuting,
		me: { id: MiUser['id'] } | null | undefined,
	): Promise<Packed<'RenoteMuting'>> {
		const muting = typeof src === 'object' ? src : await this.renoteMutingsRepository.findOneByOrFail({ id: src });

		return await awaitAll({
			id: muting.id,
			createdAt: muting.createdAt.toISOString(),
			muteeId: muting.muteeId,
			mutee: this.userEntityService.pack(muting.muteeId, me, {
				detail: true,
			}),
		});
	}

	@bindThis
	public async packMany(
		mutings: (MiRenoteMuting['id'] | MiRenoteMuting)[],
		me: { id: MiUser['id'] } | null | undefined,
	) : Promise<Packed<'RenoteMuting'>[]> {
		return (await Promise.allSettled(mutings.map(u => this.pack(u, me))))
			.filter(result => result.status === 'fulfilled')
			.map(result => (result as PromiseFulfilledResult<Packed<'RenoteMuting'>>).value);
	}
}
