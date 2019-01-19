import $ from 'cafy';
import ID, { transform } from '../../../../misc/cafy-id';
import define from '../../define';
import AbuseUserReport from '../../../../models/abuse-user-report';
import { error } from '../../../../prelude/promise';

export const meta = {
	requireCredential: true,
	requireModerator: true,

	params: {
		reportId: {
			validator: $.type(ID),
			transform: transform
		},
	}
};

export default define(meta, (ps) => AbuseUserReport.findOne({ _id: ps.reportId })
	.then(x =>
		!x ? error('report not found') :
		AbuseUserReport.remove({ _id: x._id }))
	.then(() => {}));
