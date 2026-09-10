/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Brackets } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import type { NotesRepository } from '@/models/_.js';
import { safeForSql } from '@/misc/safe-for-sql.js';
import { normalizeForSearch } from '@/misc/normalize-for-search.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { DI } from '@/di-symbols.js';
import { packedNoteSchema } from '@/models/schema/note.js';

export const meta = {
	tags: ['notes', 'hashtags'],

	res: v.array(packedNoteSchema),
} as const;

// legacy の `allOf: [{ anyOf: [...] }, { reply, renote, ... }]` の共通パート
const filterEntries = {
	reply: v.optional(v.nullable(v.boolean()), null),
	renote: v.optional(v.nullable(v.boolean()), null),
	withFiles: v.optional(v.pipe(v.boolean(), v.description('Only show notes that have attached files.')), false),
	poll: v.optional(v.nullable(v.boolean()), null),
	sinceId: v.optional(mi.misskeyId()),
	untilId: v.optional(mi.misskeyId()),
	sinceDate: v.optional(mi.integer()),
	untilDate: v.optional(mi.integer()),
	limit: mi.limit({ max: 100, def: 10 }),
};

// NOTE: cookbook R9 に従い allOf に混在した anyOf を各分岐へ共通パートを分配した v.union に変換している
export const paramDef = v.union([
	v.object({
		tag: v.pipe(v.string(), mi.minCodePoints(1)),
		...filterEntries,
	}),
	v.object({
		query: v.pipe(
			v.array(v.pipe(
				v.array(v.pipe(v.string(), mi.minCodePoints(1))),
				v.minLength(1),
			)),
			v.minLength(1),
			v.description('The outer arrays are chained with OR, the inner arrays are chained with AND.'),
		),
		...filterEntries,
	}),
]);

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
				.innerJoinAndSelect('note.user', 'user')
				.leftJoinAndSelect('note.reply', 'reply')
				.leftJoinAndSelect('note.renote', 'renote')
				.leftJoinAndSelect('reply.user', 'replyUser')
				.leftJoinAndSelect('renote.user', 'renoteUser');

			this.queryService.generateVisibilityQuery(query, me);
			this.queryService.generateBaseNoteFilteringQuery(query, me);

			try {
				if ('tag' in ps) {
					if (!safeForSql(normalizeForSearch(ps.tag))) throw new Error('Injection');
					query.andWhere(':tag <@ note.tags', { tag: [normalizeForSearch(ps.tag)] });
				} else {
					query.andWhere(new Brackets(qb => {
						for (const tags of ps.query) {
							qb.orWhere(new Brackets(qb => {
								for (const tag of tags) {
									if (!safeForSql(normalizeForSearch(tag))) throw new Error('Injection');
									qb.andWhere(':tag <@ note.tags', { tag: [normalizeForSearch(tag)] });
								}
							}));
						}
					}));
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

			if (ps.renote != null) {
				if (ps.renote) {
					query.andWhere('note.renoteId IS NOT NULL');
				} else {
					query.andWhere('note.renoteId IS NULL');
				}
			}

			if (ps.withFiles) {
				query.andWhere('note.fileIds != \'{}\'');
			}

			if (ps.poll != null) {
				if (ps.poll) {
					query.andWhere('note.hasPoll = TRUE');
				} else {
					query.andWhere('note.hasPoll = FALSE');
				}
			}

			// Search notes
			const notes = await query.limit(ps.limit).getMany();

			return await this.noteEntityService.packMany(notes, me);
		});
	}
}
