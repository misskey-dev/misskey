/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { FlashsRepository, FlashLikesRepository } from '@/models/_.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { Packed } from '@/misc/json-schema.js';
import type { } from '@/models/Blocking.js';
import type { MiUser } from '@/models/User.js';
import type { MiFlash } from '@/models/Flash.js';
import { bindThis } from '@/decorators.js';
import { IdService } from '@/core/IdService.js';
import { UserEntityService } from './UserEntityService.js';

@Injectable()
export class FlashEntityService {
	constructor(
		@Inject(DI.flashsRepository)
		private flashsRepository: FlashsRepository,

		@Inject(DI.flashLikesRepository)
		private flashLikesRepository: FlashLikesRepository,

		private userEntityService: UserEntityService,
		private idService: IdService,
	) {
	}

	@bindThis
	public async pack(
		src: MiFlash['id'] | MiFlash,
		me?: { id: MiUser['id'] } | null | undefined,
		hint?: {
			packedUser?: Packed<'UserLite'>
		},
	): Promise<Packed<'Flash'>> {
		const meId = me ? me.id : null;
		const flash = typeof src === 'object' ? src : await this.flashsRepository.findOneByOrFail({ id: src });

		return await awaitAll({
			id: flash.id,
			createdAt: this.idService.parse(flash.id).date.toISOString(),
			updatedAt: flash.updatedAt.toISOString(),
			userId: flash.userId,
			user: hint?.packedUser ?? this.userEntityService.pack(flash.user ?? flash.userId, me), // { schema: 'UserDetailed' } すると無限ループするので注意
			title: flash.title,
			summary: flash.summary,
			script: flash.script,
			likedCount: flash.likedCount,
			isLiked: meId ? await this.flashLikesRepository.exists({ where: { flashId: flash.id, userId: meId } }) : undefined,
		});
	}

	@bindThis
	public async packMany(
		flashes: MiFlash[],
		me?: { id: MiUser['id'] } | null | undefined,
	) {
		const _users = flashes.map(({ user, userId }) => user ?? userId);
		const _userMap = await this.userEntityService.packMany(_users, me)
			.then(users => new Map(users.map(u => [u.id, u])));
		return Promise.all(flashes.map(flash => this.pack(flash, me, { packedUser: _userMap.get(flash.userId) })));
	}
}

