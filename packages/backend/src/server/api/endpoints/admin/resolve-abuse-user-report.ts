import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { AbuseUserReports, Users } from '@/models/index.js';
import { getInstanceActor } from '@/services/instance-actor.js';
import { deliver } from '@/queue/index.js';
import { renderActivity } from '@/remote/activitypub/renderer/index.js';
import { renderFlag } from '@/remote/activitypub/renderer/flag.js';

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

		@Inject('notesRepository')
    private notesRepository: typeof Notes,
	) {
		super(meta, paramDef, async (ps, me) => {
			const report = await AbuseUserReports.findOneByOrFail({ id: ps.reportId });

			if (report == null) {
				throw new Error('report not found');
			}

			if (ps.forward && report.targetUserHost != null) {
				const actor = await getInstanceActor();
				const targetUser = await this.usersRepository.findOneByOrFail({ id: report.targetUserId });

				deliver(actor, renderActivity(renderFlag(actor, [targetUser.uri!], report.comment)), targetUser.inbox);
			}

			await AbuseUserReports.update(report.id, {
				resolved: true,
				assigneeId: me.id,
				forwarded: ps.forward && report.targetUserHost != null,
			});
		});
	}
}
