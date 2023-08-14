/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type { AnnouncementsRepository } from '@/models/index.js';
import { Announcement, AnnouncementRead } from '@/models/index.js';

export const meta = {
	tags: ['meta'],

	requireCredential: false,

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			properties: {
				id: {
					type: 'string',
					optional: false, nullable: false,
					format: 'id',
					example: 'xxxxxxxxxx',
				},
				createdAt: {
					type: 'string',
					optional: false, nullable: false,
					format: 'date-time',
				},
				updatedAt: {
					type: 'string',
					optional: false, nullable: true,
					format: 'date-time',
				},
				text: {
					type: 'string',
					optional: false, nullable: false,
				},
				title: {
					type: 'string',
					optional: false, nullable: false,
				},
				imageUrl: {
					type: 'string',
					optional: false, nullable: true,
				},
				isRead: {
					type: 'boolean',
					optional: true, nullable: false,
				},
				isPrivate: {
					type: 'boolean',
					optional: false, nullable: true,
				},
				closeDuration: {
					type: 'number',
					optional: false, nullable: false,
				},
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		offset: { type: 'integer', default: 0 },
		withUnreads: { type: 'boolean', default: false },
		privateOnly: { type: 'boolean', default: false },
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.announcementsRepository)
		private announcementsRepository: AnnouncementsRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.announcementsRepository.createQueryBuilder('announcement');
			if (me) {
				query.leftJoinAndSelect(AnnouncementRead, 'reads', 'reads."announcementId" = announcement.id AND reads."userId" = :userId', { userId: me.id });
				query.select([
					'announcement.*',
					'CASE WHEN reads.id IS NULL THEN FALSE ELSE TRUE END as "isRead"',
				]);
				if (ps.privateOnly) {
					query.where('announcement."userId" = :userId', { userId: me.id });
				} else {
					query.where('announcement."userId" IS NULL');
					query.orWhere('announcement."userId" = :userId', { userId: me.id });
				}
			} else {
				query.select([
					'announcement.*',
					'FALSE as "isRead"',
				]);
				query.where('announcement."userId" IS NULL');
			}

			query.orderBy({
				'"isRead"': 'ASC',
				'announcement."displayOrder"': 'DESC',
				'announcement."createdAt"': 'DESC',
			});

			const announcements = await query
				.offset(ps.offset)
				.limit(ps.limit)
				.getRawMany<Announcement & { isRead: boolean }>();

			return (ps.withUnreads ? announcements.filter(i => !i.isRead) : announcements).map((a) => ({
				...a,
				createdAt: a.createdAt.toISOString(),
				updatedAt: a.updatedAt?.toISOString() ?? null,
				isPrivate: !!a.userId,
			}));
		});
	}
}
