/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { MiNoteDraft, NoteDraftsRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { QueryService } from '@/core/QueryService.js';
import { NoteDraftEntityService } from '@/core/entities/NoteDraftEntityService.js';
import { packedNoteDraftSchema } from '@/models/schema/note-draft.js';

export const meta = {
	tags: ['notes', 'drafts'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'read:account',

	res: v.array(packedNoteDraftSchema),

	errors: {
	},
} as const;

export const paramDef = v.object({
	...mi.paginationEntries({ max: 100, default: 30 }),
	...mi.paginationDateEntries(),
	scheduled: v.optional(v.nullable(v.boolean())),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.noteDraftsRepository)
		private noteDraftsRepository: NoteDraftsRepository,

		private queryService: QueryService,
		private noteDraftEntityService: NoteDraftEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.queryService.makePaginationQuery<MiNoteDraft>(this.noteDraftsRepository.createQueryBuilder('drafts'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('drafts.userId = :meId', { meId: me.id });

			if (ps.scheduled === true) {
				query.andWhere('drafts.isActuallyScheduled = true');
			} else if (ps.scheduled === false) {
				query.andWhere('drafts.isActuallyScheduled = false');
			}

			const drafts = await query
				.limit(ps.limit)
				.getMany();

			return await this.noteDraftEntityService.packMany(drafts, me);
		});
	}
}
