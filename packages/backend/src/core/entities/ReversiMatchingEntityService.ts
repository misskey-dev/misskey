/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { MiReversiMatching, ReversiMatchingsRepository } from '@/models/_.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { Packed } from '@/misc/json-schema.js';
import type { } from '@/models/Blocking.js';
import type { MiUser } from '@/models/User.js';
import { bindThis } from '@/decorators.js';
import { IdService } from '@/core/IdService.js';
import { UserEntityService } from './UserEntityService.js';

@Injectable()
export class ReversiMatchingEntityService {
	constructor(
		@Inject(DI.reversiMatchingsRepository)
		private reversiMatchingsRepository: ReversiMatchingsRepository,

		private userEntityService: UserEntityService,
		private idService: IdService,
	) {
	}

	@bindThis
	public async pack(
		src: MiReversiMatching['id'] | MiReversiMatching,
		me?: { id: MiUser['id'] } | null | undefined,
	): Promise<Packed<'ReversiMatching'>> {
		const matching = typeof src === 'object' ? src : await this.reversiMatchingsRepository.findOneByOrFail({ id: src });

		return await awaitAll({
			id: matching.id,
			createdAt: this.idService.parse(matching.id).date.toISOString(),
			parentId: matching.parentId,
			parent: this.userEntityService.pack(matching.parentId, me, {
				detail: true,
			}),
			childId: matching.childId,
			child: this.userEntityService.pack(matching.childId, me, {
				detail: true,
			}),
		});
	}

	@bindThis
	public packMany(
		xs: MiReversiMatching[],
		me?: { id: MiUser['id'] } | null | undefined,
	) {
		return Promise.all(xs.map(x => this.pack(x, me)));
	}
}

