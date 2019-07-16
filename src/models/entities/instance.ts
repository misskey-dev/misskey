import { Entity, PrimaryColumn, Index, Column } from 'typeorm';
import { id } from '../id';

@Entity()
export class Instance {
	@PrimaryColumn(id())
	public id: string;

	/**
	 * このインスタンスを捕捉した日時
	 */
	@Index()
	@Column('timestamp with time zone', {
		comment: 'The caught date of the Instance.'
	})
	public caughtAt: Date;

	/**
	 * ホスト
	 */
	@Index({ unique: true })
	@Column('varchar', {
		length: 128,
		comment: 'The host of the Instance.'
	})
	public host: string;

	/**
	 * インスタンスのシステム (MastodonとかGroundpolisとかPleromaとか)
	 */
	@Column('varchar', {
		length: 64, nullable: true,
		comment: 'The system of the Instance.'
	})
	public system: string | null;

	/**
	 * インスタンスのユーザー数
	 */
	@Column('integer', {
		default: 0,
		comment: 'The count of the users of the Instance.'
	})
	public usersCount: number;

	/**
	 * インスタンスの投稿数
	 */
	@Column('integer', {
		default: 0,
		comment: 'The count of the notes of the Instance.'
	})
	public notesCount: number;

	/**
	 * このインスタンスのユーザーからフォローされている、自インスタンスのユーザーの数
	 */
	@Column('integer', {
		default: 0,
	})
	public followingCount: number;

	/**
	 * このインスタンスのユーザーをフォローしている、自インスタンスのユーザーの数
	 */
	@Column('integer', {
		default: 0,
	})
	public followersCount: number;

	/**
	 * ドライブ使用量
	 */
	@Column('bigint', {
		default: 0,
	})
	public driveUsage: number;

	/**
	 * ドライブのファイル数
	 */
	@Column('integer', {
		default: 0,
	})
	public driveFiles: number;

	/**
	 * 直近のリクエスト送信日時
	 */
	@Column('timestamp with time zone', {
		nullable: true,
	})
	public latestRequestSentAt: Date | null;

	/**
	 * 直近のリクエスト送信時のHTTPステータスコード
	 */
	@Column('integer', {
		nullable: true,
	})
	public latestStatus: number | null;

	/**
	 * 直近のリクエスト受信日時
	 */
	@Column('timestamp with time zone', {
		nullable: true,
	})
	public latestRequestReceivedAt: Date | null;

	/**
	 * このインスタンスと最後にやり取りした日時
	 */
	@Column('timestamp with time zone')
	public lastCommunicatedAt: Date;

	/**
	 * このインスタンスと不通かどうか
	 */
	@Column('boolean', {
		default: false
	})
	public isNotResponding: boolean;

	/**
	 * このインスタンスが閉鎖済みとしてマークされているか
	 */
	@Column('boolean', {
		default: false
	})
	public isMarkedAsClosed: boolean;
}
