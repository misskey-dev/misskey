/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { BlockingsRepository } from '@/models/index.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { Packed } from '@/misc/json-schema.js';
import type { Blocking } from '@/models/entities/Blocking.js';
import type { User } from '@/models/entities/User.js';
import { bindThis } from '@/decorators.js';
import { UserEntityService } from './UserEntityService.js';

@Injectable()
export class BlockingEntityService {
	constructor(
		@Inject(DI.blockingsRepository)
		private blockingsRepository: BlockingsRepository,

		private userEntityService: UserEntityService,
	) {
	}

	@bindThis
	public async pack(
		src: Blocking['id'] | Blocking,
		me?: { id: User['id'] } | null | undefined,
	): Promise<Packed<'Blocking'>> {
		const blocking = typeof src === 'object' ? src : await this.blockingsRepository.findOneByOrFail({ id: src });

		return await awaitAll({
			id: blocking.id,
			createdAt: blocking.createdAt.toISOString(),
			blockeeId: blocking.blockeeId,
			blockee: this.userEntityService.pack(blocking.blockeeId, me, {
				detail: true,
			}),
		});
	}

	@bindThis
	public packMany(
		blockings: any[],
		me: { id: User['id'] },
	) {
		return Promise.all(blockings.map(x => this.pack(x, me)));
	}
}
