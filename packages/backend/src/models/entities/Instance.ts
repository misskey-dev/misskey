import { Entity, PrimaryColumn, Index, Column } from 'typeorm';
import { id } from '../id.js';

@Entity()
export class Instance {
	@PrimaryColumn(id())
	public id: string;

	/**
	 * このインスタンスを捕捉した日時
	 */
	@Index()
	@Column('timestamp with time zone', {
		comment: 'The caught date of the Instance.',
	})
	public caughtAt: Date;

	/**
	 * ホスト
	 */
	@Index({ unique: true })
	@Column('varchar', {
		length: 128,
		comment: 'The host of the Instance.',
	})
	public host: string;

	/**
	 * インスタンスのユーザー数
	 */
	@Column('integer', {
		default: 0,
		comment: 'The count of the users of the Instance.',
	})
	public usersCount: number;

	/**
	 * インスタンスの投稿数
	 */
	@Column('integer', {
		default: 0,
		comment: 'The count of the notes of the Instance.',
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
		default: false,
	})
	public isNotResponding: boolean;

	/**
	 * このインスタンスへの配信を停止するか
	 */
	@Index()
	@Column('boolean', {
		default: false,
	})
	public isSuspended: boolean;

	@Column('varchar', {
		length: 64, nullable: true,
		comment: 'The software of the Instance.',
	})
	public softwareName: string | null;

	@Column('varchar', {
		length: 64, nullable: true,
	})
	public softwareVersion: string | null;

	@Column('boolean', {
		nullable: true,
	})
	public openRegistrations: boolean | null;

	@Column('varchar', {
		length: 256, nullable: true,
	})
	public name: string | null;

	@Column('varchar', {
		length: 4096, nullable: true,
	})
	public description: string | null;

	@Column('varchar', {
		length: 128, nullable: true,
	})
	public maintainerName: string | null;

	@Column('varchar', {
		length: 256, nullable: true,
	})
	public maintainerEmail: string | null;

	@Column('varchar', {
		length: 256, nullable: true,
	})
	public iconUrl: string | null;

	@Column('varchar', {
		length: 256, nullable: true,
	})
	public faviconUrl: string | null;

	@Column('varchar', {
		length: 64, nullable: true,
	})
	public themeColor: string | null;

	@Column('timestamp with time zone', {
		nullable: true,
	})
	public infoUpdatedAt: Date | null;
}
