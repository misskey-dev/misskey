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
	 * インスタンスのユーザー数
	 */
	@Index()
	@Column('integer', {
		default: 0,
		comment: 'The count of the users of the Instance.'
	})
	public usersCount: number;

	/**
	 * インスタンスの投稿数
	 */
	@Index()
	@Column('integer', {
		default: 0,
		comment: 'The count of the notes of the Instance.'
	})
	public notesCount: number;

	/**
	 * このインスタンスのユーザーからフォローされている、自インスタンスのユーザーの数
	 */
	@Index()
	@Column('integer', {
		default: 0,
	})
	public followingCount: number;

	/**
	 * このインスタンスのユーザーをフォローしている、自インスタンスのユーザーの数
	 */
	@Index()
	@Column('integer', {
		default: 0,
	})
	public followersCount: number;

	/**
	 * ドライブ使用量
	 */
	@Index()
	@Column('bigint', {
		default: 0,
	})
	public driveUsage: number;

	/**
	 * ドライブのファイル数
	 */
	@Index()
	@Column('integer', {
		default: 0,
	})
	public driveFiles: number;

	/**
	 * 直近のリクエスト送信日時
	 */
	@Index()
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
	@Index()
	@Column('timestamp with time zone', {
		nullable: true,
	})
	public latestRequestReceivedAt: Date | null;

	/**
	 * このインスタンスと最後にやり取りした日時
	 */
	@Index()
	@Column('timestamp with time zone')
	public lastCommunicatedAt: Date;

	/**
	 * このインスタンスと不通かどうか
	 */
	@Index()
	@Column('boolean', {
		default: false
	})
	public isNotResponding: boolean;

	/**
	 * このインスタンスが閉鎖済みとしてマークされているか
	 */
	@Index()
	@Column('boolean', {
		default: false
	})
	public isMarkedAsClosed: boolean;

	@Index()
	@Column('varchar', {
		length: 64, nullable: true, default: null,
		comment: 'The software of the Instance.'
	})
	public softwareName: string | null;

	@Index()
	@Column('varchar', {
		length: 64, nullable: true, default: null,
	})
	public softwareVersion: string | null;

	@Column('boolean', {
		nullable: true, default: null,
	})
	public openRegistrations: boolean | null;

	@Column('jsonb', {
		nullable: true, default: null,
	})
	public metadata: Record<string, any> | null;

	@Column('varchar', {
		length: 256, nullable: true, default: null,
	})
	public name: string | null;

	@Column('varchar', {
		length: 4096, nullable: true, default: null,
	})
	public description: string | null;

	@Column('varchar', {
		length: 128, nullable: true, default: null,
	})
	public maintainerName: string | null;

	@Column('varchar', {
		length: 256, nullable: true, default: null,
	})
	public maintainerEmail: string | null;

	@Index()
	@Column('timestamp with time zone', {
		nullable: true,
	})
	public infoUpdatedAt: Date | null;
}
