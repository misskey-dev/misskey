/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import type { AnnouncementsRepository, AnnouncementReadsRepository } from '@/models/_.js';
import type { MiAnnouncement } from '@/models/Announcement.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import { DI } from '@/di-symbols.js';
import { IdService } from '@/core/IdService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:announcements',

	res: v.array(v.object({
		id: mi.example(mi.idString(), 'xxxxxxxxxx'),
		createdAt: mi.dateTimeString(),
		updatedAt: v.nullable(mi.dateTimeString()),
		text: v.string(),
		title: v.string(),
		icon: v.picklist(['info', 'warning', 'error', 'success']),
		display: v.picklist(['normal', 'banner', 'dialog']),
		isActive: v.boolean(),
		forExistingUsers: v.boolean(),
		silence: v.boolean(),
		needConfirmationToRead: v.boolean(),
		userId: v.nullable(v.string()),
		imageUrl: v.nullable(v.string()),
		reads: v.number(),
	})),
} as const;

export const paramDef = v.object({
	...mi.paginationEntries({ max: 100, default: 10 }),
	...mi.paginationDateEntries(),
	userId: v.nullish(mi.misskeyId()),
	status: v.optional(v.picklist(['all', 'active', 'archived']), 'active'),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.announcementsRepository)
		private announcementsRepository: AnnouncementsRepository,

		@Inject(DI.announcementReadsRepository)
		private announcementReadsRepository: AnnouncementReadsRepository,

		private queryService: QueryService,
		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.announcementsRepository.createQueryBuilder('announcement'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate);

			if (ps.status === 'archived') {
				query.andWhere('announcement.isActive = false');
			} else if (ps.status === 'active') {
				query.andWhere('announcement.isActive = true');
			}

			if (ps.userId) {
				query.andWhere('announcement.userId = :userId', { userId: ps.userId });
			} else {
				query.andWhere('announcement.userId IS NULL');
			}

			const announcements = await query.limit(ps.limit).getMany();

			const reads = new Map<MiAnnouncement, number>();

			for (const announcement of announcements) {
				reads.set(announcement, await this.announcementReadsRepository.countBy({
					announcementId: announcement.id,
				}));
			}

			return announcements.map(announcement => ({
				id: announcement.id,
				createdAt: this.idService.parse(announcement.id).date.toISOString(),
				updatedAt: announcement.updatedAt?.toISOString() ?? null,
				title: announcement.title,
				text: announcement.text,
				imageUrl: announcement.imageUrl,
				icon: announcement.icon,
				display: announcement.display,
				isActive: announcement.isActive,
				forExistingUsers: announcement.forExistingUsers,
				silence: announcement.silence,
				needConfirmationToRead: announcement.needConfirmationToRead,
				userId: announcement.userId,
				reads: reads.get(announcement)!,
			}));
		});
	}
}
