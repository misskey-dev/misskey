import $ from 'cafy';
import define from '../../../define';
import { ID } from '@/misc/cafy-id';
import { Announcements } from '@/models/index';
import { ApiError } from '../../../error';

export const meta = {
	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,

	params: {
		id: {
			validator: $.type(ID),
		},
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

	errors: {
		noSuchAnnouncement: {
			message: 'No such announcement.',
			code: 'NO_SUCH_ANNOUNCEMENT',
			id: 'd3aae5a7-6372-4cb4-b61c-f511ffc2d7cc',
		},
	},
};

export default define(meta, async (ps, me) => {
	const announcement = await Announcements.findOne(ps.id);

	if (announcement == null) throw new ApiError(meta.errors.noSuchAnnouncement);

	await Announcements.update(announcement.id, {
		updatedAt: new Date(),
		title: ps.title,
		text: ps.text,
		imageUrl: ps.imageUrl,
	});
});
