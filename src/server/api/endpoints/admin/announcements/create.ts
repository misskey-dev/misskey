import $ from 'cafy';
import define from '../../../define';
import { Announcements } from '../../../../../models';
import { genId } from '../../../../../misc/gen-id';

export const meta = {
	desc: {
		'ja-JP': 'アナウンスを作成します。',
		'en-US': 'Create a announcement.'
	},

	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,

	params: {
		title: {
			validator: $.str.min(1)
		},
		text: {
			validator: $.str.min(1)
		},
		imageUrl: {
			validator: $.nullable.str.min(1)
		}
	},

	res: {
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
			title: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
				description: 'Announcement title.'
			},
			text: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
				description: 'Announcement text.'
			},
			imageUrl: {
				type: 'string' as const,
				optional: false as const, nullable: true as const,
				description: 'Announcement image.'
			}
		}
	}
};

export default define(meta, async (ps) => {
	const announcement = await Announcements.save({
		id: genId(),
		createdAt: new Date(),
		updatedAt: null,
		title: ps.title,
		text: ps.text,
		imageUrl: ps.imageUrl,
	});

	return announcement;
});
