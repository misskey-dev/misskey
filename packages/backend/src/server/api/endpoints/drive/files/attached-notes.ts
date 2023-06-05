import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { NotesRepository, DriveFilesRepository } from '@/models/index.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../../error.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'drive/files/attached-notes'> {
	name = 'drive/files/attached-notes' as const;
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private noteEntityService: NoteEntityService,
	) {
		super(async (ps, me) => {
			// Fetch file
			const file = await this.driveFilesRepository.findOneBy({
				id: ps.fileId,
				userId: me.id,
			});

			if (file == null) {
				throw new ApiError(this.meta.errors.noSuchFile);
			}

			const notes = await this.notesRepository.createQueryBuilder('note')
				.where(':file = ANY(note.fileIds)', { file: file.id })
				.getMany();

			return await this.noteEntityService.packMany(notes, me, {
				detail: true,
			});
		});
	}
}
