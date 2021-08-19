import $ from 'cafy';
import { ID } from '@/misc/cafy-id.js';
import define from '../../define.js';
import { ApiError } from '../../error.js';
import { genId } from '@/misc/gen-id.js';
import { AnnouncementReads, Announcements, Users } from '@/models/index.js';
import { publishMainStream } from '@/services/stream.js';

export const meta = {
	tags: ['account'],

	requireCredential: true as const,

	kind: 'write:account',

	params: {
		announcementId: {
			validator: $.type(ID),
		},
	},

	errors: {
		noSuchAnnouncement: {
			message: 'No such announcement.',
			code: 'NO_SUCH_ANNOUNCEMENT',
			id: '184663db-df88-4bc2-8b52-fb85f0681939'
		},
	}
};

export default define(meta, async (ps, user) => {
	// Check if announcement exists
	const announcement = await Announcements.findOne(ps.announcementId);

	if (announcement == null) {
		throw new ApiError(meta.errors.noSuchAnnouncement);
	}

	// Check if already read
	const read = await AnnouncementReads.findOne({
		announcementId: ps.announcementId,
		userId: user.id
	});

	if (read != null) {
		return;
	}

	// Create read
	await AnnouncementReads.insert({
		id: genId(),
		createdAt: new Date(),
		announcementId: ps.announcementId,
		userId: user.id,
	});

	if (!await Users.getHasUnreadAnnouncement(user.id)) {
		publishMainStream(user.id, 'readAllAnnouncements');
	}
});
