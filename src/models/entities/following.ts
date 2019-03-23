import { PrimaryGeneratedColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user';

@Entity()
@Index(['followerId', 'followeeId'], { unique: true })
export class Following {
	@PrimaryGeneratedColumn()
	public id: number;

	@Index()
	@Column('date', {
		comment: 'The created date of the Following.'
	})
	public createdAt: Date;

	@Index()
	@Column('varchar', {
		length: 24,
		comment: 'The followee user ID.'
	})
	public followeeId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public followee: User | null;

	@Index()
	@Column('varchar', {
		length: 24,
		comment: 'The follower user ID.'
	})
	public followerId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public follower: User | null;

	//#region Denormalized fields
	@Column('varchar', {
		length: 128, nullable: true,
		comment: '[Denormalized]'
	})
	public followerHost: string | null;

	@Column('varchar', {
		length: 256, nullable: true,
		comment: '[Denormalized]'
	})
	public followerInbox: string | null;

	@Column('varchar', {
		length: 256, nullable: true,
		comment: '[Denormalized]'
	})
	public followerSharedInbox: string | null;

	@Column('varchar', {
		length: 128, nullable: true,
		comment: '[Denormalized]'
	})
	public followeeHost: string | null;

	@Column('varchar', {
		length: 256, nullable: true,
		comment: '[Denormalized]'
	})
	public followeeInbox: string | null;

	@Column('varchar', {
		length: 256, nullable: true,
		comment: '[Denormalized]'
	})
	public followeeSharedInbox: string | null;
	//#endregion
}
