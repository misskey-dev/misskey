import $ from 'cafy';
import define from '../../../define';
import { ID } from '../../../../../misc/cafy-id';
import { Announcements } from '../../../../../models';
import { ApiError } from '../../../error';

export const meta = {
	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,

	params: {
		id: {
			validator: $.type(ID)
		}
	},

	errors: {
		noSuchAnnouncement: {
			message: 'No such announcement.',
			code: 'NO_SUCH_ANNOUNCEMENT',
			id: 'ecad8040-a276-4e85-bda9-015a708d291e'
		}
	}
};

export default define(meta, async (ps, me) => {
	const announcement = await Announcements.findOne(ps.id);

	if (announcement == null) throw new ApiError(meta.errors.noSuchAnnouncement);

	await Announcements.delete(announcement.id);
});
