/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable, Inject } from '@nestjs/common';
import { MoreThan, IsNull } from 'typeorm';
import RE2 from 're2';
import { bindThis } from '@/decorators.js';
import type Logger from '@/logger.js';
import { RoleService } from '@/core/RoleService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { InstanceActorService } from '@/core/InstanceActorService.js';
import type { AbuseReportResolversRepository, AbuseUserReportsRepository, UsersRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { ApRendererService } from '@/core/activitypub/ApRendererService.js';
import { QueueService } from '@/core/QueueService.js';
import { WebhookService } from '@/core/WebhookService.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type { DbAbuseReportJobData } from '../types.js';
import type * as Bull from 'bullmq';

@Injectable()
export class ReportAbuseProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.abuseReportResolversRepository)
		private abuseReportResolversRepository: AbuseReportResolversRepository,

		@Inject(DI.abuseUserReportsRepository)
		private abuseUserReportsRepository: AbuseUserReportsRepository,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private queueLoggerService: QueueLoggerService,
		private globalEventService: GlobalEventService,
		private instanceActorService: InstanceActorService,
		private apRendererService: ApRendererService,
		private roleService: RoleService,
		private queueService: QueueService,
		private webhookService: WebhookService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('report-abuse');
	}

	@bindThis
	public async process(job: Bull.Job<DbAbuseReportJobData>): Promise<void> {
		this.logger.info('Running...');

		const resolvers = await this.abuseReportResolversRepository.find({
			where: [
				{ expirationDate: MoreThan(new Date()) },
				{ expirationDate: IsNull() },
			],
		});

		const targetUser = await this.usersRepository.findOneByOrFail({
			id: job.data.targetUserId,
		});

		const reporter = await this.usersRepository.findOneByOrFail({
			id: job.data.reporterId,
		});

		const actor = await this.instanceActorService.getInstanceActor();

		const targetUserAcct = targetUser.host ? `${targetUser.username.toLowerCase()}@${targetUser.host}` : targetUser.username.toLowerCase();
		const reporterAcct = reporter.host ? `${reporter.username.toLowerCase()}@${reporter.host}` : reporter.username.toLowerCase();

		for (const resolver of resolvers) {
			if (!(resolver.targetUserPattern || resolver.reporterPattern || resolver.reportContentPattern)) {
				continue;
			}
			const isTargetUserPatternMatched = resolver.targetUserPattern ? new RE2(resolver.targetUserPattern).test(targetUserAcct) : true;
			const isReporterPatternMatched = resolver.reporterPattern ? new RE2(resolver.reporterPattern).test(reporterAcct) : true;
			const isReportContentPatternMatched = resolver.reportContentPattern ? new RE2(resolver.reportContentPattern).test(job.data.comment) : true;

			if (isTargetUserPatternMatched && isReporterPatternMatched && isReportContentPatternMatched) {
				if (resolver.forward && job.data.targetUserHost !== null && job.data.reporterHost === null) {
					this.queueService.deliver(actor, this.apRendererService.addContext(this.apRendererService.renderFlag(actor, targetUser.uri!, job.data.comment)), targetUser.inbox, false);
				}

				await this.abuseUserReportsRepository.update(job.data.id, {
					resolved: true,
					assigneeId: actor.id,
					forwarded: resolver.forward && job.data.targetUserHost !== null && job.data.reporterHost === null,
				});

				const activeWebhooks = await this.webhookService.getActiveWebhooks();
				for (const webhook of activeWebhooks) {
					const webhookUser = await this.usersRepository.findOneByOrFail({
						id: webhook.userId,
					});
					const isAdmin = await this.roleService.isAdministrator(webhookUser);
					if (webhook.on.includes('reportAutoResolved') && isAdmin) {
						this.queueService.webhookDeliver(webhook, 'reportAutoResolved', {
							resolver: resolver,
							report: job.data,
						});
					}
				}

				return;
			}
		}

		// Publish event to moderators
		setImmediate(async () => {
			const moderators = await this.roleService.getModerators();

			for (const moderator of moderators) {
				this.globalEventService.publishAdminStream(moderator.id, 'newAbuseUserReport', {
					id: job.data.id,
					targetUserId: job.data.targetUserId,
					reporterId: job.data.reporterId,
					comment: job.data.comment,
				});
			}
		});
	}
}
