import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { Users } from '@/models/index.js';
import { AbuseUserReports } from '@/models/index.js';
import { renderActivity } from '@/services/remote/activitypub/renderer/index.js';
import { renderFlag } from '@/services/remote/activitypub/renderer/flag.js';
import type { InstanceActorService } from '@/services/InstanceActorService.js';
import type { QueueService } from '@/queue/queue.service';

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

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject('usersRepository')
		private usersRepository: typeof Users,

		private queueService: QueueService,

		private instanceActorService: InstanceActorService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const report = await AbuseUserReports.findOneBy({ id: ps.reportId });

			if (report == null) {
				throw new Error('report not found');
			}

			if (ps.forward && report.targetUserHost != null) {
				const actor = await this.instanceActorService.getInstanceActor();
				const targetUser = await this.usersRepository.findOneByOrFail({ id: report.targetUserId });

				this.queueService.deliver(actor, renderActivity(renderFlag(actor, [targetUser.uri!], report.comment)), targetUser.inbox);
			}

			await AbuseUserReports.update(report.id, {
				resolved: true,
				assigneeId: me.id,
				forwarded: ps.forward && report.targetUserHost != null,
			});
		});
	}
}
