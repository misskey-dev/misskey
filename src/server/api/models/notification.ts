import * as mongo from 'mongodb';
import deepcopy = require('deepcopy');
import db from '../../../db/mongodb';
import { IUser, pack as packUser } from './user';
import { pack as packPost } from './post';

const Notification = db.get<INotification>('notifications');
export default Notification;

export interface INotification {
	_id: mongo.ObjectID;
	created_at: Date;

	/**
	 * 通知の受信者
	 */
	notifiee?: IUser;

	/**
	 * 通知の受信者
	 */
	notifiee_id: mongo.ObjectID;

	/**
	 * イニシエータ(initiator)、Origin。通知を行う原因となったユーザー
	 */
	notifier?: IUser;

	/**
	 * イニシエータ(initiator)、Origin。通知を行う原因となったユーザー
	 */
	notifier_id: mongo.ObjectID;

	/**
	 * 通知の種類。
	 * follow - フォローされた
	 * mention - 投稿で自分が言及された
	 * reply - (自分または自分がWatchしている)投稿が返信された
	 * repost - (自分または自分がWatchしている)投稿がRepostされた
	 * quote - (自分または自分がWatchしている)投稿が引用Repostされた
	 * reaction - (自分または自分がWatchしている)投稿にリアクションされた
	 * poll_vote - (自分または自分がWatchしている)投稿の投票に投票された
	 */
	type: 'follow' | 'mention' | 'reply' | 'repost' | 'quote' | 'reaction' | 'poll_vote';

	/**
	 * 通知が読まれたかどうか
	 */
	is_read: Boolean;
}

/**
 * Pack a notification for API response
 *
 * @param {any} notification
 * @return {Promise<any>}
 */
export const pack = (notification: any) => new Promise<any>(async (resolve, reject) => {
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
	_notification.user = await packUser(_notification.user_id, me);

	switch (_notification.type) {
		case 'follow':
			// nope
			break;
		case 'mention':
		case 'reply':
		case 'repost':
		case 'quote':
		case 'reaction':
		case 'poll_vote':
			// Populate post
			_notification.post = await packPost(_notification.post_id, me);
			break;
		default:
			console.error(`Unknown type: ${_notification.type}`);
			break;
	}

	resolve(_notification);
});
