import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { AbuseUserReports } from '@/models/index';

export const meta = {
	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,

	params: {
		reportId: {
			validator: $.type(ID),
		},
	}
};

export default define(meta, async (ps, me) => {
	const report = await AbuseUserReports.findOne(ps.reportId);

	if (report == null) {
		throw new Error('report not found');
	}

	await AbuseUserReports.update(report.id, {
		resolved: true,
		assigneeId: me.id,
	});
});
