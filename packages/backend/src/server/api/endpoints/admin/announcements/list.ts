/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { AnnouncementsRepository, AnnouncementRolesRepository, AnnouncementReadsRepository } from '@/models/_.js';
import type { MiRole } from '@/models/Role.js';
import type { MiAnnouncement } from '@/models/Announcement.js';
import type { MiAnnouncementRole } from '@/models/AnnouncementRole.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import { DI } from '@/di-symbols.js';
import { IdService } from '@/core/IdService.js';
import { RoleEntityService } from '@/core/entities/RoleEntityService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:announcements',

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
				isRoleSpecified: {
					type: 'boolean',
					optional: false, nullable: false,
				},
				roles: {
					type: 'array',
					optional: false, nullable: false,
					items: {
						type: 'object',
						properties: {
							id: {
								type: 'string',
								format: 'id',
							},
							name: {
								type: 'string',
							},
						},
					},
				},
				reads: {
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
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		userId: { type: 'string', format: 'misskey:id', nullable: true },
		status: { type: 'string', enum: ['all', 'active', 'archived'], default: 'active' },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.announcementsRepository)
		private announcementsRepository: AnnouncementsRepository,

		@Inject(DI.announcementRolesRepository)
		private announcementRolesRepository: AnnouncementRolesRepository,

		@Inject(DI.announcementReadsRepository)
		private announcementReadsRepository: AnnouncementReadsRepository,

		private queryService: QueryService,
		private idService: IdService,
		private roleEntityService: RoleEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.announcementsRepository.createQueryBuilder('announcement'), ps.sinceId, ps.untilId);

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
			const announcementRoleIds = await this.announcementRolesRepository
				.createQueryBuilder('announcement_role')
				.where('announcement_role.announcementId IN (:...announcementIds)', { announcementIds: announcements.map(announcement => announcement.id) })
				.select('announcement_role.announcementId')
				.addSelect('announcement_role.roleId')
				.getMany() as Pick<MiAnnouncementRole, 'announcementId' | 'roleId'>[];

			const announcementRoles = await Promise.all(announcementRoleIds.map(async ar => { const role = await this.roleEntityService.pack(ar.roleId); return { ...ar, role }; }));

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
				isRoleSpecified: announcement.isRoleSpecified,
				roles: announcementRoles.filter(announcementRole => announcementRole.announcementId === announcement.id).map(announcementRole => announcementRole.role).filter((role): role is MiRole => role !== null),
				reads: reads.get(announcement)!,
			}));
		});
	}
}
