import $ from 'cafy';
import { ID } from '../../../../../misc/cafy-id';
import define from '../../../define';
import { Announcements, AnnouncementReads } from '../../../../../models';
import { makePaginationQuery } from '../../../common/make-pagination-query';

export const meta = {
	desc: {
		'ja-JP': 'アナウンスのリストを表示します。',
		'en-US': 'List announcements.'
	},

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
					format: 'id',
					description: 'The unique identifier for this Announcement.',
					example: 'xxxxxxxxxx',
				},
				createdAt: {
					type: 'string' as const,
					optional: false as const, nullable: false as const,
					format: 'date-time',
					description: 'The date that the Announcement was created.'
				},
				updatedAt: {
					type: 'string' as const,
					optional: false as const, nullable: true as const,
					format: 'date-time',
					description: 'The date that the Announcement was updated.'
				},
				text: {
					type: 'string' as const,
					optional: false as const, nullable: false as const,
					description: 'Announcement text.'
				},
				title: {
					type: 'string' as const,
					optional: false as const, nullable: false as const,
					description: 'Announcement title.'
				},
				imageUrl: {
					type: 'string' as const,
					optional: false as const, nullable: true as const,
					description: 'Announcement image.'
				},
				reads: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
					description: 'Number of people who read this announcement.'
				}
			}
		}
	}
};

export default define(meta, async (ps) => {
	const query = makePaginationQuery(Announcements.createQueryBuilder('announcement'), ps.sinceId, ps.untilId);

	const announcements = await query.take(ps.limit!).getMany();

	for (const announcement of announcements) {
		(announcement as any).reads = await AnnouncementReads.count({
			announcementId: announcement.id
		});
	}

	return announcements;
});
