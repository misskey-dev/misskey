import $ from 'cafy';
import ID, { transform } from '../../../../misc/cafy-id';
import define from '../../define';
import AbuseUserReport from '../../../../models/abuse-user-report';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	params: {
		reportId: {
			validator: $.type(ID),
			transform: transform
		},
	}
};

export default define(meta, async (ps) => {
	const report = await AbuseUserReport.findOne({
		_id: ps.reportId
	});

	if (report == null) {
		throw new Error('report not found');
	}

	await AbuseUserReport.remove({
		_id: report._id
	});

	return;
});
