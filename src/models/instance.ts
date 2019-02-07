import * as mongo from 'mongodb';
import db from '../db/mongodb';

const Instance = db.get<IInstance>('instances');
Instance.createIndex('host', { unique: true });
export default Instance;

export interface IInstance {
	_id: mongo.ObjectID;

	/**
	 * ホスト
	 */
	host: string;

	/**
	 * このインスタンスを捕捉した日時
	 */
	caughtAt: Date;

	/**
	 * このインスタンスのシステム (MastodonとかMisskeyとかPleromaとか)
	 */
	system: string;

	/**
	 * このインスタンスのユーザー数
	 */
	usersCount: number;

	/**
	 * このインスタンスから受け取った投稿数
	 */
	notesCount: number;

	/**
	 * このインスタンスのユーザーからフォローされている、自インスタンスのユーザーの数
	 */
	followingCount: number;

	/**
	 * このインスタンスのユーザーをフォローしている、自インスタンスのユーザーの数
	 */
	followersCount: number;

	/**
	 * 最近の通信日時
	 */
	latestRequestSentAt?: Date;

	/**
	 * 最近の通信のHTTPステータス
	 */
	latestStatus?: number;
}
