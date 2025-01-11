/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { FlashLikesRepository, FlashsRepository } from '@/models/_.js';
import type { Packed } from '@/misc/json-schema.js';
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
			packedUser?: Packed<'UserLite'>,
			likedFlashIds?: MiFlash['id'][],
		},
	): Promise<Packed<'Flash'>> {
		const meId = me ? me.id : null;
		const flash = typeof src === 'object' ? src : await this.flashsRepository.findOneByOrFail({ id: src });

		// { schema: 'UserDetailed' } すると無限ループするので注意
		const user = hint?.packedUser ?? await this.userEntityService.pack(flash.user ?? flash.userId, me);

		let isLiked = undefined;
		if (meId) {
			isLiked = hint?.likedFlashIds
				? hint.likedFlashIds.includes(flash.id)
				: await this.flashLikesRepository.exists({ where: { flashId: flash.id, userId: meId } });
		}

		return {
			id: flash.id,
			createdAt: this.idService.parse(flash.id).date.toISOString(),
			updatedAt: flash.updatedAt.toISOString(),
			userId: flash.userId,
			user: user,
			title: flash.title,
			summary: flash.summary,
			script: flash.script,
			visibility: flash.visibility,
			likedCount: flash.likedCount,
			isLiked: isLiked,
		};
	}

	@bindThis
	public async packMany(
		flashes: MiFlash[],
		me?: { id: MiUser['id'] } | null | undefined,
	) {
		const _users = flashes.map(({ user, userId }) => user ?? userId);
		const _userMap = await this.userEntityService.packMany(_users, me)
			.then(users => new Map(users.map(u => [u.id, u])));
		const _likedFlashIds = me
			? await this.flashLikesRepository.createQueryBuilder('flashLike')
				.select('flashLike.flashId')
				.where('flashLike.userId = :userId', { userId: me.id })
				.getRawMany<{ flashLike_flashId: string }>()
				.then(likes => [...new Set(likes.map(like => like.flashLike_flashId))])
			: [];
		return Promise.all(
			flashes.map(flash => this.pack(flash, me, {
				packedUser: _userMap.get(flash.userId),
				likedFlashIds: _likedFlashIds,
			})),
		);
	}
}

