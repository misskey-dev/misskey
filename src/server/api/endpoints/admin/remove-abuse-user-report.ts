import $ from 'cafy';
import { ID } from '~/misc/cafy-id';
import define from '~/server/api/define';
import { AbuseUserReports } from '~/models';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	params: {
		reportId: {
			validator: $.type(ID),
		},
	}
};

export default define(meta, async (ps) => {
	const report = await AbuseUserReports.findOne(ps.reportId);

	if (report == null) {
		throw new Error('report not found');
	}

	await AbuseUserReports.delete(report.id);
});
