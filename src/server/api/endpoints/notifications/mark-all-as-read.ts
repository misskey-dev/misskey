import Notification from '../../../../models/entities/notification';
import { publishMainStream } from '../../../../services/stream';
import User from '../../../../models/entities/user';
import define from '../../define';

export const meta = {
	desc: {
		'ja-JP': '全ての通知を既読にします。',
		'en-US': 'Mark all notifications as read.'
	},

	tags: ['notifications', 'account'],

	requireCredential: true,

	kind: 'notification-write'
};

export default define(meta, async (ps, user) => {
	// Update documents
	await Notification.update({
		notifieeId: user.id,
		isRead: false
	}, {
		$set: {
			isRead: true
		}
	}, {
		multi: true
	});

	// Update flag
	User.update(user.id, {
		$set: {
			hasUnreadNotification: false
		}
	});

	// 全ての通知を読みましたよというイベントを発行
	publishMainStream(user.id, 'readAllNotifications');
});
