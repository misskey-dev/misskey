import { Entity, PrimaryGeneratedColumn, Index, Column } from 'typeorm';
import { User } from './user';

@Entity()
export class Hashtag {
	@PrimaryGeneratedColumn()
	public id: number;

	@Index({ unique: true })
	@Column('varchar', {
		length: 128
	})
	public tag: string;

	@Column('integer', {
		array: true,
	})
	public mentionedUserIds: User['id'][];

	@Index()
	@Column('integer', {
		default: 0
	})
	public mentionedUsersCount: number;

	@Column('integer', {
		array: true,
	})
	public mentionedLocalUserIds: User['id'][];

	@Index()
	@Column('integer', {
		default: 0
	})
	public mentionedLocalUsersCount: number;

	@Column('integer', {
		array: true,
	})
	public mentionedRemoteUserIds: User['id'][];

	@Index()
	@Column('integer', {
		default: 0
	})
	public mentionedRemoteUsersCount: number;

	@Column('integer', {
		array: true,
	})
	public attachedUserIds: User['id'][];

	@Index()
	@Column('integer', {
		default: 0
	})
	public attachedUsersCount: number;

	@Column('integer', {
		array: true,
	})
	public attachedLocalUserIds: User['id'][];

	@Index()
	@Column('integer', {
		default: 0
	})
	public attachedLocalUsersCount: number;

	@Column('integer', {
		array: true,
	})
	public attachedRemoteUserIds: User['id'][];

	@Index()
	@Column('integer', {
		default: 0
	})
	public attachedRemoteUsersCount: number;
}
