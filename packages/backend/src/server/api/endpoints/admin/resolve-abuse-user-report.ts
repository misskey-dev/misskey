/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { UsersRepository, AbuseUserReportsRepository } from '@/models/_.js';
import { InstanceActorService } from '@/core/InstanceActorService.js';
import { QueueService } from '@/core/QueueService.js';
import { ApRendererService } from '@/core/activitypub/ApRendererService.js';
import { DI } from '@/di-symbols.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		reportId: { type: 'string', format: 'misskey:id' },
		forward: { type: 'boolean', default: false },
	},
	required: ['reportId'],
} as const;

// TODO: ロジックをサービスに切り出す

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.abuseUserReportsRepository)
		private abuseUserReportsRepository: AbuseUserReportsRepository,

		private queueService: QueueService,
		private instanceActorService: InstanceActorService,
		private apRendererService: ApRendererService,
		private moderationLogService: ModerationLogService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const report = await this.abuseUserReportsRepository.findOneBy({ id: ps.reportId });

			if (report == null) {
				throw new Error('report not found');
			}

			if (ps.forward && report.targetUserHost != null) {
				const actor = await this.instanceActorService.getInstanceActor();
				const targetUser = await this.usersRepository.findOneByOrFail({ id: report.targetUserId });

				this.queueService.deliver(actor, this.apRendererService.addContext(this.apRendererService.renderFlag(actor, targetUser.uri!, report.comment)), targetUser.inbox, false);
			}

			await this.abuseUserReportsRepository.update(report.id, {
				resolved: true,
				assigneeId: me.id,
				forwarded: ps.forward && report.targetUserHost != null,
			});

			this.moderationLogService.log(me, 'resolveAbuseReport', {
				reportId: report.id,
				report: report,
				forwarded: ps.forward && report.targetUserHost != null,
			});
		});
	}
}
