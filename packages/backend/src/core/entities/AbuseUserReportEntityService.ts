/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { AbuseUserReportsRepository } from '@/models/_.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { MiAbuseUserReport } from '@/models/AbuseUserReport.js';
import { bindThis } from '@/decorators.js';
import { IdService } from '@/core/IdService.js';
import type { Packed } from '@/misc/json-schema.js';
import { UserEntityService } from './UserEntityService.js';

@Injectable()
export class AbuseUserReportEntityService {
	constructor(
		@Inject(DI.abuseUserReportsRepository)
		private abuseUserReportsRepository: AbuseUserReportsRepository,

		private userEntityService: UserEntityService,
		private idService: IdService,
	) {
	}

	@bindThis
	public async pack(
		src: MiAbuseUserReport['id'] | MiAbuseUserReport,
		hint?: {
			packedReporter?: Packed<'UserDetailedNotMe'>,
			packedTargetUser?: Packed<'UserDetailedNotMe'>,
			packedAssignee?: Packed<'UserDetailedNotMe'>,
		},
	) {
		const report = typeof src === 'object' ? src : await this.abuseUserReportsRepository.findOneByOrFail({ id: src });

		return await awaitAll({
			id: report.id,
			createdAt: this.idService.parse(report.id).date.toISOString(),
			comment: report.comment,
			resolved: report.resolved,
			reporterId: report.reporterId,
			targetUserId: report.targetUserId,
			assigneeId: report.assigneeId,
			reporter: hint?.packedReporter ?? this.userEntityService.pack(report.reporter ?? report.reporterId, null, {
				schema: 'UserDetailedNotMe',
			}),
			targetUser: hint?.packedTargetUser ?? this.userEntityService.pack(report.targetUser ?? report.targetUserId, null, {
				schema: 'UserDetailedNotMe',
			}),
			assignee: report.assigneeId ? hint?.packedAssignee ?? this.userEntityService.pack(report.assignee ?? report.assigneeId, null, {
				schema: 'UserDetailedNotMe',
			}) : null,
			forwarded: report.forwarded,
			resolvedAs: report.resolvedAs,
			moderationNote: report.moderationNote,
		});
	}

	@bindThis
	public async packMany(
		reports: MiAbuseUserReport[],
	) {
		const _reporters = reports.map(({ reporter, reporterId }) => reporter ?? reporterId);
		const _targetUsers = reports.map(({ targetUser, targetUserId }) => targetUser ?? targetUserId);
		const _assignees = reports.map(({ assignee, assigneeId }) => assignee ?? assigneeId).filter(x => x != null);
		const _userMap = await this.userEntityService.packMany(
			[..._reporters, ..._targetUsers, ..._assignees],
			null,
			{ schema: 'UserDetailedNotMe' },
		).then(users => new Map(users.map(u => [u.id, u])));
		return Promise.all(
			reports.map(report => {
				const packedReporter = _userMap.get(report.reporterId);
				const packedTargetUser = _userMap.get(report.targetUserId);
				const packedAssignee = report.assigneeId != null ? _userMap.get(report.assigneeId) : undefined;
				return this.pack(report, { packedReporter, packedTargetUser, packedAssignee });
			}),
		);
	}
}
