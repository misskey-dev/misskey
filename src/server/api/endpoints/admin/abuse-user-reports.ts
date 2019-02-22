import $ from 'cafy';
import ID, { transform } from '../../../../misc/cafy-id';
import Report, { packMany } from '../../../../models/abuse-user-report';
import define from '../../define';

export const meta = {
	tags: ['admin'],

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

export default define(meta, async (ps) => {
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

	return await packMany(reports);
});
