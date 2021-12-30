import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user';
import { id } from '../id';

@Entity()
export class AbuseUserReport {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column('timestamp with time zone', {
		comment: 'The created date of the AbuseUserReport.',
	})
	public createdAt: Date;

	@Index()
	@Column(id())
	public targetUserId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public targetUser: User | null;

	@Index()
	@Column(id())
	public reporterId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public reporter: User | null;

	@Column({
		...id(),
		nullable: true,
	})
	public assigneeId: User['id'] | null;

	@ManyToOne(type => User, {
		onDelete: 'SET NULL',
	})
	@JoinColumn()
	public assignee: User | null;

	@Index()
	@Column('boolean', {
		default: false,
	})
	public resolved: boolean;

	@Column('varchar', {
		length: 2048,
	})
	public comment: string;

	//#region Denormalized fields
	@Index()
	@Column('varchar', {
		length: 128, nullable: true,
		comment: '[Denormalized]',
	})
	public targetUserHost: string | null;

	@Index()
	@Column('varchar', {
		length: 128, nullable: true,
		comment: '[Denormalized]',
	})
	public reporterHost: string | null;
	//#endregion
}
