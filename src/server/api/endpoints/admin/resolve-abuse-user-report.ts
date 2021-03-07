import $ from 'cafy';
import { ID } from '../../../../misc/cafy-id';
import define from '../../define';
import { AbuseUserReports } from '../../../../models';

export const meta = {
	desc: {
		'ja-JP': '指定した通報を解決済みにします。',
		'en-US': 'Marks the specified report as resolved.'
	},

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
