import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { ClipsRepository } from '@/models/index.js';
import { ClipEntityService } from '@/core/entities/ClipEntityService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../error.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'clips/show'> {
	name = 'clips/show' as const;
	constructor(
		@Inject(DI.clipsRepository)
		private clipsRepository: ClipsRepository,

		private clipEntityService: ClipEntityService,
	) {
		super(async (ps, me) => {
			// Fetch the clip
			const clip = await this.clipsRepository.findOneBy({
				id: ps.clipId,
			});

			if (clip == null) {
				throw new ApiError(this.meta.errors.noSuchClip);
			}

			if (!clip.isPublic && (me == null || (clip.userId !== me.id))) {
				throw new ApiError(this.meta.errors.noSuchClip);
			}

			return await this.clipEntityService.pack(clip, me);
		});
	}
}
