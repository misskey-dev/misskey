'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import Notification from '../../../models/notification';
import serialize from '../../../serializers/notification';
import event from '../../../event';

/**
 * Mark as read a notification
 *
 * @param {Object} params
 * @param {Object} user
 * @return {Promise<object>}
 */
module.exports = (params, user) =>
	new Promise(async (res, rej) => {
		const notificationId = params.notification;

		if (notificationId === undefined || notificationId === null) {
			return rej('notification is required');
		}

		// Get notification
		const notification = await Notification
			.findOne({
				_id: new mongo.ObjectID(notificationId),
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
