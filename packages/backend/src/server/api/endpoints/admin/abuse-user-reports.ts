import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { AbuseUserReports } from '@/models/index';
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

		forwarded: {
			validator: $.optional.bool,
			default: false,
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
					nullable: false, optional: false,
					format: 'id',
					example: 'xxxxxxxxxx',
				},
				createdAt: {
					type: 'string',
					nullable: false, optional: false,
					format: 'date-time',
				},
				comment: {
					type: 'string',
					nullable: false, optional: false,
				},
				resolved: {
					type: 'boolean',
					nullable: false, optional: false,
					example: false,
				},
				reporterId: {
					type: 'string',
					nullable: false, optional: false,
					format: 'id',
				},
				targetUserId: {
					type: 'string',
					nullable: false, optional: false,
					format: 'id',
				},
				assigneeId: {
					type: 'string',
					nullable: true, optional: false,
					format: 'id',
				},
				reporter: {
					type: 'object',
					nullable: false, optional: false,
					ref: 'User',
				},
				targetUser: {
					type: 'object',
					nullable: false, optional: false,
					ref: 'User',
				},
				assignee: {
					type: 'object',
					nullable: true, optional: true,
					ref: 'User',
				},
			},
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
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
