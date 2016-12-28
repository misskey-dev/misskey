'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import Notification from '../models/notification';
import serializeUser from './user';
import serializePost from './post';
const deepcopy = require('deepcopy');

/**
 * Serialize a notification
 *
 * @param {Object} notification
 * @return {Promise<Object>}
 */
export default (notification: any) => new Promise<Object>(async (resolve, reject) => {
	let _notification: any;

	// Populate the notification if 'notification' is ID
	if (mongo.ObjectID.prototype.isPrototypeOf(notification)) {
		_notification = await Notification.findOne({
			_id: notification
		});
	} else if (typeof notification === 'string') {
		_notification = await Notification.findOne({
			_id: new mongo.ObjectID(notification)
		});
	} else {
		_notification = deepcopy(notification);
	}

	// Rename _id to id
	_notification.id = _notification._id;
	delete _notification._id;

	// Rename notifier_id to user_id
	_notification.user_id = _notification.notifier_id;
	delete _notification.notifier_id;

	const me = _notification.notifiee_id;
	delete _notification.notifiee_id;

	// Populate notifier
	_notification.user = await serializeUser(_notification.user_id, me);

	switch (_notification.type) {
		case 'follow':
			// nope
			break;
		case 'mention':
		case 'reply':
		case 'repost':
		case 'quote':
		case 'like':
			// Populate post
			_notification.post = await serializePost(_notification.post_id, me);
			break;
		default:
			console.error(`Unknown type: ${_notification.type}`);
			break;
	}

	resolve(_notification);
});
