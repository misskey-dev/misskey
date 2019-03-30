import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user';
import { DriveFile } from './drive-file';
import { id } from '../id';

@Entity()
export class MessagingMessage {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column('timestamp with time zone', {
		comment: 'The created date of the MessagingMessage.'
	})
	public createdAt: Date;

	@Index()
	@Column({
		...id(),
		comment: 'The sender user ID.'
	})
	public userId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public user: User | null;

	@Index()
	@Column({
		...id(),
		comment: 'The recipient user ID.'
	})
	public recipientId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public recipient: User | null;

	@Column('varchar', {
		length: 4096, nullable: true
	})
	public text: string | null;

	@Column('boolean', {
		default: false,
	})
	public isRead: boolean;

	@Column({
		...id(),
		nullable: true,
	})
	public fileId: DriveFile['id'] | null;

	@ManyToOne(type => DriveFile, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public file: DriveFile | null;
}
