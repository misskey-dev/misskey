import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { id } from '../id.js';
import { User } from './User.js';
import { DriveFile } from './DriveFile.js';
import { UserGroup } from './UserGroup.js';

@Entity()
export class MessagingMessage {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column('timestamp with time zone', {
		comment: 'The created date of the MessagingMessage.',
	})
	public createdAt: Date;

	@Index()
	@Column({
		...id(),
		comment: 'The sender user ID.',
	})
	public userId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: User | null;

	@Index()
	@Column({
		...id(), nullable: true,
		comment: 'The recipient user ID.',
	})
	public recipientId: User['id'] | null;

	@ManyToOne(type => User, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public recipient: User | null;

	@Index()
	@Column({
		...id(), nullable: true,
		comment: 'The recipient group ID.',
	})
	public groupId: UserGroup['id'] | null;

	@ManyToOne(type => UserGroup, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public group: UserGroup | null;

	@Column('varchar', {
		length: 4096, nullable: true,
	})
	public text: string | null;

	@Column('boolean', {
		default: false,
	})
	public isRead: boolean;

	@Column('varchar', {
		length: 512, nullable: true,
	})
	public uri: string | null;

	@Column({
		...id(),
		array: true, default: '{}',
	})
	public reads: User['id'][];

	@Column({
		...id(),
		nullable: true,
	})
	public fileId: DriveFile['id'] | null;

	@ManyToOne(type => DriveFile, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public file: DriveFile | null;
}
