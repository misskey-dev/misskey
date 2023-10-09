/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Brackets } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { NotesRepository } from '@/models/_.js';
import { safeForSql } from '@/misc/safe-for-sql.js';
import { normalizeForSearch } from '@/misc/normalize-for-search.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['notes', 'drive'],

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Note',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		reply: { type: 'boolean', nullable: true, default: null },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },

		fileId: { type: 'string', format: 'misskey:id' },
	},
	required: ['fileId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private noteEntityService: NoteEntityService,
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId)
				.innerJoinAndSelect('note.user', 'user')
				.leftJoinAndSelect('note.reply', 'reply')
				.leftJoinAndSelect('note.renote', 'renote')
				.leftJoinAndSelect('reply.user', 'replyUser')
				.leftJoinAndSelect('renote.user', 'renoteUser');

			this.queryService.generateVisibilityQuery(query, me);
			if (me) this.queryService.generateMutedUserQuery(query, me);
			if (me) this.queryService.generateBlockedUserQuery(query, me);

			try {
				if (ps.fileId) {
					if (!safeForSql(normalizeForSearch(ps.fileId))) throw new Error('Injection');
					query.andWhere(`'{"${normalizeForSearch(ps.fileId)}"}' <@ note.fileIds`);
				}
			} catch (e) {
				if (e === 'Injection') return [];
				throw e;
			}

			if (ps.reply != null) {
				if (ps.reply) {
					query.andWhere('note.replyId IS NOT NULL');
				} else {
					query.andWhere('note.replyId IS NULL');
				}
			}

			// Search notes
			const notes = await query.limit(ps.limit).getMany();

			return await this.noteEntityService.packMany(notes, me);
		});
	}
}
