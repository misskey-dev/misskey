import $ from 'cafy';
import { StringID, NumericalID } from '../../../../misc/cafy-id';
import define from '../../define';
import { MoreThan, LessThan } from 'typeorm';
import { AbuseUserReports } from '../../../../models';

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
			validator: $.optional.type(NumericalID),
		},

		untilId: {
			validator: $.optional.type(NumericalID),
		},
	}
};

export default define(meta, async (ps) => {
	const sort = {
		id: -1
	};
	const query = {} as any;
	if (ps.sinceId) {
		sort.id = 1;
		query.id = MoreThan(ps.sinceId);
	} else if (ps.untilId) {
		query.id = LessThan(ps.untilId);
	}

	const reports = await AbuseUserReports.find({
		where: query,
		take: ps.limit,
		order: sort
	});

	return await packMany(reports);
});
