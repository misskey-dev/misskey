import $ from 'cafy';
import { StringID, NumericalID } from '../../../../misc/cafy-id';
import define from '../../define';
import AbuseUserReport from '../../../../models/entities/abuse-user-report';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	params: {
		reportId: {
			validator: $.type(StringID),
			transform: transform
		},
	}
};

export default define(meta, async (ps) => {
	const report = await AbuseUserReport.findOne({
		id: ps.reportId
	});

	if (report == null) {
		throw new Error('report not found');
	}

	await AbuseUserReport.remove({
		id: report.id
	});

	return;
});
