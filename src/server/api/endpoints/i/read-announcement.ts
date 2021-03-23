import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { ApiError } from '../../error';
import { genId } from '@/misc/gen-id';
import { AnnouncementReads, Announcements, Users } from '../../../../models';
import { publishMainStream } from '../../../../services/stream';

export const meta = {
	desc: {
		'ja-JP': '指定したアナウンスを既読にします。',
		'en-US': 'Marks the specified announcement as read.'
	},

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
