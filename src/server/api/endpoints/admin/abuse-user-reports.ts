import $ from 'cafy';
import { ID } from '../../../../misc/cafy-id';
import define from '../../define';
import { AbuseUserReports } from '../../../../models';
import { generatePaginationQuery } from '../../common/generate-pagination-query';

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
		},

		untilId: {
			validator: $.optional.type(ID),
		},
	}
};

export default define(meta, async (ps) => {
	const query = generatePaginationQuery(AbuseUserReports.createQueryBuilder('report'), ps.sinceId, ps.untilId);

	const reports = await query.take(ps.limit).getMany();

	return await AbuseUserReports.packMany(reports);
});
