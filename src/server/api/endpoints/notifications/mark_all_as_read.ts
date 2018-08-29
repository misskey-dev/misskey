import Notification from '../../../../models/notification';
import { publishUserStream } from '../../../../stream';
import User, { ILocalUser } from '../../../../models/user';

export const meta = {
	desc: {
		'ja-JP': '全ての通知を既読にします。',
		'en-US': 'Mark all notifications as read.'
	},

	requireCredential: true,

	kind: 'notification-write'
};

/**
 * Mark all notifications as read
 */
export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	// Update documents
	await Notification.update({
		notifieeId: user._id,
		isRead: false
	}, {
			$set: {
				isRead: true
			}
		}, {
			multi: true
		});

	// Response
	res();

	// Update flag
	User.update({ _id: user._id }, {
		$set: {
			hasUnreadNotification: false
		}
	});

	// 全ての通知を読みましたよというイベントを発行
	publishUserStream(user._id, 'read_all_notifications');
});
