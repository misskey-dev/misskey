import { JoinColumn, ManyToOne, Entity, PrimaryColumn, Index, Column } from 'typeorm';
import { User } from './user';

@Entity()
export class DriveFolder {
	@PrimaryColumn('char', { length: 26 })
	public id: string;

	@Index()
	@Column('date', {
		comment: 'The created date of the DriveFolder.'
	})
	public createdAt: Date;

	@Column('varchar', {
		length: 128,
		comment: 'The name of the DriveFolder.'
	})
	public name: string;

	@Index()
	@Column('integer', {
		nullable: true,
		comment: 'The owner ID.'
	})
	public userId: User['id'] | null;

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public user: User | null;

	@Index()
	@Column('integer', {
		nullable: true,
		comment: 'The parent folder ID. If null, it means the DriveFolder is located in root.'
	})
	public parentId: DriveFolder['id'] | null;

	@ManyToOne(type => DriveFolder, {
		onDelete: 'SET NULL'
	})
	@JoinColumn()
	public parent: DriveFolder | null;
}
