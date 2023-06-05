import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { ClipNotesRepository, ClipsRepository } from '@/models/index.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../error.js';
import { GetterService } from '@/server/api/GetterService.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'clips/remove-note'> {
	name = 'clips/remove-note' as const;
	constructor(
		@Inject(DI.clipsRepository)
		private clipsRepository: ClipsRepository,

		@Inject(DI.clipNotesRepository)
		private clipNotesRepository: ClipNotesRepository,

		private getterService: GetterService,
	) {
		super(async (ps, me) => {
			const clip = await this.clipsRepository.findOneBy({
				id: ps.clipId,
				userId: me.id,
			});

			if (clip == null) {
				throw new ApiError(this.meta.errors.noSuchClip);
			}

			const note = await this.getterService.getNote(ps.noteId).catch(err => {
				if (err.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(this.meta.errors.noSuchNote);
				throw err;
			});

			await this.clipNotesRepository.delete({
				noteId: note.id,
				clipId: clip.id,
			});
		});
	}
}
