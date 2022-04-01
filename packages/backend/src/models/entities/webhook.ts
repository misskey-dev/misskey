import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user.js';
import { id } from '../id.js';

export const webhookEventTypes = ['mention', 'unfollow', 'follow', 'followed', 'note', 'reply', 'renote', 'reaction'] as const;

@Entity()
export class Webhook {
	@PrimaryColumn(id())
	public id: string;

	@Column('timestamp with time zone', {
		comment: 'The created date of the Antenna.',
	})
	public createdAt: Date;

	@Index()
	@Column({
		...id(),
		comment: 'The owner ID.',
	})
	public userId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: User | null;

	@Column('varchar', {
		length: 128,
		comment: 'The name of the Antenna.',
	})
	public name: string;

	@Index()
	@Column('varchar', {
		length: 128, array: true, default: '{}',
	})
	public on: (typeof webhookEventTypes)[number][];

	@Column('varchar', {
		length: 1024,
	})
	public url: string;

	@Column('varchar', {
		length: 1024,
	})
	public secret: string;

	@Index()
	@Column('boolean', {
		default: true,
	})
	public active: boolean;

	/**
	 * 直近のリクエスト送信日時
	 */
	@Column('timestamp with time zone', {
		nullable: true,
	})
	public latestSentAt: Date | null;

	/**
	 * 直近のリクエスト送信時のHTTPステータスコード
	 */
	@Column('integer', {
		nullable: true,
	})
	public latestStatus: number | null;
}
