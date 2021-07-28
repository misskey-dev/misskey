import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { ModerationLogs } from '../../../../models';
import { makePaginationQuery } from '../../common/make-pagination-query';

export const meta = {
	tags: ['admin'],

	requireCredential: true as const,
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
	},

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			properties: {
				id: {
					type: 'string' as const,
					optional: false as const, nullable: false as const,
					format: 'id'
				},
				createdAt: {
					type: 'string' as const,
					optional: false as const, nullable: false as const,
					format: 'date-time'
				},
				type: {
					type: 'string' as const,
					optional: false as const, nullable: false as const
				},
				info: {
					type: 'object' as const,
					optional: false as const, nullable: false as const
				},
				userId: {
					type: 'string' as const,
					optional: false as const, nullable: false as const,
					format: 'id'
				},
				user: {
					type: 'object' as const,
					optional: false as const, nullable: false as const,
					ref: 'User'
				}
			}
		}
	}
};

export default define(meta, async (ps) => {
	const query = makePaginationQuery(ModerationLogs.createQueryBuilder('report'), ps.sinceId, ps.untilId);

	const reports = await query.take(ps.limit!).getMany();

	return await ModerationLogs.packMany(reports);
});
