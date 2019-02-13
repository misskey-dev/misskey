import $ from 'cafy';
import ID, { transform } from '../../../../misc/cafy-id';
import Report, { packMany } from '../../../../models/abuse-user-report';
import define from '../../define';

export const meta = {
	requireCredential: true,
	requireModerator: true,

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		},

		sinceId: {
			validator: $.optional.type(ID),
			transform: transform,
		},

		untilId: {
			validator: $.optional.type(ID),
			transform: transform,
		},
	}
};

export default define(meta, (ps) => new Promise(async (res, rej) => {
	if (ps.sinceId && ps.untilId) {
		return rej('cannot set sinceId and untilId');
	}

	const sort = {
		_id: -1
	};
	const query = {} as any;
	if (ps.sinceId) {
		sort._id = 1;
		query._id = {
			$gt: ps.sinceId
		};
	} else if (ps.untilId) {
		query._id = {
			$lt: ps.untilId
		};
	}

	const reports = await Report
		.find(query, {
			limit: ps.limit,
			sort: sort
		});

	res(await packMany(reports));
}));
