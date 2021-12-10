import { JoinColumn, ManyToOne, Entity, PrimaryColumn, Index, Column } from 'typeorm';
import { User } from './user';
import { id } from '../id';

@Entity()
export class DriveFolder {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column('timestamp with time zone', {
		comment: 'The created date of the DriveFolder.',
	})
	public createdAt: Date;

	@Column('varchar', {
		length: 128,
		comment: 'The name of the DriveFolder.',
	})
	public name: string;

	@Index()
	@Column({
		...id(),
		nullable: true,
		comment: 'The owner ID.',
	})
	public userId: User['id'] | null;

	@ManyToOne(type => User, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: User | null;

	@Index()
	@Column({
		...id(),
		nullable: true,
		comment: 'The parent folder ID. If null, it means the DriveFolder is located in root.',
	})
	public parentId: DriveFolder['id'] | null;

	@ManyToOne(type => DriveFolder, {
		onDelete: 'SET NULL',
	})
	@JoinColumn()
	public parent: DriveFolder | null;
}
