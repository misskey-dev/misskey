import * as Sequelize from 'sequelize';
import { Table, Column, Model, AllowNull, Comment, Default, ForeignKey } from 'sequelize-typescript';
import * as deepcopy from 'deepcopy';
import { IUser, pack as packUser } from './user';
import { pack as packNote } from './note';
import { dbLogger } from '../db/logger';

@Table({
	indexes: [{
		fields: ['notifieeId']
	}]
})
export class Notification extends Model<Notification> {
	@AllowNull(false)
	@Column(Sequelize.DATE)
	public createdAt: Date;

	/**
	 * 通知の受信者
	 */
	@Comment('The ID of recipient user of the Notification.')
	@AllowNull(false)
	@ForeignKey(() => User)
	@Column(Sequelize.INTEGER)
	public notifieeId: number;

	/**
	 * 通知の送信者(initiator)
	 */
	@Comment('The ID of sender user of the Notification.')
	@AllowNull(false)
	@ForeignKey(() => User)
	@Column(Sequelize.INTEGER)
	public notifierId: number;

	/**
	 * 通知の種類。
	 * follow - フォローされた
	 * mention - 投稿で自分が言及された
	 * reply - (自分または自分がWatchしている)投稿が返信された
	 * renote - (自分または自分がWatchしている)投稿がRenoteされた
	 * quote - (自分または自分がWatchしている)投稿が引用Renoteされた
	 * reaction - (自分または自分がWatchしている)投稿にリアクションされた
	 * pollVote - (自分または自分がWatchしている)投稿の投票に投票された
	 */
	@Comment('The type of the Notification.')
	@AllowNull(false)
	@Column(Sequelize.STRING)
	public type: string;

	/**
	 * 通知が読まれたかどうか
	 */
	@Comment('Whether the Notification is read.')
	@AllowNull(false)
	@Default(false)
	@Column(Sequelize.BOOLEAN)
	public isRead: boolean;

	/**
	 * 通知の追加データ
	 * 通知の種類ごとに異なり、例えばリアクションの通知ならリアクションの種類が入るなど
	 */
	@Comment('The additional information of the Notification.')
	@AllowNull(false)
	@Default({})
	@Column(Sequelize.JSONB)
	public data: Record<string, any>;
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
			id: notification
		});
	} else if (typeof notification === 'string') {
		_notification = await Notification.findOne({
			id: new mongo.ObjectID(notification)
		});
	} else {
		_notification = deepcopy(notification);
	}

	// Rename _id to id
	_notification.id = _notification.id;
	delete _notification.id;

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
