import * as mongo from 'mongodb';
import db from '../../db/mongodb';
import { IUser } from './user';

export default db.get('notifications') as any; // fuck type definition

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
