import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../define';
import { Announcements, AnnouncementReads } from '../../../models';
import { makePaginationQuery } from '../common/make-pagination-query';

export const meta = {
	tags: ['meta'],

	requireCredential: false as const,

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		},

		withUnreads: {
			validator: $.optional.boolean,
			default: false
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
					format: 'id',
					example: 'xxxxxxxxxx',
				},
				createdAt: {
					type: 'string' as const,
					optional: false as const, nullable: false as const,
					format: 'date-time',
				},
				updatedAt: {
					type: 'string' as const,
					optional: false as const, nullable: true as const,
					format: 'date-time',
				},
				text: {
					type: 'string' as const,
					optional: false as const, nullable: false as const,
				},
				title: {
					type: 'string' as const,
					optional: false as const, nullable: false as const,
				},
				imageUrl: {
					type: 'string' as const,
					optional: false as const, nullable: true as const,
				},
				isRead: {
					type: 'boolean' as const,
					optional: false as const, nullable: false as const,
				}
			}
		}
	}
};

export default define(meta, async (ps, user) => {
	const query = makePaginationQuery(Announcements.createQueryBuilder('announcement'), ps.sinceId, ps.untilId);

	const announcements = await query.take(ps.limit!).getMany();

	if (user) {
		const reads = (await AnnouncementReads.find({
			userId: user.id
		})).map(x => x.announcementId);

		for (const announcement of announcements) {
			(announcement as any).isRead = reads.includes(announcement.id);
		}
	}

	return ps.withUnreads ? announcements.filter((a: any) => !a.isRead) : announcements;
});
