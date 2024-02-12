/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { NoteFavoritesRepository } from '@/models/_.js';
import type { MiUser } from '@/models/User.js';
import type { MiNoteFavorite } from '@/models/NoteFavorite.js';
import { bindThis } from '@/decorators.js';
import { Packed } from '@/misc/json-schema.js';
import { IdService } from '@/core/IdService.js';
import { NoteEntityService } from './NoteEntityService.js';

@Injectable()
export class NoteFavoriteEntityService {
	constructor(
		@Inject(DI.noteFavoritesRepository)
		private noteFavoritesRepository: NoteFavoritesRepository,

		private noteEntityService: NoteEntityService,
		private idService: IdService,
	) {
	}

	@bindThis
	public async pack(
		src: MiNoteFavorite['id'] | MiNoteFavorite,
		me: { id: MiUser['id'] } | null | undefined,
	) : Promise<Packed<'NoteFavorite'>> {
		const favorite = typeof src === 'object' ? src : await this.noteFavoritesRepository.findOneByOrFail({ id: src });

		return {
			id: favorite.id,
			createdAt: this.idService.parse(favorite.id).date.toISOString(),
			noteId: favorite.noteId,
			note: await this.noteEntityService.pack(favorite.note ?? favorite.noteId, me),
		};
	}

	@bindThis
	public async packMany(
		favorites: (MiNoteFavorite['id'] | MiNoteFavorite)[],
		me: { id: MiUser['id'] },
	) : Promise<Packed<'NoteFavorite'>[]> {
		return (await Promise.allSettled(favorites.map(x => this.pack(x, me))))
			.filter(result => result.status === 'fulfilled')
			.map(result => (result as PromiseFulfilledResult<Packed<'NoteFavorite'>>).value);
	}
}
