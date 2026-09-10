/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { BlockingsRepository } from '@/models/_.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { Packed } from '@/misc/json-schema.js';
import type { MiBlocking } from '@/models/Blocking.js';
import type { MiUser } from '@/models/User.js';
import { bindThis } from '@/decorators.js';
import { IdService } from '@/core/IdService.js';
import { UserEntityService } from './UserEntityService.js';

@Injectable()
export class BlockingEntityService {
	constructor(
		@Inject(DI.blockingsRepository)
		private blockingsRepository: BlockingsRepository,

		private userEntityService: UserEntityService,
		private idService: IdService,
	) {
	}

	@bindThis
	public async pack(
		src: MiBlocking['id'] | MiBlocking,
		me?: { id: MiUser['id'] } | null | undefined,
		hint?: {
			blockee?: Packed<'UserDetailedNotMe'>,
		},
	): Promise<Packed<'Blocking'>> {
		const blocking = typeof src === 'object' ? src : await this.blockingsRepository.findOneByOrFail({ id: src });

		return await awaitAll({
			id: blocking.id,
			createdAt: this.idService.parse(blocking.id).date.toISOString(),
			blockeeId: blocking.blockeeId,
			blockee: hint?.blockee ?? this.userEntityService.pack(blocking.blockeeId, me, {
				schema: 'UserDetailedNotMe',
			}),
		});
	}

	@bindThis
	public async packMany(
		blockings: MiBlocking[],
		me: { id: MiUser['id'] },
	) {
		const _blockees = blockings.map(({ blockee, blockeeId }) => blockee ?? blockeeId);
		const _userMap = await this.userEntityService.packMany(_blockees, me, { schema: 'UserDetailedNotMe' })
			.then(users => new Map(users.map(u => [u.id, u])));
		return Promise.all(blockings.map(blocking => this.pack(blocking, me, { blockee: _userMap.get(blocking.blockeeId) })));
	}
}
