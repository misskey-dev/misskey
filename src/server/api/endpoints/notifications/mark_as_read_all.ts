/**
 * Module dependencies
 */
import Notification from '../../../../models/notification';
import event from '../../../../publishers/stream';

/**
 * Mark as read all notifications
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
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

	// 全ての通知を読みましたよというイベントを発行
	event(user._id, 'read_all_notifications');
});
