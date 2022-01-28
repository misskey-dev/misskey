import $ from 'cafy';
import define from '../../../define';
import { Announcements } from '@/models/index';
import { genId } from '@/misc/gen-id';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	params: {
		title: {
			validator: $.str.min(1),
		},
		text: {
			validator: $.str.min(1),
		},
		imageUrl: {
			validator: $.nullable.str.min(1),
		},
	},

	res: {
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
			title: {
				type: 'string',
				optional: false, nullable: false,
			},
			text: {
				type: 'string',
				optional: false, nullable: false,
			},
			imageUrl: {
				type: 'string',
				optional: false, nullable: true,
			},
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps) => {
	const announcement = await Announcements.insert({
		id: genId(),
		createdAt: new Date(),
		updatedAt: null,
		title: ps.title,
		text: ps.text,
		imageUrl: ps.imageUrl,
	}).then(x => Announcements.findOneOrFail(x.identifiers[0]));

	return announcement;
});
