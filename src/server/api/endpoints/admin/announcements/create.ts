import $ from 'cafy';
import define from '../../../define';
import { Announcements } from '@/models/index';
import { genId } from '@/misc/gen-id';

export const meta = {
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
			title: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
			},
			text: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
			},
			imageUrl: {
				type: 'string' as const,
				optional: false as const, nullable: true as const,
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
