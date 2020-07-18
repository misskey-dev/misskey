import $ from 'cafy';
import define from '../../../define';
import { Announcements } from '../../../../../models';
import { genId } from '../../../../../misc/gen-id';

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
