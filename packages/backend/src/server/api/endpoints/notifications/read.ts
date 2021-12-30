import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import { publishMainStream } from '@/services/stream';
import define from '../../define';
import { Notifications } from '@/models/index';
import { readNotification } from '../../common/read-notification';
import { ApiError } from '../../error';

export const meta = {
	tags: ['notifications', 'account'],

	requireCredential: true as const,

	kind: 'write:notifications',

	params: {
		notificationId: {
			validator: $.type(ID),
		},
	},

	errors: {
		noSuchNotification: {
			message: 'No such notification.',
			code: 'NO_SUCH_NOTIFICATION',
			id: 'efa929d5-05b5-47d1-beec-e6a4dbed011e',
		},
	},
};

export default define(meta, async (ps, user) => {
	const notification = await Notifications.findOne({
		notifieeId: user.id,
		id: ps.notificationId,
	});

	if (notification == null) {
		throw new ApiError(meta.errors.noSuchNotification);
	}

	readNotification(user.id, [notification.id]);
});
