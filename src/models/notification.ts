import * as mongo from 'mongodb';
import * as deepcopy from 'deepcopy';
import db from '../db/mongodb';
import isObjectId from '../misc/is-objectid';
import { IUser, pack as packUser } from './user';
import { pack as packNote } from './note';
import { dbLogger } from '../db/logger';

const Notification = db.get<INotification>('notifications');
Notification.createIndex('notifieeId');
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
	isRead: boolean;
}

export const packMany = (
	notifications: any[]
) => {
	return Promise.all(notifications.map(n => pack(n)));
};

/**
 * Pack a notification for API response
 */
export const pack = (notification: any) => new Promise<any>(async (resolve, reject) => {
	let _notification: any;

	// Populate the notification if 'notification' is ID
	if (isObjectId(notification)) {
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
		case 'receiveFollowRequest':
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

			// (データベースの不具合などで)投稿が見つからなかったら
			if (_notification.note == null) {
				dbLogger.warn(`[DAMAGED DB] (missing) pkg: notification -> note :: ${_notification.id} (note ${_notification.noteId})`);
				return resolve(null);
			}
			break;
		default:
			dbLogger.error(`Unknown type: ${_notification.type}`);
			break;
	}

	resolve(_notification);
});
