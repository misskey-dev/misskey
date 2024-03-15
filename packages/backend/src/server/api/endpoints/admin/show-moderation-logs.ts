/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { ModerationLogsRepository } from '@/models/_.js';
import { QueryService } from '@/core/QueryService.js';
import { DI } from '@/di-symbols.js';
import { ModerationLogEntityService } from '@/core/entities/ModerationLogEntityService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireAdmin: true,
	kind: 'read:admin:show-moderation-log',

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
				},
				createdAt: {
					type: 'string',
					optional: false, nullable: false,
					format: 'date-time',
				},
				type: {
					type: 'string',
					optional: false, nullable: false,
				},
				info: {
					type: 'object',
					optional: false, nullable: false,
				},
				userId: {
					type: 'string',
					optional: false, nullable: false,
					format: 'id',
				},
				user: {
					type: 'object',
					optional: false, nullable: false,
					ref: 'UserDetailedNotMe',
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
		type: { type: 'string', nullable: true },
		userId: { type: 'string', format: 'misskey:id', nullable: true },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.moderationLogsRepository)
		private moderationLogsRepository: ModerationLogsRepository,

		private moderationLogEntityService: ModerationLogEntityService,
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.moderationLogsRepository.createQueryBuilder('report'), ps.sinceId, ps.untilId);

			if (ps.type != null) {
				query.andWhere('report.type = :type', { type: ps.type });
			}

			if (ps.userId != null) {
				query.andWhere('report.userId = :userId', { userId: ps.userId });
			}

			const reports = await query.limit(ps.limit).getMany();

			return await this.moderationLogEntityService.packMany(reports);
		});
	}
}
