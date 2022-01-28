import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { ModerationLogs } from '@/models/index';
import { makePaginationQuery } from '../../common/make-pagination-query';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10,
		},

		sinceId: {
			validator: $.optional.type(ID),
		},

		untilId: {
			validator: $.optional.type(ID),
		},
	},

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			properties: {
				id: {
					type: 'string',
					optional: false, nullable: false,
					format: 'id',
				},
				createdAt: {
					type: 'string',
					optional: false, nullable: false,
					format: 'date-time',
				},
				type: {
					type: 'string',
					optional: false, nullable: false,
				},
				info: {
					type: 'object',
					optional: false, nullable: false,
				},
				userId: {
					type: 'string',
					optional: false, nullable: false,
					format: 'id',
				},
				user: {
					type: 'object',
					optional: false, nullable: false,
					ref: 'UserDetailed',
				},
			},
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps) => {
	const query = makePaginationQuery(ModerationLogs.createQueryBuilder('report'), ps.sinceId, ps.untilId);

	const reports = await query.take(ps.limit!).getMany();

	return await ModerationLogs.packMany(reports);
});
