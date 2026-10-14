/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { NotesRepository, DriveFilesRepository } from '@/models/_.js';
import { QueryService } from '@/core/QueryService.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '@/core/RoleService.js';
import { packedNoteSchema } from '@/models/schema/note.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['drive', 'notes'],

	requireCredential: true,

	kind: 'read:drive',

	description: 'Find the notes to which the given file is attached.',

	res: v.array(packedNoteSchema),

	errors: {
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: 'c118ece3-2e4b-4296-99d1-51756e32d232',
		},
	},
} as const;

export const paramDef = v.object({
	...mi.paginationEntries({ max: 100, default: 10 }),
	...mi.paginationDateEntries(),
	fileId: mi.misskeyId(),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private noteEntityService: NoteEntityService,
		private queryService: QueryService,
		private roleService: RoleService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Fetch file
			const file = await this.driveFilesRepository.findOneBy({
				id: ps.fileId,
				userId: await this.roleService.isModerator(me) ? undefined : me.id,
			});

			if (file == null) {
				throw new ApiError(meta.errors.noSuchFile);
			}

			const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate);
			query.andWhere(':file <@ note.fileIds', { file: [file.id] });

			const notes = await query.limit(ps.limit).getMany();

			return await this.noteEntityService.packMany(notes, me, {
				detail: true,
			});
		});
	}
}
