import { Inject, Injectable } from '@nestjs/common';
import ms from 'ms';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { IdService } from '@/core/IdService.js';
import { DI } from '@/di-symbols.js';
import type { ClipNotesRepository, ClipsRepository } from '@/models/index.js';
import { GetterService } from '@/server/api/GetterService.js';
import { RoleService } from '@/core/RoleService.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['account', 'notes', 'clips'],

	requireCredential: true,

	kind: 'write:account',

	limit: {
		duration: ms('1hour'),
		max: 20,
	},

	errors: {
		noSuchClip: {
			message: 'No such clip.',
			code: 'NO_SUCH_CLIP',
			id: 'd6e76cc0-a1b5-4c7c-a287-73fa9c716dcf',
		},

		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: 'fc8c0b49-c7a3-4664-a0a6-b418d386bb8b',
		},

		alreadyClipped: {
			message: 'The note has already been clipped.',
			code: 'ALREADY_CLIPPED',
			id: '734806c4-542c-463a-9311-15c512803965',
		},

		tooManyClipNotes: {
			message: 'You cannot add notes to the clip any more.',
			code: 'TOO_MANY_CLIP_NOTES',
			id: 'f0dba960-ff73-4615-8df4-d6ac5d9dc118',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		clipId: { type: 'string', format: 'misskey:id' },
		noteId: { type: 'string', format: 'misskey:id' },
	},
	required: ['clipId', 'noteId'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.clipsRepository)
		private clipsRepository: ClipsRepository,

		@Inject(DI.clipNotesRepository)
		private clipNotesRepository: ClipNotesRepository,

		private idService: IdService,
		private roleService: RoleService,
		private getterService: GetterService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const clip = await this.clipsRepository.findOneBy({
				id: ps.clipId,
				userId: me.id,
			});

			if (clip == null) {
				throw new ApiError(meta.errors.noSuchClip);
			}

			const note = await this.getterService.getNote(ps.noteId).catch(e => {
				if (e.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
				throw e;
			});

			const exist = await this.clipNotesRepository.findOneBy({
				noteId: note.id,
				clipId: clip.id,
			});

			if (exist != null) {
				throw new ApiError(meta.errors.alreadyClipped);
			}

			const currentCount = await this.clipNotesRepository.countBy({
				clipId: clip.id,
			});
			if (currentCount > (await this.roleService.getUserPolicies(me.id)).noteEachClipsLimit) {
				throw new ApiError(meta.errors.tooManyClipNotes);
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
