import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { ClipFavoritesRepository, ClipsRepository, User } from '@/models/index.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { Packed } from '@/misc/json-schema.js';
import type { } from '@/models/entities/Blocking.js';
import type { Clip } from '@/models/entities/Clip.js';
import { bindThis } from '@/decorators.js';
import { UserEntityService } from './UserEntityService.js';

@Injectable()
export class ClipEntityService {
	constructor(
		@Inject(DI.clipsRepository)
		private clipsRepository: ClipsRepository,

		@Inject(DI.clipFavoritesRepository)
		private clipFavoritesRepository: ClipFavoritesRepository,

		private userEntityService: UserEntityService,
	) {
	}

	@bindThis
	public async pack(
		src: Clip['id'] | Clip,
		me?: { id: User['id'] } | null | undefined,
	): Promise<Packed<'Clip'>> {
		const meId = me ? me.id : null;
		const clip = typeof src === 'object' ? src : await this.clipsRepository.findOneByOrFail({ id: src });

		return await awaitAll({
			id: clip.id,
			createdAt: clip.createdAt.toISOString(),
			lastClippedAt: clip.lastClippedAt ? clip.lastClippedAt.toISOString() : null,
			userId: clip.userId,
			user: this.userEntityService.pack(clip.user ?? clip.userId),
			name: clip.name,
			description: clip.description,
			isPublic: clip.isPublic,
			favoritedCount: await this.clipFavoritesRepository.countBy({ clipId: clip.id }),
			isFavorited: meId ? await this.clipFavoritesRepository.findOneBy({ clipId: clip.id, userId: meId }).then(x => x != null) : undefined,
		});
	}

	@bindThis
	public packMany(
		clips: Clip[],
		me?: { id: User['id'] } | null | undefined,
	) {
		return Promise.all(clips.map(x => this.pack(x, me)));
	}
}

