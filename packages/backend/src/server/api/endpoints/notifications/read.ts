import { publishMainStream } from '@/services/stream.js';
import define from '../../define.js';
import { Notifications } from '@/models/index.js';
import { readNotification } from '../../common/read-notification.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['notifications', 'account'],

	requireCredential: true,

	kind: 'write:notifications',

	errors: {
		noSuchNotification: {
			message: 'No such notification.',
			code: 'NO_SUCH_NOTIFICATION',
			id: 'efa929d5-05b5-47d1-beec-e6a4dbed011e',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		notificationId: { type: 'string', format: 'misskey:id' },
	},
	required: ['notificationId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const notification = await Notifications.findOne({
		notifieeId: user.id,
		id: ps.notificationId,
	});

	if (notification == null) {
		throw new ApiError(meta.errors.noSuchNotification);
	}

	readNotification(user.id, [notification.id]);
});
