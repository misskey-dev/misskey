import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { IdService } from '@/core/IdService.js';
import { DI } from '@/di-symbols.js';
import type { ClipNotesRepository, ClipsRepository } from '@/models/index.js';
import { GetterService } from '@/server/api/GetterService.js';
import { RoleService } from '@/core/RoleService.js';
import { ApiError } from '../../error.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'clips/add-note'> {
	name = 'clips/add-note' as const;
	constructor(
		@Inject(DI.clipsRepository)
		private clipsRepository: ClipsRepository,

		@Inject(DI.clipNotesRepository)
		private clipNotesRepository: ClipNotesRepository,

		private idService: IdService,
		private roleService: RoleService,
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

			const note = await this.getterService.getNote(ps.noteId).catch(e => {
				if (e.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(this.meta.errors.noSuchNote);
				throw e;
			});

			const exist = await this.clipNotesRepository.findOneBy({
				noteId: note.id,
				clipId: clip.id,
			});

			if (exist != null) {
				throw new ApiError(this.meta.errors.alreadyClipped);
			}

			const currentCount = await this.clipNotesRepository.countBy({
				clipId: clip.id,
			});
			if (currentCount > (await this.roleService.getUserPolicies(me.id)).noteEachClipsLimit) {
				throw new ApiError(this.meta.errors.tooManyClipNotes);
			}

			await this.clipNotesRepository.insert({
				id: this.idService.genId(),
				noteId: note.id,
				clipId: clip.id,
			});

			await this.clipsRepository.update(clip.id, {
				lastClippedAt: new Date(),
			});
		});
	}
}
