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
	 * ドライブ使用量
	 */
	driveUsage: number;

	/**
	 * ドライブのファイル数
	 */
	driveFiles: number;

	/**
	 * 直近のリクエスト送信日時
	 */
	latestRequestSentAt?: Date;

	/**
	 * 直近のリクエスト送信時のHTTPステータスコード
	 */
	latestStatus?: number;

	/**
	 * 直近のリクエスト受信日時
	 */
	latestRequestReceivedAt?: Date;

	/**
	 * このインスタンスと不通かどうか
	 */
	isNotResponding: boolean;

	/**
	 * このインスタンスと最後にやり取りした日時
	 */
	lastCommunicatedAt: Date;

	/**
	 * このインスタンスをブロックしているか
	 */
	isBlocked: boolean;

	/**
	 * このインスタンスが閉鎖済みとしてマークされているか
	 */
	isMarkedAsClosed: boolean;
}
