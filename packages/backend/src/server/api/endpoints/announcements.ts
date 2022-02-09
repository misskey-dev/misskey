import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../define';
import { Announcements, AnnouncementReads } from '@/models/index';
import { makePaginationQuery } from '../common/make-pagination-query';

export const meta = {
	tags: ['meta'],

	requireCredential: false,

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10,
		},

		withUnreads: {
			validator: $.optional.boolean,
			default: false,
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
					example: 'xxxxxxxxxx',
				},
				createdAt: {
					type: 'string',
					optional: false, nullable: false,
					format: 'date-time',
				},
				updatedAt: {
					type: 'string',
					optional: false, nullable: true,
					format: 'date-time',
				},
				text: {
					type: 'string',
					optional: false, nullable: false,
				},
				title: {
					type: 'string',
					optional: false, nullable: false,
				},
				imageUrl: {
					type: 'string',
					optional: false, nullable: true,
				},
				isRead: {
					type: 'boolean',
					optional: true, nullable: false,
				},
			},
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, user) => {
	const query = makePaginationQuery(Announcements.createQueryBuilder('announcement'), ps.sinceId, ps.untilId);

	const announcements = await query.take(ps.limit!).getMany();

	if (user) {
		const reads = (await AnnouncementReads.find({
			userId: user.id,
		})).map(x => x.announcementId);

		for (const announcement of announcements) {
			(announcement as any).isRead = reads.includes(announcement.id);
		}
	}

	return (ps.withUnreads ? announcements.filter((a: any) => !a.isRead) : announcements).map((a) => ({
		...a,
		createdAt: a.createdAt.toISOString(),
		updatedAt: a.updatedAt?.toISOString() ?? null,
	}));
});
