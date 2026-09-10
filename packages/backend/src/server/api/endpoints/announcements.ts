/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Brackets } from 'typeorm';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import { AnnouncementEntityService } from '@/core/entities/AnnouncementEntityService.js';
import { DI } from '@/di-symbols.js';
import type { AnnouncementsRepository } from '@/models/_.js';
import { packedAnnouncementSchema } from '@/models/schema/announcement.js';

export const meta = {
	tags: ['meta'],

	requireCredential: false,

	res: v.array(packedAnnouncementSchema),
} as const;

export const paramDef = v.object({
	...mi.paginationEntries({ max: 100, default: 10 }),
	...mi.paginationDateEntries(),
	isActive: v.optional(v.boolean(), true),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.announcementsRepository)
		private announcementsRepository: AnnouncementsRepository,

		private queryService: QueryService,
		private announcementEntityService: AnnouncementEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.announcementsRepository.createQueryBuilder('announcement'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('announcement.isActive = :isActive', { isActive: ps.isActive })
				.andWhere(new Brackets(qb => {
					if (me) qb.orWhere('announcement.userId = :meId', { meId: me.id });
					qb.orWhere('announcement.userId IS NULL');
				}));

			const announcements = await query.limit(ps.limit).getMany();

			return this.announcementEntityService.packMany(announcements, me);
		});
	}
}
