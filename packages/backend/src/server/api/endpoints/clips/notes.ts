import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { NotesRepository, ClipsRepository, ClipNotesRepository } from '@/models/index.js';
import { QueryService } from '@/core/QueryService.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../error.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'clips/notes'> {
	name = 'clips/notes' as const;
	constructor(
		@Inject(DI.clipsRepository)
		private clipsRepository: ClipsRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.clipNotesRepository)
		private clipNotesRepository: ClipNotesRepository,

		private noteEntityService: NoteEntityService,
		private queryService: QueryService,
	) {
		super(async (ps, me) => {
			const clip = await this.clipsRepository.findOneBy({
				id: ps.clipId,
			});

			if (clip == null) {
				throw new ApiError(this.meta.errors.noSuchClip);
			}

			if (!clip.isPublic && (me == null || (clip.userId !== me.id))) {
				throw new ApiError(this.meta.errors.noSuchClip);
			}

			const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId)
				.innerJoin(this.clipNotesRepository.metadata.targetName, 'clipNote', 'clipNote.noteId = note.id')
				.innerJoinAndSelect('note.user', 'user')
				.leftJoinAndSelect('note.reply', 'reply')
				.leftJoinAndSelect('note.renote', 'renote')
				.leftJoinAndSelect('reply.user', 'replyUser')
				.leftJoinAndSelect('renote.user', 'renoteUser')
				.andWhere('clipNote.clipId = :clipId', { clipId: clip.id });

			if (me) {
				this.queryService.generateVisibilityQuery(query, me);
				this.queryService.generateMutedUserQuery(query, me);
				this.queryService.generateBlockedUserQuery(query, me);
			}

			const notes = await query
				.take(ps.limit)
				.getMany();

			return await this.noteEntityService.packMany(notes, me);
		});
	}
}
