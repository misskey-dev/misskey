'use strict';

/**
 * Module dependencies
 */
import it from '../../it';
import Notification from '../../models/notification';
import serialize from '../../serializers/notification';
import event from '../../event';

/**
 * Mark as read a notification
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) =>
	new Promise(async (res, rej) => {
		const [notificationId, notificationIdErr] = it(params.notification_id).expect.id().required().qed();
		if (notificationIdErr) return rej('invalid notification_id param');

		// Get notification
		const notification = await Notification
			.findOne({
				_id: notificationId,
				i: user._id
			});

		if (notification === null) {
			return rej('notification-not-found');
		}

		// Update
		notification.is_read = true;
		Notification.update({ _id: notification._id }, {
			$set: {
				is_read: true
			}
		});

		// Response
		res();

		// Serialize
		const notificationObj = await serialize(notification);

		// Publish read_notification event
		event(user._id, 'read_notification', notificationObj);
	});
