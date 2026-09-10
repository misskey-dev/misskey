/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { AbuseUserReportsRepository } from '@/models/_.js';
import { QueryService } from '@/core/QueryService.js';
import { DI } from '@/di-symbols.js';
import { AbuseUserReportEntityService } from '@/core/entities/AbuseUserReportEntityService.js';
import { packedUserDetailedNotMeSchema } from '@/models/schema/user.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:abuse-user-reports',

	res: v.array(v.object({
		id: mi.example(mi.idString(), 'xxxxxxxxxx'),
		createdAt: mi.dateTimeString(),
		comment: v.string(),
		resolved: mi.example(v.boolean(), false),
		reporterId: mi.idString(),
		targetUserId: mi.idString(),
		assigneeId: v.nullable(mi.idString()),
		reporter: packedUserDetailedNotMeSchema,
		targetUser: packedUserDetailedNotMeSchema,
		assignee: v.nullable(packedUserDetailedNotMeSchema),
		forwarded: v.boolean(),
		resolvedAs: mi.nullableEnum(['accept', 'reject', null]),
		moderationNote: v.string(),
	})),
} as const;

export const paramDef = v.object({
	...mi.paginationEntries({ max: 100, default: 10 }),
	...mi.paginationDateEntries(),
	state: v.optional(v.nullable(v.string()), null),
	reporterOrigin: v.optional(v.picklist(['combined', 'local', 'remote']), 'combined'),
	targetUserOrigin: v.optional(v.picklist(['combined', 'local', 'remote']), 'combined'),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.abuseUserReportsRepository)
		private abuseUserReportsRepository: AbuseUserReportsRepository,

		private abuseUserReportEntityService: AbuseUserReportEntityService,
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.abuseUserReportsRepository.createQueryBuilder('report'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate);

			switch (ps.state) {
				case 'resolved': query.andWhere('report.resolved = TRUE'); break;
				case 'unresolved': query.andWhere('report.resolved = FALSE'); break;
			}

			switch (ps.reporterOrigin) {
				case 'local': query.andWhere('report.reporterHost IS NULL'); break;
				case 'remote': query.andWhere('report.reporterHost IS NOT NULL'); break;
			}

			switch (ps.targetUserOrigin) {
				case 'local': query.andWhere('report.targetUserHost IS NULL'); break;
				case 'remote': query.andWhere('report.targetUserHost IS NOT NULL'); break;
			}

			const reports = await query.limit(ps.limit).getMany();

			return await this.abuseUserReportEntityService.packMany(reports);
		});
	}
}
