import define from '../../define.js';
import { readNotification } from '../../common/read-notification.js';

export const meta = {
	desc: {
		'ja-JP': '通知を既読にします。',
		'en-US': 'Mark a notification as read.'
	},

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
	oneOf: [
		{
			type: 'object',
			properties: {
				notificationId: { type: 'string', format: 'misskey:id' },
			},
			required: ['notificationId'],
		},
		{
			type: 'object',
			properties: {
				notificationIds: {
					type: 'array',
					items: { type: 'string', format: 'misskey:id' },
					maxItems: 100,
				},
			},
			required: ['notificationIds'],
		},
	],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	if ('notificationId' in ps) return readNotification(user.id, [ps.notificationId]);
	return readNotification(user.id, ps.notificationIds);
});
