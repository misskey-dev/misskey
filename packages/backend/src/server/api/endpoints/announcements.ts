/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Brackets } from 'typeorm';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import { RoleService } from '@/core/RoleService.js';
import { AnnouncementEntityService } from '@/core/entities/AnnouncementEntityService.js';
import { DI } from '@/di-symbols.js';
import type { AnnouncementsRepository, AnnouncementRolesRepository } from '@/models/_.js';

export const meta = {
	tags: ['meta'],

	requireCredential: false,

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Announcement',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		isActive: { type: 'boolean', default: true },
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

		private queryService: QueryService,
		private roleService: RoleService,
		private announcementEntityService: AnnouncementEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const userRoles = me != null ? await this.roleService.getUserRoles(me.id) : [];

			const announcementRolesQuery = this.announcementRolesRepository.createQueryBuilder('ar')
				.select('ar.announcementId')
				.where('ar.roleId IN (:...roles)', { roles: userRoles.map(x => x.id) });

			const query = this.queryService.makePaginationQuery(this.announcementsRepository.createQueryBuilder('announcement'), ps.sinceId, ps.untilId)
				.andWhere('announcement.isActive = :isActive', { isActive: ps.isActive })
				.andWhere(new Brackets(qb => {
					if (me) qb.orWhere('announcement.userId = :meId', { meId: me.id });
					qb.orWhere('announcement.userId IS NULL');
				}))
				.andWhere(new Brackets(qb => {
					if (userRoles.length > 0) {
						qb.orWhere(new Brackets(qb2 => {
							qb2.andWhere('announcement.isRoleSpecified = true');
							qb2.andWhere(`announcement.id IN (${ announcementRolesQuery.getQuery() })`);
						}));
					}
					qb.orWhere('announcement.isRoleSpecified = false');
				}))
				.setParameters(announcementRolesQuery.getParameters());

			const announcements = await query.limit(ps.limit).getMany();

			return this.announcementEntityService.packMany(announcements, me);
		});
	}
}
