import { publishMainStream } from '@/services/stream';
import define from '../../define';
import { Notifications } from '@/models/index';

export const meta = {
	tags: ['notifications', 'account'],

	requireCredential: true,

	kind: 'write:notifications',
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, user) => {
	// Update documents
	await Notifications.update({
		notifieeId: user.id,
		isRead: false,
	}, {
		isRead: true,
	});

	// 全ての通知を読みましたよというイベントを発行
	publishMainStream(user.id, 'readAllNotifications');
});
