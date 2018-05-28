import Notification from '../../../../models/notification';
import event from '../../../../publishers/stream';
import User from '../../../../models/user';

/**
 * Mark as read all notifications
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
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
	event(user._id, 'read_all_notifications');
});
