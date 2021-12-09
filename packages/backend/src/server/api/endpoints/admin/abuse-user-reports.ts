import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { AbuseUserReports } from '@/models/index';
import { makePaginationQuery } from '../../common/make-pagination-query';

export const meta = {
	tags: ['admin'],

	requireCredential: true as const,
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

		state: {
			validator: $.optional.nullable.str,
			default: null,
		},

		reporterOrigin: {
			validator: $.optional.str.or([
				'combined',
				'local',
				'remote',
			]),
			default: 'combined',
		},

		targetUserOrigin: {
			validator: $.optional.str.or([
				'combined',
				'local',
				'remote',
			]),
			default: 'combined',
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
					nullable: false as const, optional: false as const,
					format: 'id',
					example: 'xxxxxxxxxx',
				},
				createdAt: {
					type: 'string' as const,
					nullable: false as const, optional: false as const,
					format: 'date-time',
				},
				comment: {
					type: 'string' as const,
					nullable: false as const, optional: false as const,
				},
				resolved: {
					type: 'boolean' as const,
					nullable: false as const, optional: false as const,
					example: false,
				},
				reporterId: {
					type: 'string' as const,
					nullable: false as const, optional: false as const,
					format: 'id',
				},
				targetUserId: {
					type: 'string' as const,
					nullable: false as const, optional: false as const,
					format: 'id',
				},
				assigneeId: {
					type: 'string' as const,
					nullable: true as const, optional: false as const,
					format: 'id',
				},
				reporter: {
					type: 'object' as const,
					nullable: false as const, optional: false as const,
					ref: 'User',
				},
				targetUser: {
					type: 'object' as const,
					nullable: false as const, optional: false as const,
					ref: 'User',
				},
				assignee: {
					type: 'object' as const,
					nullable: true as const, optional: true as const,
					ref: 'User',
				},
			},
		},
	},
};

export default define(meta, async (ps) => {
	const query = makePaginationQuery(AbuseUserReports.createQueryBuilder('report'), ps.sinceId, ps.untilId);

	switch (ps.state) {
		case 'resolved': query.andWhere('report.resolved = TRUE'); break;
		case 'unresolved': query.andWhere('report.resolved = FALSE'); break;
	}

	switch (ps.reporterOrigin) {
		case 'local': query.andWhere('report.reporterHost IS NULL'); break;
		case 'remote': query.andWhere('report.reporterHost IS NOT NULL'); break;
	}

	switch (ps.targetUserOrigin) {
		case 'local': query.andWhere('report.targetUserHost IS NULL'); break;
		case 'remote': query.andWhere('report.targetUserHost IS NOT NULL'); break;
	}

	const reports = await query.take(ps.limit!).getMany();

	return await AbuseUserReports.packMany(reports);
});
