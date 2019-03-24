import * as deepcopy from 'deepcopy';
import { Entity, Index, JoinColumn, ManyToOne, Column, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user';

@Entity()
export class Notification {
	@PrimaryGeneratedColumn()
	public id: number;

	@Index()
	@Column('date', {
		comment: 'The created date of the Notification.'
	})
	public createdAt: Date;

	/**
	 * 通知の受信者
	 */
	@Index()
	@Column('integer', {
		comment: 'The ID of recipient user of the Notification.'
	})
	public notifieeId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public notifiee: User | null;

	/**
	 * 通知の送信者(initiator)
	 */
	@Column('integer', {
		comment: 'The ID of sender user of the Notification.'
	})
	public notifierId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public notifier: User | null;

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
	@Column('varchar', {
		length: 32,
		comment: 'The type of the Notification.'
	})
	public type: string;

	/**
	 * 通知が読まれたかどうか
	 */
	@Column('boolean', {
		default: false,
		comment: 'Whether the Notification is read.'
	})
	public isRead: boolean;

	/**
	 * 通知の追加データ
	 * 通知の種類ごとに異なり、例えばリアクションの通知ならリアクションの種類が入るなど
	 */
	@Column('jsonb', {
		default: {},
		comment: 'The additional information of the Notification.'
	})
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
		case 'pollVote':
			// Populate note
			_notification.note = await packNote(_notification.noteId, me);
			break;
		default:
			dbLogger.error(`Unknown type: ${_notification.type}`);
			break;
	}

	resolve(_notification);
});
