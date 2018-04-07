import * as mongo from 'mongodb';
import deepcopy = require('deepcopy');
import db from '../db/mongodb';
import { IUser, pack as packUser } from './user';
import { pack as packNote } from './note';

const Notification = db.get<INotification>('notifications');
export default Notification;

export interface INotification {
	_id: mongo.ObjectID;
	createdAt: Date;

	/**
	 * 通知の受信者
	 */
	notifiee?: IUser;

	/**
	 * 通知の受信者
	 */
	notifieeId: mongo.ObjectID;

	/**
	 * イニシエータ(initiator)、Origin。通知を行う原因となったユーザー
	 */
	notifier?: IUser;

	/**
	 * イニシエータ(initiator)、Origin。通知を行う原因となったユーザー
	 */
	notifierId: mongo.ObjectID;

	/**
	 * 通知の種類。
	 * follow - フォローされた
	 * mention - 投稿で自分が言及された
	 * reply - (自分または自分がWatchしている)投稿が返信された
	 * renote - (自分または自分がWatchしている)投稿がRenoteされた
	 * quote - (自分または自分がWatchしている)投稿が引用Renoteされた
	 * reaction - (自分または自分がWatchしている)投稿にリアクションされた
	 * poll_vote - (自分または自分がWatchしている)投稿の投票に投票された
	 */
	type: 'follow' | 'mention' | 'reply' | 'renote' | 'quote' | 'reaction' | 'poll_vote';

	/**
	 * 通知が読まれたかどうか
	 */
	isRead: Boolean;
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

	// Rename notifierId to userId
	_notification.userId = _notification.notifierId;
	delete _notification.notifierId;

	const me = _notification.notifieeId;
	delete _notification.notifieeId;

	// Populate notifier
	_notification.user = await packUser(_notification.userId, me);

	switch (_notification.type) {
		case 'follow':
			// nope
			break;
		case 'mention':
		case 'reply':
		case 'renote':
		case 'quote':
		case 'reaction':
		case 'poll_vote':
			// Populate note
			_notification.note = await packNote(_notification.noteId, me);
			break;
		default:
			console.error(`Unknown type: ${_notification.type}`);
			break;
	}

	resolve(_notification);
});
