import { publishMainStream } from '../../../../services/stream';
import define from '../../define';
import { Notifications } from '../../../../models';

export const meta = {
	desc: {
		'ja-JP': '全ての通知を既読にします。',
		'en-US': 'Mark all notifications as read.'
	},

	tags: ['notifications', 'account'],

	requireCredential: true as const,

	kind: 'write:notifications'
};

export default define(meta, async (ps, user) => {
	// Update documents
	await Notifications.update({
		notifieeId: user.id,
		isRead: false,
	}, {
		isRead: true
	});

	// 全ての通知を読みましたよというイベントを発行
	publishMainStream(user.id, 'readAllNotifications');
});
