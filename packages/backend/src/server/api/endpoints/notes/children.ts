/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Brackets } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import type { NotesRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { DI } from '@/di-symbols.js';
import { packedNoteSchema } from '@/models/schema/note.js';

export const meta = {
	tags: ['notes'],

	requireCredential: false,

	res: v.array(packedNoteSchema),
} as const;

export const paramDef = v.object({
	noteId: mi.misskeyId(),
	...mi.paginationEntries({ max: 100, default: 10 }),
	...mi.paginationDateEntries(),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private noteEntityService: NoteEntityService,
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere(new Brackets(qb => {
					qb
						.where('note.replyId = :noteId', { noteId: ps.noteId })
						.orWhere(new Brackets(qb => {
							qb
								.where('note.renoteId = :noteId', { noteId: ps.noteId })
								.andWhere(new Brackets(qb => {
									qb
										.where('note.text IS NOT NULL')
										.orWhere('note.fileIds != \'{}\'')
										.orWhere('note.hasPoll = TRUE');
								}));
						}));
				}))
				.innerJoinAndSelect('note.user', 'user')
				.leftJoinAndSelect('note.reply', 'reply')
				.leftJoinAndSelect('note.renote', 'renote')
				.leftJoinAndSelect('reply.user', 'replyUser')
				.leftJoinAndSelect('renote.user', 'renoteUser');

			this.queryService.generateVisibilityQuery(query, me);
			this.queryService.generateBaseNoteFilteringQuery(query, me);

			const notes = await query.limit(ps.limit).getMany();

			return await this.noteEntityService.packMany(notes, me);
		});
	}
}
