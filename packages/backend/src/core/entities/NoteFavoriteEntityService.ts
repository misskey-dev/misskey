/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { NoteFavoritesRepository } from '@/models/index.js';
import type { } from '@/models/entities/Blocking.js';
import type { User } from '@/models/entities/User.js';
import type { NoteFavorite } from '@/models/entities/NoteFavorite.js';
import { bindThis } from '@/decorators.js';
import { NoteEntityService } from './NoteEntityService.js';

@Injectable()
export class NoteFavoriteEntityService {
	constructor(
		@Inject(DI.noteFavoritesRepository)
		private noteFavoritesRepository: NoteFavoritesRepository,

		private noteEntityService: NoteEntityService,
	) {
	}

	@bindThis
	public async pack(
		src: NoteFavorite['id'] | NoteFavorite,
		me?: { id: User['id'] } | null | undefined,
	) {
		const favorite = typeof src === 'object' ? src : await this.noteFavoritesRepository.findOneByOrFail({ id: src });

		return {
			id: favorite.id,
			createdAt: favorite.createdAt.toISOString(),
			noteId: favorite.noteId,
			note: await this.noteEntityService.pack(favorite.note ?? favorite.noteId, me),
		};
	}

	@bindThis
	public packMany(
		favorites: any[],
		me: { id: User['id'] },
	) {
		return Promise.all(favorites.map(x => this.pack(x, me)));
	}
}
