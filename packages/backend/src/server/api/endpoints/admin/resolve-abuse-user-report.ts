import define from '../../define';
import { AbuseUserReports, Users } from '@/models/index';
import { getInstanceActor } from '@/services/instance-actor';
import { deliver } from '@/queue/index';
import { renderActivity } from '@/remote/activitypub/renderer/index';
import { renderFlag } from '@/remote/activitypub/renderer/flag';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
} as const;

const paramDef = {
	type: 'object',
	properties: {
		reportId: { type: 'string', format: 'misskey:id' },
		forward: { type: 'boolean', default: false },
	},
	required: ['reportId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	const report = await AbuseUserReports.findOne(ps.reportId);

	if (report == null) {
		throw new Error('report not found');
	}

	if (ps.forward && report.targetUserHost != null) {
		const actor = await getInstanceActor();
		const targetUser = await Users.findOneOrFail(report.targetUserId);

		deliver(actor, renderActivity(renderFlag(actor, [targetUser.uri!], report.comment)), targetUser.inbox);
	}

	await AbuseUserReports.update(report.id, {
		resolved: true,
		assigneeId: me.id,
		forwarded: ps.forward && report.targetUserHost != null,
	});
});
